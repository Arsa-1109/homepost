"""
APScheduler Service — Automated Rent & Lease Reminders

Runs a daily job at 9:00 AM IST that:
1. Checks for tenants with rent due within 5 days → sends rent reminder.
2. Checks for tenants with lease expiry within 30 days → sends lease expiry reminder.

⚠️ REPLICATION CONSTRAINT:
   APScheduler runs in-process (inside FastAPI's lifespan).
   If Railway scales to >1 replica, each container runs its own scheduler,
   causing DUPLICATE EMAILS. For MVP, Railway MUST be locked to 1 replica.
   See: railway.toml → numReplicas = 1

Started via FastAPI lifespan event in main.py.
"""

import logging
from datetime import date, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import async_session_maker
from app.models.tenant_profile import TenantProfile
from app.models.unit import Unit
from app.models.user import User
from app.services.email import send_rent_reminder, send_lease_expiry_reminder

logger = logging.getLogger(__name__)

# The scheduler instance — started/stopped in main.py lifespan
scheduler = AsyncIOScheduler()


async def _check_reminders() -> None:
    """
    Daily job: check all active tenants for upcoming rent and lease dates.
    Sends email reminders as needed.
    """
    today = date.today()

    async with async_session_maker() as session:
        session: AsyncSession

        # ------------------------------------------------------------------
        # 1. Rent Reminders — due within 5 days
        # ------------------------------------------------------------------
        statement = (
            select(TenantProfile, Unit, User)
            .join(Unit, TenantProfile.unit_id == Unit.id)
            .join(User, TenantProfile.user_id == User.id)
            .where(TenantProfile.is_active == True)  # noqa: E712
        )
        result = await session.execute(statement)
        rows = result.all()

        for profile, unit, user in rows:
            # Calculate next rent due date this month
            try:
                rent_due = today.replace(day=unit.rent_due_day)
            except ValueError:
                # Handle months with fewer days (e.g., Feb 30 → Feb 28)
                import calendar
                last_day = calendar.monthrange(today.year, today.month)[1]
                rent_due = today.replace(day=min(unit.rent_due_day, last_day))

            # If rent due is in the past this month, check next month
            if rent_due < today:
                next_month = today.month + 1
                next_year = today.year
                if next_month > 12:
                    next_month = 1
                    next_year += 1
                try:
                    rent_due = rent_due.replace(year=next_year, month=next_month)
                except ValueError:
                    import calendar
                    last_day = calendar.monthrange(next_year, next_month)[1]
                    rent_due = rent_due.replace(
                        year=next_year,
                        month=next_month,
                        day=min(unit.rent_due_day, last_day),
                    )

            days_until_due = (rent_due - today).days
            if 0 < days_until_due <= 5:
                logger.info(
                    f"Sending rent reminder to {user.email} — due in {days_until_due} days"
                )
                send_rent_reminder(user.email, unit.unit_label, days_until_due)

            # ------------------------------------------------------------------
            # 2. Lease Expiry Reminders — within 30 days
            # ------------------------------------------------------------------
            if profile.lease_end:
                days_until_expiry = (profile.lease_end - today).days
                if 0 < days_until_expiry <= 30:
                    logger.info(
                        f"Sending lease expiry reminder to {user.email} — "
                        f"{days_until_expiry} days remaining"
                    )
                    send_lease_expiry_reminder(
                        user.email, unit.unit_label, days_until_expiry
                    )


def start_scheduler() -> None:
    """
    Start the APScheduler with the daily reminder job.
    Called from FastAPI lifespan startup.
    """
    # Run daily at 9:00 AM IST (03:30 UTC)
    scheduler.add_job(
        _check_reminders,
        trigger="cron",
        hour=3,
        minute=30,
        id="daily_reminders",
        replace_existing=True,
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
