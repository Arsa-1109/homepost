"""
APScheduler Service — Automated Rent & Lease Reminders

Runs a daily job at 9:00 AM IST that:
1. Checks for tenants with rent due within 5 days → sends rent reminder.
2. Checks for tenants with lease expiry within 30 days → sends lease expiry reminder.

Resilience (audit finding H6):
- Each tenant is processed inside its own try/except; one bad row can no
  longer abort the whole batch. Failures are summarized in a warning log.
- A Postgres advisory lock (`pg_try_advisory_lock`) is acquired at job start,
  so multi-replica deployments no longer send duplicate reminders. The lock
  self-releases on connection close and via explicit unlock at job end.
  Non-Postgres databases (dev/test SQLite) bypass locking entirely.
- The job registers misfire_grace_time=3600, coalesce=True, max_instances=1,
  plus structured error/misfire listeners.

Emails are sent through the non-blocking wrappers introduced by H1 so the
event loop stays responsive during Resend IO.

Started via FastAPI lifespan event in main.py.
"""

import logging
from datetime import date

from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_MISSED
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import async_session_maker
from app.models.tenant_profile import TenantProfile
from app.models.unit import Unit
from app.models.user import User
from app.services.email import (
    send_lease_expiry_reminder_async,
    send_rent_reminder_async,
)

logger = logging.getLogger(__name__)

REMINDER_LOCK_KEY = "rent_reminders"

# The scheduler instance — started/stopped in main.py lifespan
scheduler = AsyncIOScheduler()


async def _acquire_reminder_lock(session: AsyncSession) -> bool:
    """
    Try to take the distributed reminder lock for this run.

    Returns False when another replica already holds it. Databases without
    advisory locks (SQLite dev/test) always proceed.
    """
    if session.bind.dialect.name != "postgresql":
        return True

    result = await session.execute(
        text("SELECT pg_try_advisory_lock(hashtext(:key))"),
        {"key": REMINDER_LOCK_KEY},
    )
    return bool(result.scalar())


async def _release_reminder_lock(session: AsyncSession) -> None:
    """Release the distributed reminder lock (no-op on non-Postgres)."""
    if session.bind.dialect.name != "postgresql":
        return

    await session.execute(
        text("SELECT pg_advisory_unlock(hashtext(:key))"),
        {"key": REMINDER_LOCK_KEY},
    )


def _next_occurrence(today: date, rent_due_day: int) -> date:
    """
    Next calendar occurrence of `rent_due_day` on or after `today`,
    clamping to the month's last day (e.g., Feb 30 → Feb 28).
    """
    import calendar

    def clamp(year: int, month: int) -> date:
        last_day = calendar.monthrange(year, month)[1]
        return today.replace(
            year=year, month=month, day=min(rent_due_day, last_day)
        )

    candidate = clamp(today.year, today.month)
    if candidate >= today:
        return candidate

    next_month = today.month + 1
    next_year = today.year
    if next_month > 12:
        next_month = 1
        next_year += 1
    return clamp(next_year, next_month)


async def _check_reminders(db_session: AsyncSession | None = None) -> None:
    """
    Daily job: check all active tenants for upcoming rent and lease dates.
    Sends email reminders as needed. One failing tenant never aborts the batch.
    """

    async def _process(session: AsyncSession):
        if not await _acquire_reminder_lock(session):
            logger.info(
                "Rent reminders skipped — another replica holds the '%s' advisory lock",
                REMINDER_LOCK_KEY,
            )
            return

        try:
            today = date.today()

            statement = (
                select(TenantProfile, Unit, User)
                .join(Unit, TenantProfile.unit_id == Unit.id)
                .join(User, TenantProfile.user_id == User.id)
                .where(TenantProfile.is_active == True)  # noqa: E712
            )
            result = await session.execute(statement)
            rows = result.all()

            failures = 0
            for profile, unit, user in rows:
                try:
                    # ------------------------------------------------------
                    # 1. Rent Reminders — milestone days (5 and 1 days)
                    # ------------------------------------------------------
                    rent_due = _next_occurrence(today, unit.rent_due_day)

                    days_until_due = (rent_due - today).days
                    if days_until_due in [5, 1]:
                        logger.info(
                            f"Sending rent reminder to {user.email} — due in {days_until_due} days"
                        )
                        await send_rent_reminder_async(
                            user.email, unit.unit_label, days_until_due
                        )

                    # ------------------------------------------------------
                    # 2. Lease Expiry Reminders — milestone days (30 and 7 days)
                    # ------------------------------------------------------
                    if profile.lease_end:
                        days_until_expiry = (profile.lease_end - today).days
                        if days_until_expiry in [30, 7]:
                            logger.info(
                                f"Sending lease expiry reminder to {user.email} — "
                                f"{days_until_expiry} days remaining"
                            )
                            await send_lease_expiry_reminder_async(
                                user.email, unit.unit_label, days_until_expiry
                            )
                except Exception:
                    failures += 1
                    logger.exception(
                        "Reminder processing failed for tenant %s — continuing with remaining tenants",
                        user.email,
                    )

            if failures:
                logger.warning(
                    "Reminder batch finished with %d failure(s) out of %d tenant(s)",
                    failures,
                    len(rows),
                )
        finally:
            await _release_reminder_lock(session)

    if db_session is not None:
        await _process(db_session)
    else:
        async with async_session_maker() as session:
            await _process(session)


def _on_job_error(event) -> None:
    """Structured warning when the scheduled job itself raises."""
    logger.error(
        "APScheduler job '%s' failed: %s",
        getattr(event, "job_id", "<unknown>"),
        event.exception,
    )


def _on_job_missed(event) -> None:
    """Structured warning when a scheduled run was missed entirely."""
    logger.warning(
        "APScheduler job '%s' missed its scheduled run time "
        "(misfire grace exceeded or replica contention)",
        getattr(event, "job_id", "<unknown>"),
    )


def start_scheduler() -> None:
    """
    Start the APScheduler with the daily reminder job.
    Called from FastAPI lifespan startup.
    """
    scheduler.add_listener(_on_job_error, EVENT_JOB_ERROR)
    scheduler.add_listener(_on_job_missed, EVENT_JOB_MISSED)

    # Run daily at 9:00 AM IST (03:30 UTC)
    scheduler.add_job(
        _check_reminders,
        trigger="cron",
        hour=3,
        minute=30,
        id="daily_reminders",
        replace_existing=True,
        misfire_grace_time=3600,
        coalesce=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info("APScheduler started — daily reminders scheduled at 9:00 AM IST")


def stop_scheduler() -> None:
    """
    Gracefully stop the scheduler.
    Called from FastAPI lifespan shutdown.
    """
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
    # Drop the bound loop so a later start_scheduler() binds to whatever
    # event loop is running then (lifespan/test restart safety).
    scheduler._eventloop = None
