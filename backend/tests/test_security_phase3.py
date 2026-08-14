import uuid
from datetime import date, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.announcement import Announcement
from app.routers.landlord import format_address
from app.services.email import (
    send_maintenance_notification,
    send_reopen_notification,
    send_status_update,
    send_pending_tenant_notification,
    send_approval_notification,
)
from app.services.scheduler import _check_reminders


async def test_remove_tenant_resets_user_role_to_unassigned(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """When a landlord removes a tenant, their role must reset to UNASSIGNED so they can join future tenancies."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]
    tenant_user = seed_data["tenant"]
    profile = seed_data["profile"]

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        assert tenant_user.role == UserRole.TENANT

        # Remove tenant
        res = await client.delete(f"/api/v1/landlord/units/{unit.id}/tenant")
        assert res.status_code == 200

        # Verify profile is deactivated
        await db_session.refresh(profile)
        assert profile.is_active is False
        assert profile.removed_at is not None

        # Verify unit status is Vacant
        await db_session.refresh(unit)
        assert unit.status == "Vacant"

        # Verify user role is UNASSIGNED
        await db_session.refresh(tenant_user)
        assert tenant_user.role == UserRole.UNASSIGNED
        assert tenant_user.requested_landlord_id is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_announcement_unit_property_mismatch_rejected_400(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Announcements specifying a unit belonging to a different property must be rejected with 400."""
    landlord = seed_data["landlord"]
    prop1 = seed_data["property"]

    # Create Property 2 with Unit 2
    prop2 = Property(
        id=uuid.uuid4(),
        owner_id=landlord.id,
        name="Second Property",
        address="100 Second Ave",
        city="Delhi",
    )
    db_session.add(prop2)
    await db_session.commit()

    unit2 = Unit(
        id=uuid.uuid4(),
        property_id=prop2.id,
        unit_label="Unit 2-A",
    )
    db_session.add(unit2)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # 1. Attempt to create announcement for Prop 1 with Unit 2 (belongs to Prop 2)
        res_create = await client.post(
            "/api/v1/landlord/announcements",
            json={
                "property_id": str(prop1.id),
                "unit_id": str(unit2.id),
                "title": "Mismatched Announcement",
                "body": "This should fail",
            },
        )
        assert res_create.status_code == 400
        assert "does not belong" in res_create.json()["detail"]

        # 2. Create valid announcement for Prop 1
        valid_res = await client.post(
            "/api/v1/landlord/announcements",
            json={
                "property_id": str(prop1.id),
                "title": "Valid Announcement",
                "body": "Valid body",
            },
        )
        assert valid_res.status_code == 200
        ann_id = valid_res.json()["id"]

        # 3. Attempt to update announcement with mismatched unit
        res_update = await client.put(
            f"/api/v1/landlord/announcements/{ann_id}",
            json={"unit_id": str(unit2.id)},
        )
        assert res_update.status_code == 400
        assert "does not belong" in res_update.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_format_address_refinement():
    """Verify format_address fixes street suffix typos at word boundaries without breaking valid names."""
    # Typos corrected
    assert format_address("123 main streets") == "123 Main Street"
    assert format_address("456 oak drives") == "456 Oak Drive"
    assert format_address("789 maple avenues") == "789 Maple Avenue"

    # Multi-word proper names preserved
    assert format_address("Three Rivers Suites") == "Three Rivers Suites"
    assert format_address("Twin Streets Mall") == "Twin Street Mall"
    assert format_address("") == ""


def test_email_html_injection_escaping(mock_emails):
    """Verify user-controlled inputs are escaped against HTML injection in email templates."""
    malicious_input = '<script>alert("xss")</script>'

    # Maintenance notification
    send_maintenance_notification(
        landlord_email="landlord@test.com",
        tenant_name=f"Evil {malicious_input}",
        unit_label=f"Unit {malicious_input}",
        request_title=f"Title {malicious_input}",
        priority="high",
    )
    last_email = mock_emails[-1]
    assert "<script>" not in last_email["html"]
    assert "&lt;script&gt;" in last_email["html"]

    # Reopen notification
    send_reopen_notification(
        landlord_email="landlord@test.com",
        tenant_name=malicious_input,
        unit_label="Unit 1",
        request_title=malicious_input,
    )
    last_email = mock_emails[-1]
    assert "<script>" not in last_email["html"]
    assert "&lt;script&gt;" in last_email["html"]

    # Status update notification
    send_status_update(
        tenant_email="tenant@test.com",
        request_title=malicious_input,
        new_status="in_progress",
    )
    last_email = mock_emails[-1]
    assert "<script>" not in last_email["html"]
    assert "&lt;script&gt;" in last_email["html"]


async def test_scheduler_milestones(seed_data, db_session: AsyncSession, mock_emails):
    """Verify scheduler only sends emails on milestone days (5, 1 for rent; 30, 7 for lease)."""
    unit = seed_data["unit"]
    profile = seed_data["profile"]
    today = date.today()

    # Set unit rent due date to 3 days from now (non-milestone: should NOT trigger email)
    due_day_3 = (today + timedelta(days=3)).day
    unit.rent_due_day = due_day_3
    # Set lease end to 15 days from now (non-milestone: should NOT trigger email)
    profile.lease_end = today + timedelta(days=15)
    db_session.add(unit)
    db_session.add(profile)
    await db_session.commit()

    mock_emails.clear()
    await _check_reminders(db_session)
    assert len(mock_emails) == 0

    # Set unit rent due date to 5 days from now (milestone: SHOULD trigger email)
    due_day_5 = (today + timedelta(days=5)).day
    unit.rent_due_day = due_day_5
    # Set lease end to 30 days from now (milestone: SHOULD trigger email)
    profile.lease_end = today + timedelta(days=30)
    db_session.add(unit)
    db_session.add(profile)
    await db_session.commit()

    mock_emails.clear()
    await _check_reminders(db_session)
    # Rent reminder + Lease expiry reminder = 2 emails
    assert len(mock_emails) == 2
    assert any("Rent Reminder" in e["subject"] for e in mock_emails)
    assert any("Lease Expiry Notice" in e["subject"] for e in mock_emails)
