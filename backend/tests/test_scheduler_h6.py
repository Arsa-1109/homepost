"""
H6 — Scheduler fragility (duplicate/lost reminders, no multi-replica safety).

Reproduction tests written BEFORE the fix (TDD RED):
1. A poison tenant row must not abort the whole reminder batch.
2. The job must consult a Postgres advisory lock and skip cleanly when
   another replica already holds it (multi-replica dedupe).
3. The daily job must be registered with misfire_grace_time=3600,
   coalesce=True, max_instances=1, plus error/misfire listeners.
"""

import uuid
from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlmodel import text

from app.services import scheduler as scheduler_mod


POISON_EMAIL = "poison.tenant@homepost.dev"


async def _seed_tenant(db_session, *, email: str, rent_due_day: int, lease_end=None):
    from app.models.user import User, UserRole
    from app.models.unit import Unit
    from app.models.tenant_profile import TenantProfile

    user = User(
        id=uuid.uuid4(),
        clerk_id=f"clerk_sched_{uuid.uuid4().hex[:8]}",
        email=email,
        full_name=email.split("@")[0],
        role=UserRole.TENANT,
    )
    unit = Unit(
        id=uuid.uuid4(),
        property_id=uuid.uuid4(),  # join only needs the row to exist for the query
        unit_label="Sched Unit",
        rent_due_day=rent_due_day,
    )
    profile = TenantProfile(
        id=uuid.uuid4(),
        user_id=user.id,
        unit_id=unit.id,
        lease_start=date.today(),
        lease_end=lease_end,
        is_active=True,
    )
    db_session.add_all([user, unit, profile])
    await db_session.commit()
    return user, unit, profile


def _rent_due_day_five_from_today() -> int:
    """A due day whose next occurrence lands exactly 5 days out (milestone)."""
    return (date.today() + timedelta(days=5)).day


# ---------------------------------------------------------------------------
# 1. Poison tenant must not abort the batch
# ---------------------------------------------------------------------------

async def test_poison_tenant_does_not_abort_batch(db_session, mock_emails):
    healthy_user, _, _ = await _seed_tenant(
        db_session, email="healthy.tenant@homepost.dev",
        rent_due_day=_rent_due_day_five_from_today(),
    )
    poisoned_user, _, _ = await _seed_tenant(
        db_session, email=POISON_EMAIL, rent_due_day=_rent_due_day_five_from_today()
    )

    # Corrupt one row at the storage layer (SQLite is loosely typed) so the
    # date math inside the per-tenant block explodes. Expire cached objects
    # so the job re-reads the poisoned value like a fresh production session.
    await db_session.execute(
        text("UPDATE units SET rent_due_day = 'not-a-number' WHERE id = :uid"),
        {"uid": str(poisoned_user.id)},
    )
    await db_session.commit()
    db_session.expire_all()

    # Must complete without raising despite the poison row...
    await scheduler_mod._check_reminders(db_session)

    recipients = [e["to"] for e in mock_emails]
    assert healthy_user.email in recipients, (
        "healthy tenant lost their reminder because a sibling row crashed the batch"
    )


async def test_batch_failure_summary_logged(db_session, mock_emails, caplog):
    """A failing tenant produces a structured warning summary, not silence."""
    await _seed_tenant(
        db_session, email=POISON_EMAIL, rent_due_day=_rent_due_day_five_from_today()
    )
    await db_session.execute(
        text("UPDATE units SET rent_due_day = 'not-a-number'"),
    )
    await db_session.commit()
    db_session.expire_all()

    import logging
    with caplog.at_level(logging.WARNING):
        try:
            await scheduler_mod._check_reminders(db_session)
        except Exception:
            pytest.fail("job must not propagate per-tenant failures")

    assert any("reminder" in r.message.lower() for r in caplog.records)


# ---------------------------------------------------------------------------
# 2. Advisory lock — multi-replica dedupe
# ---------------------------------------------------------------------------

async def test_job_skips_cleanly_when_advisory_lock_held(db_session, mock_emails, monkeypatch):
    user, _, _ = await _seed_tenant(
        db_session, email="locked.out@homepost.dev",
        rent_due_day=_rent_due_day_five_from_today(),
    )

    async def lock_held(session):
        return False

    monkeypatch.setattr(scheduler_mod, "_acquire_reminder_lock", lock_held, raising=False)

    await scheduler_mod._check_reminders(db_session)

    assert all(e["to"] != user.email for e in mock_emails), (
        "reminder sent even though another replica holds the advisory lock"
    )


async def test_advisory_lock_helpers_are_dialect_aware(db_session):
    """SQLite/dev databases have no advisory locks — helpers must no-op."""
    acquired = await scheduler_mod._acquire_reminder_lock(db_session)
    assert acquired is True
    await scheduler_mod._release_reminder_lock(db_session)  # must not raise


