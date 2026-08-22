"""
Upload Quota Service

Enforces the per-user daily upload allowance (audit finding H2).

The counter is stored in upload_quota keyed by (user_id, day_utc). A missing
row is inserted; a concurrent insert loses on the composite primary key and
falls back to read-modify-write, so counts can never be lost or duplicated.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.upload_quota import UploadQuota

logger = logging.getLogger(__name__)


def _utc_today():
    """Current UTC calendar day (isolated for testability)."""
    return datetime.now(timezone.utc).date()


def seconds_until_next_utc_day() -> int:
    """Seconds remaining until the quota window resets (used for Retry-After)."""
    now = datetime.now(timezone.utc)
    next_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    return max(int((next_day.timestamp() + 86_400) - now.timestamp()), 1)


async def consume_daily_upload_quota(session: AsyncSession, user_id) -> bool:
    """
    Consume one unit of today's upload allowance for the user.

    Returns True when the user is still within their daily limit,
    False when today's allowance is exhausted.

    Concurrent first-uploads-of-the-day race on the composite primary key;
    the loser retries until the winner's row becomes visible.
    """
    settings = get_settings()
    limit = settings.max_uploads_per_user_per_day
    today = _utc_today()

    max_attempts = 5
    for _ in range(max_attempts):
        row = await session.get(UploadQuota, (user_id, today))

        if row is None:
            session.add(UploadQuota(user_id=user_id, day_utc=today, count=1))
            try:
                await session.commit()
                return True
            except IntegrityError:
                # Another request created today's row first — retry and merge.
                await session.rollback()
                continue

        if row.count >= limit:
            return False

        row.count += 1
        session.add(row)
        await session.commit()
        return True

    logger.error(
        "upload_quota row never became visible for user %s after %d attempts",
        user_id,
        max_attempts,
    )
    raise RuntimeError("Could not update upload quota due to concurrent writes")
