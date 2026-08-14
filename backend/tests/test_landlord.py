import uuid
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority
from app.models.announcement import Announcement
from app.models.document import Document


async def test_property_crud_and_cascade(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Test creating, reading, updating, and deleting properties."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # 1. Create Property
        create_res = await client.post(
            "/api/v1/landlord/properties",
            json={"name": "Maple Heights", "address": "456 Maple Rd", "city": "Bengaluru"},
        )
        assert create_res.status_code == 200
        prop_data = create_res.json()
        prop_id = prop_data["id"]
        assert prop_data["name"] == "Maple Heights"

        # 2. List Properties
        list_res = await client.get("/api/v1/landlord/properties")
        assert list_res.status_code == 200
        assert any(p["id"] == prop_id for p in list_res.json())

        # 3. Update Property
        update_res = await client.put(
            f"/api/v1/landlord/properties/{prop_id}",
            json={"name": "Maple Heights Luxury", "address": "456 Maple Rd", "city": "Bengaluru"},
        )
        assert update_res.status_code == 200
        assert update_res.json()["name"] == "Maple Heights Luxury"

        # Add a unit to test cascade deletion
        unit_res = await client.post(
            "/api/v1/landlord/units",
            json={"property_id": prop_id, "unit_label": "Penthouse 1", "rent_due_day": 1},
        )
        assert unit_res.status_code == 200

        # 4. Delete Property
        del_res = await client.delete(f"/api/v1/landlord/properties/{prop_id}")
        assert del_res.status_code in (200, 204)

        # Verify property is removed
        list_after = await client.get("/api/v1/landlord/properties")
        assert list_after.status_code == 200
        assert not any(p["id"] == prop_id for p in list_after.json())
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_unit_crud(client: AsyncClient, seed_data):
    """Test unit creation, listing, updating, and deleting."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # Create Unit
        create_res = await client.post(
            "/api/v1/landlord/units",
            json={"property_id": str(prop.id), "unit_label": "Unit 101", "rent_due_day": 10},
        )
        assert create_res.status_code == 200
        unit_id = create_res.json()["id"]

        # List units for property
        prop_units = await client.get(f"/api/v1/landlord/properties/{prop.id}/units")
        assert prop_units.status_code == 200
        assert any(u["id"] == unit_id for u in prop_units.json())

        # Update Unit
        update_res = await client.put(
            f"/api/v1/landlord/units/{unit_id}",
            json={"unit_label": "Unit 101-Renovated", "rent_due_day": 15},
        )
        assert update_res.status_code == 200

        # Delete Unit
        del_res = await client.delete(f"/api/v1/landlord/units/{unit_id}")
        assert del_res.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_tenant_approval_and_denial_flows(
    client: AsyncClient, seed_data, db_session: AsyncSession, mock_emails
):
    """Test pending tenants listing, approving with email, and denying with email."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]

    # Create pending tenant 1 for approval
    pending_tenant_1 = User(
        clerk_id="clerk_pending_1",
        email="approveme@homepost.dev",
        full_name="Approve Me",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    # Create pending tenant 2 for denial
    pending_tenant_2 = User(
        clerk_id="clerk_pending_2",
        email="denyme@homepost.dev",
        full_name="Deny Me",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    db_session.add(pending_tenant_1)
    db_session.add(pending_tenant_2)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # 1. List pending tenants
        list_res = await client.get("/api/v1/landlord/pending-tenants")
        assert list_res.status_code == 200
        pending_ids = [u["id"] for u in list_res.json()]
        assert str(pending_tenant_1.id) in pending_ids
        assert str(pending_tenant_2.id) in pending_ids

        # 2. Approve tenant 1
        approve_res = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={"user_id": str(pending_tenant_1.id), "unit_id": str(unit.id)},
        )
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "success"
        assert pending_tenant_1.role == UserRole.TENANT

        # Check approval email dispatched
        assert any(
            email["to"] == pending_tenant_1.email and "Welcome" in email["subject"]
            for email in mock_emails
        )

        # 3. Deny tenant 2
        deny_res = await client.post(
            "/api/v1/landlord/deny-tenant",
            json={"user_id": str(pending_tenant_2.id)},
        )
        assert deny_res.status_code == 200
        assert deny_res.json()["status"] == "success"
        assert pending_tenant_2.role == UserRole.UNASSIGNED

        # Check denial email dispatched
        assert any(
            email["to"] == pending_tenant_2.email and "portal access request" in email["subject"]
            for email in mock_emails
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_maintenance_request_transitions_and_status_email(
    client: AsyncClient, seed_data, db_session: AsyncSession, mock_emails
):
    """Test maintenance status update lifecycle and tenant email dispatch."""
    landlord = seed_data["landlord"]
    tenant_profile = seed_data["profile"]
    unit = seed_data["unit"]

    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=tenant_profile.id,
        unit_id=unit.id,
        title="Leaking Faucet",
        description="Kitchen sink is leaking water continuously.",
        priority=RequestPriority.HIGH,
        status=RequestStatus.OPEN,
    )
    db_session.add(req)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # 1. Update from open -> in_progress
        patch_res = await client.patch(
            f"/api/v1/landlord/maintenance/{req.id}",
            json={"status": "in_progress", "landlord_notes": "Plumber scheduled for tomorrow morning."},
        )
        assert patch_res.status_code == 200
        data = patch_res.json()
        assert data["status"] == "in_progress"

        # Check status update email dispatched to tenant
        assert any(
            "Request Update" in email["subject"]
            for email in mock_emails
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_announcements_and_documents(client: AsyncClient, seed_data, mock_storage):
    """Test landlord announcements and documents creation and listing."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # Create Announcement
        ann_res = await client.post(
            "/api/v1/landlord/announcements",
            json={
                "property_id": str(prop.id),
                "title": "Water Shutdown Notice",
                "body": "Water supply maintenance on Sunday 10am-2pm.",
            },
        )
        assert ann_res.status_code == 200
        ann_id = ann_res.json()["id"]

        # List Announcements
        list_ann = await client.get(f"/api/v1/landlord/announcements?property_id={prop.id}")
        assert list_ann.status_code == 200
        assert any(a["id"] == ann_id for a in list_ann.json())

        # Create Document
        doc_res = await client.post(
            "/api/v1/landlord/documents",
            json={
                "property_id": str(prop.id),
                "title": "Building Rules 2026",
                "file_key": "documents/building-rules.pdf",
                "file_type": "application/pdf",
            },
        )
        assert doc_res.status_code == 200
        doc_id = doc_res.json()["id"]

        # List Documents under property
        list_doc = await client.get(f"/api/v1/landlord/properties/{prop.id}/documents")
        assert list_doc.status_code == 200
        assert any(d["id"] == doc_id for d in list_doc.json())
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_dashboard_summary(client: AsyncClient, seed_data):
    """Test landlord dashboard summary aggregation endpoint."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        res = await client.get("/api/v1/landlord/dashboard")
        assert res.status_code == 200
        data = res.json()
        assert "property_stats" in data
        assert "units" in data
        assert "pending_approvals" in data
        assert "recent_activity" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)