async def test_advisory_lock_uses_postgres_semantics():
    """Deployment contract: pg_try_advisory_lock on a stable hash key."""
    import inspect
    source = inspect.getsource(scheduler_mod)
    assert "pg_try_advisory_lock" in source
    assert "pg_advisory_unlock" in source
    assert "rent_reminders" in source


# ---------------------------------------------------------------------------
# 3. Job registration resilience parameters + listeners
# ---------------------------------------------------------------------------

async def test_daily_job_registered_with_resilience_params():
    start, stop = scheduler_mod.start_scheduler, scheduler_mod.stop_scheduler
    scheduler = scheduler_mod.scheduler

    start()
    try:
        job = scheduler.get_job("daily_reminders")
        assert job is not None
        assert job.misfire_grace_time == 3600
        assert job.coalesce is True
        assert job.max_instances == 1
    finally:
        stop()


async def test_error_and_misfire_listeners_registered():
    from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_MISSED

    scheduler = scheduler_mod.scheduler
    scheduler_mod.start_scheduler()
    try:
        listener_events = {mask for _, mask in scheduler._listeners}
        assert any(mask & EVENT_JOB_ERROR for mask in listener_events), (
            "no JOB_ERROR listener registered"
        )
        assert any(mask & EVENT_JOB_MISSED for mask in listener_events), (
            "no MISFIRE listener registered"
        )
    finally:
        scheduler_mod.stop_scheduler()


# ---------------------------------------------------------------------------
# 4. Scheduler sends via non-blocking email wrappers (H1 integration)
# ---------------------------------------------------------------------------

async def test_scheduler_uses_async_email_wrappers(db_session, monkeypatch):
    """The reminder loop must await async wrappers so Resend IO stays off-loop."""
    calls = []

    async def fake_rent_async(to, unit_label, days):
        calls.append(("rent", to))

    async def fake_lease_async(to, unit_label, days):
        calls.append(("lease", to))

    monkeypatch.setattr(scheduler_mod, "send_rent_reminder_async", fake_rent_async, raising=False)
    monkeypatch.setattr(scheduler_mod, "send_lease_expiry_reminder_async", fake_lease_async, raising=False)

    user, _, _ = await _seed_tenant(
        db_session, email="async.wrapper@homepost.dev",
        rent_due_day=_rent_due_day_five_from_today(),
    )

    await scheduler_mod._check_reminders(db_session)

    assert ("rent", user.email) in set(calls), (
        "scheduler did not route rent reminders through the async wrapper"
    )


async def test_email_sending_exception_resilience_and_lock_release(db_session, monkeypatch, caplog):
    """
    When sending an email fails with an exception for one tenant:
    1. The exception is caught and logged.
    2. The batch failure counter is incremented.
    3. Sibling tenants continue processing and receive their reminders.
    4. The distributed advisory lock is guaranteed to be released.
    """
    import logging

    failing_user, _, _ = await _seed_tenant(
        db_session,
        email="failing.email@homepost.dev",
        rent_due_day=_rent_due_day_five_from_today(),
    )
    succeeding_user, _, _ = await _seed_tenant(
        db_session,
        email="succeeding.email@homepost.dev",
        rent_due_day=_rent_due_day_five_from_today(),
    )

    sent_emails = []
    lock_state = {"acquired": False, "released": False}

    async def flaky_send_rent_async(to, unit_label, days):
        if to == failing_user.email:
            raise RuntimeError("Resend API 500 error / SMTP connection failed")
        sent_emails.append(to)

    async def tracked_acquire_lock(session):
        lock_state["acquired"] = True
        return True

    async def tracked_release_lock(session):
        lock_state["released"] = True

    monkeypatch.setattr(scheduler_mod, "send_rent_reminder_async", flaky_send_rent_async)
    monkeypatch.setattr(scheduler_mod, "_acquire_reminder_lock", tracked_acquire_lock)
    monkeypatch.setattr(scheduler_mod, "_release_reminder_lock", tracked_release_lock)

    with caplog.at_level(logging.WARNING):
        await scheduler_mod._check_reminders(db_session)

    # 1. Remaining/sibling tenant received their reminder email
    assert succeeding_user.email in sent_emails
    assert failing_user.email not in sent_emails

    # 2. Failure was logged as a warning summary and exception
    assert any("failure(s)" in r.message.lower() for r in caplog.records)
    assert any("failing.email@homepost.dev" in r.message for r in caplog.records)

    # 3. Advisory lock was acquired and cleanly released
    assert lock_state["acquired"] is True
    assert lock_state["released"] is True
