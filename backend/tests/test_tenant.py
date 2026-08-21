import uuid
from datetime import date, datetime, timezone
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


async def test_tenant_data_isolation_cross_property(
    client: AsyncClient, seed_data, db_session: AsyncSession, mock_storage
):
    """Test tenant cannot view documents or announcements from another property or unrelated units."""
    tenant = seed_data["tenant"]
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit"]

    from app.models.property import Property
    from app.models.unit import Unit

    # Create another property and unit
    other_prop = Property(id=uuid.uuid4(), owner_id=landlord.id, name="Secret Villa", address="100 Private Way", city="Bengaluru")
    other_unit = Unit(id=uuid.uuid4(), property_id=other_prop.id, unit_label="Villa 1", rent_due_day=1)
    sibling_unit = Unit(id=uuid.uuid4(), property_id=prop.id, unit_label="Unit 4C (Sibling)", rent_due_day=1)
    db_session.add(other_prop)
    db_session.add(other_unit)
    db_session.add(sibling_unit)

    # Document for other property
    other_prop_doc = Document(
        id=uuid.uuid4(),
        property_id=other_prop.id,
        unit_id=None,
        uploaded_by=landlord.id,
        title="Secret Villa Master Plan",
        file_key="documents/secret.pdf",
        file_type="application/pdf",
    )
    # Document for sibling unit in same property
    sibling_unit_doc = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=sibling_unit.id,
        uploaded_by=landlord.id,
        title="Unit 4C Sibling Lease",
        file_key="documents/unit_4c_lease.pdf",
        file_type="application/pdf",
    )
    # Announcement for other property
    other_ann = Announcement(
        id=uuid.uuid4(),
        property_id=other_prop.id,
        unit_id=None,
        author_id=landlord.id,
        title="Secret Villa Gala",
        body="Private event for Villa residents only.",
    )
    db_session.add(other_prop_doc)
    db_session.add(sibling_unit_doc)
    db_session.add(other_ann)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: tenant
    try:
        # Check documents - should NOT contain other_prop_doc or sibling_unit_doc
        doc_res = await client.get("/api/v1/tenant/documents")
        assert doc_res.status_code == 200
        doc_ids = [d["id"] for d in doc_res.json()]
        assert str(other_prop_doc.id) not in doc_ids
        assert str(sibling_unit_doc.id) not in doc_ids

        # Check announcements - should NOT contain other_ann
        ann_res = await client.get("/api/v1/tenant/announcements")
        assert ann_res.status_code == 200
        ann_ids = [a["id"] for a in ann_res.json()]
        assert str(other_ann.id) not in ann_ids
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_tenant_maintenance_detail_and_isolation(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """GET /tenant/maintenance/{id} returns request and isolates from other units."""
    tenant = seed_data["tenant"]
    profile = seed_data["profile"]
    unit = seed_data["unit"]

    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="Bathroom Fan Noise",
        description="Loud grinding noise when bathroom exhaust fan is turned on.",
        priority=RequestPriority.LOW,
        status=RequestStatus.OPEN,
    )
    db_session.add(req)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: tenant
    try:
        # Own request
        res = await client.get(f"/api/v1/tenant/maintenance/{req.id}")
        assert res.status_code == 200
        assert res.json()["id"] == str(req.id)
        assert res.json()["title"] == "Bathroom Fan Noise"

        # Non-existent request -> 404
        fake_res = await client.get(f"/api/v1/tenant/maintenance/{uuid.uuid4()}")
        assert fake_res.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_tenant_profile_endpoint_returns_populated_lease_dates(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """GET /api/v1/tenant/profile returns populated lease_start and lease_end strings."""
    tenant = seed_data["tenant"]
    profile = seed_data["profile"]

    # Assign lease dates to profile
    profile.lease_start = date(2026, 10, 1)
    profile.lease_end = date(2027, 9, 30)
    db_session.add(profile)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: tenant
    try:
        res = await client.get("/api/v1/tenant/profile")
        assert res.status_code == 200
        data = res.json()
        assert data["lease_start"] == "2026-10-01"
        assert data["lease_end"] == "2027-09-30"
        assert data["unit_label"] == "Unit 4B"
        assert data["property_name"] == "Oakview Residency"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_reopen_maintenance_request_resets_stale_landlord_notes_and_images(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Reopening a request resets landlord_notes and landlord_image_keys while preserving history."""
    from app.models.maintenance_event import MaintenanceEvent
    from sqlmodel import select

    tenant = seed_data["tenant"]
    profile = seed_data["profile"]
    unit = seed_data["unit"]

    # Create resolved request with landlord notes & images
    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="Kitchen Sink Leak",
        description="Water pooling under pipe.",
        priority=RequestPriority.HIGH,
        status=RequestStatus.RESOLVED,
        landlord_notes="Replaced the gasket seal.",
        landlord_image_keys=["maintenance/receipt.jpg", "maintenance/fixed_pipe.jpg"],
    )
    db_session.add(req)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: tenant
    try:
        reopen_res = await client.post(
            f"/api/v1/tenant/maintenance/{req.id}/reopen",
            json={"notes": "Leak started dripping again."},
        )
        assert reopen_res.status_code == 200
        data = reopen_res.json()
        assert data["status"] == "open"
        assert data["landlord_notes"] is None
        assert data["landlord_image_keys"] is None

        # Verify in database directly
        await db_session.refresh(req)
        assert req.status == RequestStatus.OPEN
        assert req.landlord_notes is None
        assert req.landlord_image_keys is None

        # Verify timeline events contain the reopening event
        events_res = await db_session.execute(
            select(MaintenanceEvent).where(MaintenanceEvent.maintenance_request_id == req.id)
        )
        events = events_res.scalars().all()
        assert any(e.event_type == "reopened" and "Leak started dripping again." in str(e.payload) for e in events)
    finally:
        app.dependency_overrides.pop(get_current_user, None)

