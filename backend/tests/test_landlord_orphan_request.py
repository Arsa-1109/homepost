"""
H3 — Null-pointer crash paths in landlord maintenance endpoints.

Reproduction tests written BEFORE the fix (TDD RED):
A MaintenanceRequest whose unit_id points at a deleted unit (orphan row) must
produce clean 404 responses from both endpoints — not AttributeError 500s.
"""

import uuid

import pytest
from httpx import AsyncClient

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.maintenance_request import (
    MaintenanceRequest,
    RequestPriority,
    RequestStatus,
)


def _override(user):
    app.dependency_overrides[get_current_user] = lambda: user


async def _seed_request(db_session, *, unit_id, tenant_id):
    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        unit_id=unit_id,
        title="Leaky tap",
        description="Kitchen tap drips",
        priority=RequestPriority.MEDIUM,
        status=RequestStatus.OPEN,
    )
    db_session.add(req)
    await db_session.commit()
    return req


async def test_patch_maintenance_with_deleted_unit_returns_404(
    client: AsyncClient, seed_data, db_session
):
    """Pre-fix this crashes with 500 (AttributeError on unit.property_id)."""
    req = await _seed_request(
        db_session, unit_id=uuid.uuid4(), tenant_id=seed_data["profile"].id
    )
    _override(seed_data["landlord"])
    try:
        resp = await client.patch(
            f"/api/v1/landlord/maintenance/{req.id}", json={"priority": "high"}
        )
        assert resp.status_code == 404
        assert "Unit not found" in str(resp.json()["detail"])
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_maintenance_events_with_deleted_unit_returns_404(
    client: AsyncClient, seed_data, db_session
):
    """Pre-fix this crashes with 500 (AttributeError on unit.property_id)."""
    req = await _seed_request(
        db_session, unit_id=uuid.uuid4(), tenant_id=seed_data["profile"].id
    )
    _override(seed_data["landlord"])
    try:
        resp = await client.get(f"/api/v1/landlord/maintenance/{req.id}/events")
        assert resp.status_code == 404
        assert "Unit not found" in str(resp.json()["detail"])
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_owner_mismatch_on_maintenance_still_403(
    client: AsyncClient, seed_data, db_session
):
    """The existing ownership check must remain intact after adding null guards."""
    other_landlord = User(
        id=uuid.uuid4(),
        clerk_id=f"clerk_other_{uuid.uuid4().hex[:8]}",
        email=f"other_{uuid.uuid4().hex[:8]}@homepost.dev",
        full_name="Other Landlord",
        role=UserRole.LANDLORD,
    )
    prop = Property(
        id=uuid.uuid4(),
        owner_id=other_landlord.id,
        name="Not Mine",
        address="1 Elsewhere",
        city="Delhi",
    )
    unit = Unit(id=uuid.uuid4(), property_id=prop.id, unit_label="X1", rent_due_day=5)
    db_session.add_all([other_landlord, prop, unit])
    await db_session.commit()

    req = await _seed_request(
        db_session, unit_id=unit.id, tenant_id=seed_data["profile"].id
    )

    _override(seed_data["landlord"])
    try:
        resp = await client.patch(
            f"/api/v1/landlord/maintenance/{req.id}", json={"priority": "low"}
        )
        assert resp.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)
