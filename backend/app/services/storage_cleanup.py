"""
R2 Storage Cleanup Service (M2)

Collects every storage key that will be orphaned by a property/unit cascade
deletion and queues best-effort background deletions. A failed deletion is
recorded in storage_cleanup_failures for an ops sweep — it never blocks or
fails the user-facing delete response.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import async_session_maker
from app.models.announcement import Announcement
from app.models.document import Document
from app.models.maintenance_request import MaintenanceRequest
from app.models.storage_cleanup_failure import StorageCleanupFailure
from app.services import storage

logger = logging.getLogger(__name__)


def new_session() -> AsyncSession:
    """
    Session seam for background work.

    Tests override this (module attribute) to route failure-row writes into
    the test database instead of the production engine.
    """
    return async_session_maker()


async def collect_unit_storage_keys(session: AsyncSession, unit_id) -> list[str]:
    """All R2 keys attached to content under one unit."""
    keys: list[str] = []

    doc_result = await session.execute(
        select(Document.file_key).where(Document.unit_id == unit_id)
    )
    keys.extend(doc_result.scalars().all())

    req_result = await session.execute(
        select(MaintenanceRequest.image_keys, MaintenanceRequest.landlord_image_keys)
        .where(MaintenanceRequest.unit_id == unit_id)
    )
    for image_keys, landlord_keys in req_result.all():
        keys.extend(image_keys or [])
        keys.extend(landlord_keys or [])

    return [k for k in keys if k]


async def collect_property_storage_keys(session: AsyncSession, property_id) -> list[str]:
    """
    All R2 keys attached to a property and everything under it
    (documents, announcements, and maintenance images across its units).
    """
    from app.models.unit import Unit

    keys: list[str] = []

    doc_result = await session.execute(
        select(Document.file_key).where(Document.property_id == property_id)
    )
    keys.extend(doc_result.scalars().all())

    ann_result = await session.execute(
        select(Announcement.attachment_keys)
        .where(Announcement.property_id == property_id)
    )
    for (attachment_keys,) in ann_result.all():
        keys.extend(attachment_keys or [])

    unit_ids_result = await session.execute(
        select(Unit.id).where(Unit.property_id == property_id)
    )
    for unit_id in unit_ids_result.scalars().all():
        keys.extend(await collect_unit_storage_keys(session, unit_id))

    # Unit-scoped documents were already covered by the unit sweep; dedupe.
    return list(dict.fromkeys(k for k in keys if k))


def _delete_one_key(object_key: str) -> str | None:
    """Delete one key; returns the key on failure, None on success."""
    try:
        storage.delete_object_from_r2(object_key)
        return None
    except Exception as exc:
        logger.warning("R2 cleanup failed for %s: %s", object_key, exc)
        return object_key


async def purge_storage_keys(object_keys: list[str]) -> list[str]:
    """
    Best-effort background deletion of R2 objects.

    Runs inside FastAPI BackgroundTasks (after the response is sent), so any
    latency or failure here never reaches the client. Returns the keys that
    could not be deleted so callers can persist them for an ops sweep.
    """
    import asyncio

    results = await asyncio.gather(
        *(asyncio.to_thread(_delete_one_key, key) for key in object_keys)
    )
    return [key for key in results if key]


async def record_cleanup_failures(failed_keys: list[str]) -> None:
    """
    Persist failed deletions for an ops sweep.

    Opens its own short-lived session via new_session() so failure rows are
    independent of any request transaction. Tests override new_session().
    """
    if not failed_keys:
        return
    async with new_session() as failure_session:
        for key in failed_keys:
            failure_session.add(StorageCleanupFailure(object_key=key))
        await failure_session.commit()
