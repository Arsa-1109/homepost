"""
H7 — Uniform demo-account mutation guards (structural enforcement).

Reproduction tests written BEFORE the fix (TDD RED):
Every MUTATING landlord route must reject demo accounts with the structured
403 DEMO_MUTATION_RESTRICTED payload — enforced at router level so new
endpoints inherit the guard automatically. Every READ route stays accessible
to demo accounts.
"""

import uuid

import pytest
from httpx import AsyncClient

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.maintenance_request import (
    MaintenanceRequest,
    RequestPriority,
    RequestStatus,
)
from app.models.announcement import Announcement


@pytest.fixture
async def demo_landlord(db_session):
    user = User(
        id=uuid.uuid4(),
        clerk_id="user_demo_landlord_001",
        email="landlord@homepost.demo",
        full_name="Marcus Vance (Demo Landlord)",
        role=UserRole.LANDLORD,
    )
    db_session.add(user)
    await db_session.commit()
    app.dependency_overrides[get_current_user] = lambda: user
    yield user
    app.dependency_overrides.pop(get_current_user, None)


def _assert_demo_blocked(resp):
    assert resp.status_code == 403, f"expected 403, got {resp.status_code}: {resp.text}"
    detail = resp.json()["detail"]
    assert isinstance(detail, dict), f"expected structured 403, got: {detail}"
    assert detail.get("code") == "DEMO_MUTATION_RESTRICTED"


# ---------------------------------------------------------------------------
# Mutating routes — the nine previously-unguarded gaps plus regression coverage
# ---------------------------------------------------------------------------

async def test_create_property_blocked(client, demo_landlord):
    resp = await client.post(
        "/api/v1/landlord/properties",
        json={"name": "Pine Court", "address": "9 Pine St", "city": "Pune"},
    )
    _assert_demo_blocked(resp)


async def test_update_property_blocked(client, demo_landlord, seed_data):
    resp = await client.put(
        f"/api/v1/landlord/properties/{seed_data['property'].id}",
        json={"name": "Renamed"},
    )
    _assert_demo_blocked(resp)


async def test_create_unit_blocked(client, demo_landlord, seed_data):
    resp = await client.post(
        "/api/v1/landlord/units",
        json={
            "property_id": str(seed_data["property"].id),
            "unit_label": "Unit 9Z",
            "rent_due_day": 5,
        },
    )
    _assert_demo_blocked(resp)


async def test_update_unit_blocked(client, demo_landlord, seed_data):
    resp = await client.put(
        f"/api/v1/landlord/units/{seed_data['unit'].id}",
        json={"unit_label": "Renamed Unit"},
    )
    _assert_demo_blocked(resp)


async def test_patch_maintenance_blocked(client, demo_landlord, seed_data, db_session):
    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=seed_data["profile"].id,
        unit_id=seed_data["unit"].id,
        title="Drip",
        description="d",
        priority=RequestPriority.MEDIUM,
        status=RequestStatus.OPEN,
    )
    db_session.add(req)
    await db_session.commit()

    resp = await client.patch(
        f"/api/v1/landlord/maintenance/{req.id}", json={"priority": "high"}
    )
    _assert_demo_blocked(resp)


async def test_update_announcement_blocked(client, demo_landlord, seed_data, db_session):
    ann = Announcement(
        id=uuid.uuid4(),
        property_id=seed_data["property"].id,
        author_id=demo_landlord.id,
        title="T",
        body="c",
    )
    db_session.add(ann)
    await db_session.commit()

    resp = await client.put(
        f"/api/v1/landlord/announcements/{ann.id}", json={"title": "New"}
    )
    _assert_demo_blocked(resp)


async def test_create_document_record_blocked(client, demo_landlord, seed_data):
    resp = await client.post(
        "/api/v1/landlord/documents",
        json={
            "property_id": str(seed_data["property"].id),
            "title": "Lease",
            "file_key": "documents/x/y.pdf",
            "file_type": "application/pdf",
        },
    )
    _assert_demo_blocked(resp)


async def test_update_lease_blocked(client, demo_landlord, seed_data):
    resp = await client.put(
        f"/api/v1/landlord/units/{seed_data['unit'].id}/lease",
        json={"lease_start": "2026-09-01", "lease_end": "2027-08-31"},
    )
    _assert_demo_blocked(resp)


# ---------------------------------------------------------------------------
# Read routes — demo accounts keep full read access
# ---------------------------------------------------------------------------

async def test_demo_can_still_read_everything(client, demo_landlord, seed_data):
    """Demo guard must never block reads. Ownership-scoped reads are excluded:
    they 403 for reasons unrelated to the demo guard (demo owns no data)."""
    for path in [
        "/api/v1/landlord/properties",
        "/api/v1/landlord/maintenance",
        "/api/v1/landlord/announcements",
        "/api/v1/landlord/pending-tenants",
        "/api/v1/landlord/dashboard",
    ]:
        resp = await client.get(path)
        assert resp.status_code == 200, f"{path} -> {resp.status_code}"
