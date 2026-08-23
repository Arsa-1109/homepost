"""
M2 — Property/unit deletion must not orphan R2 objects.

Pre-delete collection of all storage keys (documents, announcement
attachments, maintenance images) followed by best-effort background R2
deletion. A poisoned key records a failure row but the client response
still succeeds.
"""

import uuid

import pytest
from httpx import AsyncClient

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.announcement import Announcement
from app.models.document import Document
from app.models.maintenance_request import MaintenanceRequest


class _SharedSessionCtx:
    """Async context manager yielding the shared test session (no close)."""

    def __init__(self, session):
        self._session = session

    async def __aenter__(self):
        return self._session

    async def __aexit__(self, *exc):
        return False


def _route_background_session_to_test_db(db_session) -> None:
    """Point storage_cleanup.new_session at the shared test session."""
    from app.services import storage_cleanup

    storage_cleanup.new_session = lambda: _SharedSessionCtx(db_session)


def _override_landlord(seed_data):
    app.dependency_overrides[get_current_user] = lambda: seed_data["landlord"]


def _clear_override():
    app.dependency_overrides.pop(get_current_user, None)


async def _seed_r2_content(db_session, seed_data) -> None:
    """One document + one announcement + one maintenance request with keys."""
    _route_background_session_to_test_db(db_session)
    unit = seed_data["unit"]
    landlord = seed_data["landlord"]

    # Deactivate the seeded tenant so the unit is deletable.
    profile = seed_data["profile"]
    profile.is_active = False
    db_session.add(profile)

    db_session.add(Document(
        id=uuid.uuid4(), property_id=seed_data["property"].id,
        unit_id=unit.id,
        uploaded_by=landlord.id, title="Doc",
        file_key="documents/prop/doc1.pdf", file_type="application/pdf",
    ))
    db_session.add(Announcement(
        id=uuid.uuid4(), property_id=seed_data["property"].id,
        author_id=landlord.id, title="Ann", body="b",
        attachment_keys=["announcements/a1.jpg"],
    ))
    db_session.add(MaintenanceRequest(
        id=uuid.uuid4(), tenant_id=seed_data["profile"].id,
        unit_id=unit.id, title="Req", description="d",
        status="open", priority="medium",
        image_keys=["maintenance/r1/img1.png"],
        landlord_image_keys=["maintenance/r1/landlord1.png"],
    ))
    await db_session.commit()


EXPECTED_UNIT_KEYS = {
    "documents/prop/doc1.pdf",
    "maintenance/r1/img1.png",
    "maintenance/r1/landlord1.png",
}
# Announcements are property-scoped (no unit_id filter in the delete path),
# so their attachment keys are collected by property deletion only.
EXPECTED_PROPERTY_KEYS = EXPECTED_UNIT_KEYS | {"announcements/a1.jpg"}


async def test_unit_deletion_queues_all_storage_keys(
    client: AsyncClient, seed_data, db_session, monkeypatch,
):
    from app.services import storage

    deleted: list[str] = []
    monkeypatch.setattr(storage, "delete_object_from_r2", lambda key: deleted.append(key))

    await _seed_r2_content(db_session, seed_data)
    _override_landlord(seed_data)
    try:
        r = await client.delete(f"/api/v1/landlord/units/{seed_data['unit'].id}")
    finally:
        _clear_override()

    assert r.status_code == 200, r.text
    assert EXPECTED_UNIT_KEYS <= set(deleted), (
        f"R2 cleanup missed keys; deleted={deleted}"
    )


async def test_property_deletion_queues_all_storage_keys(
    client: AsyncClient, seed_data, db_session, monkeypatch,
):
    from app.services import storage

    deleted: list[str] = []
    monkeypatch.setattr(storage, "delete_object_from_r2", lambda key: deleted.append(key))

    await _seed_r2_content(db_session, seed_data)
    _override_landlord(seed_data)
    try:
        r = await client.delete(f"/api/v1/landlord/properties/{seed_data['property'].id}")
    finally:
        _clear_override()

    assert r.status_code == 204, r.text
    assert EXPECTED_PROPERTY_KEYS <= set(deleted)


async def test_poisoned_key_records_failure_and_response_succeeds(
    client: AsyncClient, seed_data, db_session, monkeypatch,
):
    from app.services import storage
    from app.models.storage_cleanup_failure import StorageCleanupFailure
    from sqlalchemy import select

    def flaky_delete(key: str):
        raise RuntimeError("R2 unavailable")

    monkeypatch.setattr(storage, "delete_object_from_r2", flaky_delete)

    await _seed_r2_content(db_session, seed_data)
    _override_landlord(seed_data)
    try:
        r = await client.delete(f"/api/v1/landlord/units/{seed_data['unit'].id}")
    finally:
        _clear_override()

    # Client still gets success — cleanup is best-effort.
    assert r.status_code == 200, r.text

    failures = (await db_session.execute(select(StorageCleanupFailure))).scalars().all()
    assert {f.object_key for f in failures} == EXPECTED_UNIT_KEYS


async def test_happy_path_leaves_no_failure_rows(
    client: AsyncClient, seed_data, db_session, monkeypatch,
):
    from app.services import storage
    from app.models.storage_cleanup_failure import StorageCleanupFailure
    from sqlalchemy import select

    monkeypatch.setattr(storage, "delete_object_from_r2", lambda key: None)

    await _seed_r2_content(db_session, seed_data)
    _override_landlord(seed_data)
    try:
        r = await client.delete(f"/api/v1/landlord/units/{seed_data['unit'].id}")
    finally:
        _clear_override()

    assert r.status_code == 200
    failures = (await db_session.execute(select(StorageCleanupFailure))).scalars().all()
    assert failures == []


async def test_cleanup_service_collects_keys_for_unit(db_session, seed_data):
    """Direct service test of key collection."""
    from app.services.storage_cleanup import collect_unit_storage_keys

    await _seed_r2_content(db_session, seed_data)
    keys = await collect_unit_storage_keys(db_session, seed_data["unit"].id)
    assert EXPECTED_UNIT_KEYS <= set(keys)


async def test_cleanup_service_collects_keys_for_property(db_session, seed_data):
    from app.services.storage_cleanup import collect_property_storage_keys

    await _seed_r2_content(db_session, seed_data)
    keys = await collect_property_storage_keys(db_session, seed_data["property"].id)
    assert EXPECTED_PROPERTY_KEYS <= set(keys)
