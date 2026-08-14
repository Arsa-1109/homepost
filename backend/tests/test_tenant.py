import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority
from app.models.announcement import Announcement
from app.models.document import Document


async def test_tenant_profile_summary(client: AsyncClient, seed_data):
    """GET /tenant/profile returns tenant's property details, unit, and rent details."""
    tenant = seed_data["tenant"]
    app.dependency_overrides[get_current_user] = lambda: tenant

    try:
        res = await client.get("/api/v1/tenant/profile")
        assert res.status_code == 200
        data = res.json()
        assert data["property_name"] == "Oakview Residency"
        assert data["unit_label"] == "Unit 4B"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_tenant_maintenance_submission_and_landlord_email(
    client: AsyncClient, seed_data, mock_emails, mock_storage
):
    """POST /tenant/maintenance creates request, audit event, and emails the landlord."""
    tenant = seed_data["tenant"]
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: tenant

    try:
        res = await client.post(
            "/api/v1/tenant/maintenance",
            json={
                "title": "Broken Heater",
                "description": "The bedroom radiator is making noise and not heating.",
                "priority": "urgent",
            },
        )
        assert res.status_code == 200
        req_data = res.json()
        req_id = req_data["id"]
        assert req_data["status"] == "open"
        assert req_data["priority"] == "urgent"

        # Verify email dispatched to landlord
        assert any(
            email["to"] == landlord.email and "New Maintenance Request" in email["subject"]
            for email in mock_emails
        )

        # List tenant requests
        list_res = await client.get("/api/v1/tenant/maintenance")
        assert list_res.status_code == 200
        assert any(r["id"] == req_id for r in list_res.json())

        # View audit timeline events
        events_res = await client.get(f"/api/v1/tenant/maintenance/{req_id}/events")
        assert events_res.status_code == 200
        assert len(events_res.json()) >= 1
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_tenant_close_and_reopen_request(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Test closing and reopening maintenance requests from tenant portal."""
    tenant = seed_data["tenant"]
    profile = seed_data["profile"]
    unit = seed_data["unit"]

    # 1. Create a resolved request to test reopening
    resolved_req_1 = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="Door handle loose",
        description="Front door handle wiggles.",
        priority=RequestPriority.LOW,
        status=RequestStatus.RESOLVED,
    )
    # 2. Create another resolved request to test closing
    resolved_req_2 = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="Lightbulb replaced",
        description="Hallway bulb was replaced.",
        priority=RequestPriority.LOW,
        status=RequestStatus.RESOLVED,
    )
    db_session.add(resolved_req_1)
    db_session.add(resolved_req_2)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: tenant

    try:
        # Reopen resolved request 1
        reopen_res = await client.post(
            f"/api/v1/tenant/maintenance/{resolved_req_1.id}/reopen",
            json={"notes": "Handle fell off again today."},
        )
        assert reopen_res.status_code == 200
        assert reopen_res.json()["status"] == "open"

        # Close resolved request 2
        close_res = await client.post(f"/api/v1/tenant/maintenance/{resolved_req_2.id}/close")
        assert close_res.status_code == 200
        assert close_res.json()["status"] == "closed"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_tenant_announcements_and_documents(
    client: AsyncClient, seed_data, db_session: AsyncSession, mock_storage
):
    """Test tenant views announcements and shared documents scoped to their property/unit."""
    tenant = seed_data["tenant"]
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit"]

    # Seed announcement
    ann = Announcement(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=None,  # property-wide
        author_id=landlord.id,
        title="Fire Alarm Inspection",
        body="Annual fire alarm inspection next Tuesday.",
    )
    # Seed document
    doc = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=unit.id,
        uploaded_by=landlord.id,
        title="Unit 4B Lease Agreement",
        file_key="documents/unit-4b-lease.pdf",
        file_type="application/pdf",
    )
    db_session.add(ann)
    db_session.add(doc)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: tenant

    try:
        # Check announcements
        ann_res = await client.get("/api/v1/tenant/announcements")
        assert ann_res.status_code == 200
        assert any(a["id"] == str(ann.id) for a in ann_res.json())

        # Check documents
        doc_res = await client.get("/api/v1/tenant/documents")
        assert doc_res.status_code == 200
        assert any(d["id"] == str(doc.id) for d in doc_res.json())
    finally:
        app.dependency_overrides.pop(get_current_user, None)
