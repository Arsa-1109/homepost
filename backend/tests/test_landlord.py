import uuid
from datetime import date, datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.invite import Invite
from app.models.tenant_profile import TenantProfile
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
        assert any(p["id"] == prop_id for p in list_res.json()["items"])

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
        assert not any(p["id"] == prop_id for p in list_after.json()["items"])
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
    # Create a vacant unit for tenant approval
    vacant_unit = Unit(
        id=uuid.uuid4(),
        property_id=seed_data["property"].id,
        unit_label="Unit 2A",
    )
    db_session.add(vacant_unit)
    await db_session.commit()

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
        pending_ids = [u["id"] for u in list_res.json()["items"]]
        assert str(pending_tenant_1.id) in pending_ids
        assert str(pending_tenant_2.id) in pending_ids

        # 2. Approve tenant 1 to vacant unit
        approve_res = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={"user_id": str(pending_tenant_1.id), "unit_id": str(vacant_unit.id)},
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
        assert any(a["id"] == ann_id for a in list_ann.json()["items"])

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
        assert any(d["id"] == doc_id for d in list_doc.json()["items"])
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_dashboard_summary(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Test landlord dashboard summary aggregation endpoint and unit status flags."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit"]

    # Add a second vacant unit with a pending invite
    unit2 = Unit(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_label="Unit 5C",
        rent_due_day=1,
    )
    db_session.add(unit2)
    from app.models.invite import Invite, InviteStatus
    invite = Invite(
        id=uuid.uuid4(),
        token="dash-invite-token",
        unit_id=unit2.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
    )
    db_session.add(invite)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        res = await client.get("/api/v1/landlord/dashboard")
        assert res.status_code == 200
        data = res.json()
        assert "property_stats" in data
        assert "units" in data
        assert "pending_approvals" in data
        assert "recent_activity" in data

        units_by_id = {u["id"]: u for u in data["units"]}
        # Unit 1 is occupied
        assert units_by_id[str(unit.id)]["is_occupied"] is True
        assert units_by_id[str(unit.id)]["has_pending_invite"] is False

        # Unit 2 is vacant with pending invite
        assert units_by_id[str(unit2.id)]["is_occupied"] is False
        assert units_by_id[str(unit2.id)]["has_pending_invite"] is True
        assert units_by_id[str(unit2.id)]["has_pending_maintenance"] is False
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_dashboard_multi_unit_distinct_tenants(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Verify distinct units with distinct tenants display their respective tenant names accurately."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit1 = seed_data["unit"]
    tenant1 = seed_data["tenant"]

    # Create Unit 2 and Tenant 2
    unit2 = Unit(id=uuid.uuid4(), property_id=prop.id, unit_label="Unit 2X", rent_due_day=5)
    db_session.add(unit2)

    tenant2 = User(
        id=uuid.uuid4(),
        clerk_id="clerk_tenant_2",
        email="tenant2@homepost.dev",
        full_name="David SecondTenant",
        role=UserRole.TENANT,
    )
    db_session.add(tenant2)
    await db_session.commit()

    from app.models.tenant_profile import TenantProfile
    profile2 = TenantProfile(
        id=uuid.uuid4(),
        user_id=tenant2.id,
        unit_id=unit2.id,
        is_active=True,
    )
    db_session.add(profile2)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        res = await client.get("/api/v1/landlord/dashboard")
        assert res.status_code == 200
        data = res.json()

        units_by_id = {u["id"]: u for u in data["units"]}
        assert units_by_id[str(unit1.id)]["tenant_name"] == tenant1.full_name
        assert units_by_id[str(unit2.id)]["tenant_name"] == tenant2.full_name

        # Test remove_tenant on unit2
        remove_res = await client.delete(f"/api/v1/landlord/units/{unit2.id}/tenant")
        assert remove_res.status_code == 200

        # After removal, dashboard summary reports unit2 as vacant
        res_after = await client.get("/api/v1/landlord/dashboard")
        assert res_after.status_code == 200
        units_after = {u["id"]: u for u in res_after.json()["units"]}
        assert units_after[str(unit2.id)]["is_occupied"] is False
        assert units_after[str(unit2.id)]["tenant_name"] is None
        assert units_after[str(unit1.id)]["is_occupied"] is True
        assert units_after[str(unit1.id)]["tenant_name"] == tenant1.full_name
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_generate_invite_and_clear_data(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /landlord/generate-invite creates pending invite and optionally archives existing unit documents."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit"]

    # Seed an existing unit document
    doc = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=unit.id,
        uploaded_by=landlord.id,
        title="Prior Tenant Move-in Inspection",
        file_key="documents/prior_inspection.pdf",
        file_type="application/pdf",
        is_archived=False,
    )
    db_session.add(doc)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord
    try:
        # Generate invite with clear_data=True
        res = await client.post(
            "/api/v1/landlord/generate-invite",
            json={"unit_id": str(unit.id), "clear_data": True}
        )
        assert res.status_code == 200
        invite_data = res.json()
        assert invite_data["unit_id"] == str(unit.id)
        assert invite_data["status"] == "pending"
        assert "token" in invite_data

        # Verify previous document was archived
        await db_session.refresh(doc)
        assert doc.is_archived is True
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_dashboard_summary_empty_portfolio(client: AsyncClient, db_session: AsyncSession):
    """GET /landlord/dashboard returns clean zeroes and empty arrays for a landlord with no properties."""
    new_landlord = User(
        id=uuid.uuid4(),
        clerk_id="clerk_empty_landlord",
        email="empty_landlord@homepost.dev",
        role=UserRole.LANDLORD,
    )
    db_session.add(new_landlord)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: new_landlord
    try:
        res = await client.get("/api/v1/landlord/dashboard")
        assert res.status_code == 200
        data = res.json()
        assert data["property_stats"]["total_properties"] == 0
        assert data["property_stats"]["total_units"] == 0
        assert data["property_stats"]["occupied_units"] == 0
        assert data["property_stats"]["vacant_units"] == 0
        assert data["units"] == []
        assert data["urgent_maintenance"] == []
        assert data["pending_approvals"] == []
        assert data["recent_activity"] == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_unit_and_property_document_management(client: AsyncClient, seed_data, mock_storage):
    """Test creating, listing by property, and listing by unit for landlord documents."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit"]

    app.dependency_overrides[get_current_user] = lambda: landlord
    try:
        # 1. Create property-level document
        prop_doc_res = await client.post(
            "/api/v1/landlord/documents",
            json={
                "property_id": str(prop.id),
                "title": "Community Guidelines",
                "file_key": "documents/guidelines.pdf",
                "file_type": "application/pdf",
            }
        )
        assert prop_doc_res.status_code == 200
        prop_doc_id = prop_doc_res.json()["id"]

        # 2. Create unit-specific document
        unit_doc_res = await client.post(
            "/api/v1/landlord/documents",
            json={
                "property_id": str(prop.id),
                "unit_id": str(unit.id),
                "title": "Unit 4B Key Handover Receipt",
                "file_key": "documents/unit_receipt.pdf",
                "file_type": "application/pdf",
            }
        )
        assert unit_doc_res.status_code == 200
        unit_doc_id = unit_doc_res.json()["id"]

        # 3. List by property (should contain both)
        p_docs = await client.get(f"/api/v1/landlord/properties/{prop.id}/documents")
        assert p_docs.status_code == 200
        p_doc_ids = [d["id"] for d in p_docs.json()["items"]]
        assert prop_doc_id in p_doc_ids
        assert unit_doc_id in p_doc_ids

        # 4. List by unit (should contain only unit doc)
        u_docs = await client.get(f"/api/v1/landlord/units/{unit.id}/documents")
        assert u_docs.status_code == 200
        u_doc_ids = [d["id"] for d in u_docs.json()["items"]]
        assert unit_doc_id in u_doc_ids
        assert prop_doc_id not in u_doc_ids
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_announcement_crud_lifecycle(client: AsyncClient, seed_data):
    """Test full CRUD lifecycle for landlord announcements."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]

    app.dependency_overrides[get_current_user] = lambda: landlord
    try:
        # 1. Create
        create_res = await client.post(
            "/api/v1/landlord/announcements",
            json={
                "property_id": str(prop.id),
                "title": "Scheduled Power Outage",
                "body": "Power maintenance on Saturday from 2am-4am.",
            }
        )
        assert create_res.status_code == 200
        ann_id = create_res.json()["id"]

        # 2. Update
        update_res = await client.put(
            f"/api/v1/landlord/announcements/{ann_id}",
            json={"title": "Updated Power Outage Time", "body": "Power maintenance rescheduled to Sunday 1am-3am."}
        )
        assert update_res.status_code == 200
        assert update_res.json()["title"] == "Updated Power Outage Time"

        # 3. Delete
        del_res = await client.delete(f"/api/v1/landlord/announcements/{ann_id}")
        assert del_res.status_code == 204

        # 4. Verify gone
        list_res = await client.get(f"/api/v1/landlord/announcements?property_id={prop.id}")
        assert list_res.status_code == 200
        assert not any(a["id"] == ann_id for a in list_res.json()["items"])
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_generate_invite_persists_lease_dates(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /api/v1/landlord/generate-invite persists lease_start and lease_end onto the Invite record."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        res = await client.post(
            "/api/v1/landlord/generate-invite",
            json={
                "unit_id": str(unit.id),
                "lease_start": "2026-09-01",
                "lease_end": "2027-08-31",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["lease_start"] == "2026-09-01"
        assert data["lease_end"] == "2027-08-31"

        # Verify database record directly
        invite_id = uuid.UUID(data["id"])
        invite_in_db = await db_session.get(Invite, invite_id)
        assert invite_in_db is not None
        assert invite_in_db.lease_start == date(2026, 9, 1)
        assert invite_in_db.lease_end == date(2027, 8, 31)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_create_unit_without_lease_fields(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /api/v1/landlord/units succeeds without providing lease_start or lease_end."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        res = await client.post(
            "/api/v1/landlord/units",
            json={
                "property_id": str(prop.id),
                "unit_label": "Unit 99",
                "rent_due_day": 5,
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["unit_label"] == "Unit 99"
        assert data.get("lease_start") is None
        assert data.get("lease_end") is None

        unit_id = uuid.UUID(data["id"])
        unit_in_db = await db_session.get(Unit, unit_id)
        assert unit_in_db is not None
        assert unit_in_db.lease_start is None
        assert unit_in_db.lease_end is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_approve_tenant_persists_lease_dates(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /api/v1/landlord/approve-tenant saves provided lease_start & lease_end to TenantProfile."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    # Create a fresh vacant unit and pending applicant
    unit_res = await client.post(
        "/api/v1/landlord/units",
        json={"property_id": str(prop.id), "unit_label": "Unit ApproveTest", "rent_due_day": 1},
    )
    assert unit_res.status_code == 200
    unit_id = uuid.UUID(unit_res.json()["id"])

    applicant = User(
        id=uuid.uuid4(),
        clerk_id=f"user_app_{uuid.uuid4()}",
        email="applicant_lease@homepost.dev",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    db_session.add(applicant)
    await db_session.commit()

    try:
        approve_res = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={
                "user_id": str(applicant.id),
                "unit_id": str(unit_id),
                "lease_start": "2026-10-01",
                "lease_end": "2027-09-30",
            },
        )
        assert approve_res.status_code == 200

        # Check tenant profile in database
        stmt = select(TenantProfile).where(TenantProfile.user_id == applicant.id)
        profile_res = await db_session.execute(stmt)
        profile = profile_res.scalar_one_or_none()
        assert profile is not None
        assert profile.lease_start == date(2026, 10, 1)
        assert profile.lease_end == date(2027, 9, 30)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_approve_tenant_fallback_when_dates_omitted(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /api/v1/landlord/approve-tenant falls back to unit lease dates when payload dates are omitted."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    # Create unit with default lease dates
    unit = Unit(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_label="Unit Fallback",
        rent_due_day=1,
        lease_start=date(2026, 1, 1),
        lease_end=date(2026, 12, 31),
        status="Vacant",
    )
    applicant = User(
        id=uuid.uuid4(),
        clerk_id=f"user_app_fb_{uuid.uuid4()}",
        email="applicant_fallback@homepost.dev",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    db_session.add(unit)
    db_session.add(applicant)
    await db_session.commit()

    try:
        approve_res = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={
                "user_id": str(applicant.id),
                "unit_id": str(unit.id),
                # No lease_start or lease_end provided
            },
        )
        assert approve_res.status_code == 200

        stmt = select(TenantProfile).where(TenantProfile.user_id == applicant.id)
        profile_res = await db_session.execute(stmt)
        profile = profile_res.scalar_one_or_none()
        assert profile is not None
        assert profile.lease_start == date(2026, 1, 1)
        assert profile.lease_end == date(2026, 12, 31)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_update_maintenance_request_removes_landlord_attachment(client: AsyncClient, seed_data, db_session: AsyncSession, mock_storage):
    """Test updating a maintenance request to remove an existing landlord attachment key."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]
    profile = seed_data["profile"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    # Create a maintenance request with 2 landlord attachments
    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="AC Water Leakage",
        description="Water leaking from indoor unit.",
        priority=RequestPriority.HIGH,
        status=RequestStatus.IN_PROGRESS,
        landlord_notes="Initial inspection done.",
        landlord_image_keys=["maintenance/req1/photo1.jpg", "maintenance/req1/photo2.jpg"],
    )
    db_session.add(req)
    await db_session.commit()

    try:
        # 1. Update with landlord_image_keys removing photo2.jpg
        patch_res = await client.patch(
            f"/api/v1/landlord/maintenance/{req.id}",
            json={
                "landlord_image_keys": ["maintenance/req1/photo1.jpg"],
            },
        )
        assert patch_res.status_code == 200
        data = patch_res.json()
        assert data["landlord_image_keys"] == ["maintenance/req1/photo1.jpg"]
        assert len(data["landlord_image_urls"]) == 1

        await db_session.refresh(req)
        assert req.landlord_image_keys == ["maintenance/req1/photo1.jpg"]

        # 2. Update using attachments field removing the remaining attachment
        patch_res2 = await client.patch(
            f"/api/v1/landlord/maintenance/{req.id}",
            json={
                "attachments": [],
            },
        )
        assert patch_res2.status_code == 200
        data2 = patch_res2.json()
        assert data2["landlord_image_keys"] == []
        assert len(data2["landlord_image_urls"]) == 0

        await db_session.refresh(req)
        assert req.landlord_image_keys == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_landlord_download_url_authorized_for_all_attached_keys(client: AsyncClient, seed_data, db_session: AsyncSession, mock_storage):
    """Test landlord can generate presigned download URLs for all tenant and landlord attached keys across their units."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]
    profile = seed_data["profile"]

    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="Heater Repair",
        description="Heater not turning on.",
        priority=RequestPriority.MEDIUM,
        status=RequestStatus.IN_PROGRESS,
        image_keys=["maintenance/req_heater/tenant_leak.jpg"],
        landlord_image_keys=["maintenance/req_heater/landlord_receipt.pdf"],
    )
    db_session.add(req)
    await db_session.commit()

    # 1. Authorized Landlord gets download URL for tenant attachment
    app.dependency_overrides[get_current_user] = lambda: landlord
    try:
        res_tenant_key = await client.get("/api/v1/uploads/download-url?file_key=maintenance/req_heater/tenant_leak.jpg")
        assert res_tenant_key.status_code == 200
        assert "download_url" in res_tenant_key.json()
        assert "maintenance/req_heater/tenant_leak.jpg" in res_tenant_key.json()["download_url"]

        # 2. Authorized Landlord gets download URL for landlord attachment
        res_ll_key = await client.get("/api/v1/uploads/download-url?file_key=maintenance/req_heater/landlord_receipt.pdf")
        assert res_ll_key.status_code == 200
        assert "download_url" in res_ll_key.json()
        assert "maintenance/req_heater/landlord_receipt.pdf" in res_ll_key.json()["download_url"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # 3. Unauthorized other landlord is denied
    other_landlord = User(
        id=uuid.uuid4(),
        clerk_id="clerk_other_landlord_777",
        email="otherlandlord@homepost.dev",
        role=UserRole.LANDLORD,
    )
    db_session.add(other_landlord)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: other_landlord
    try:
        denied_res = await client.get("/api/v1/uploads/download-url?file_key=maintenance/req_heater/landlord_receipt.pdf")
        assert denied_res.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_generate_invite_updates_rent_due_day(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /api/v1/landlord/generate-invite updates unit.rent_due_day when provided."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]
    assert unit.rent_due_day != 25  # Initially 1 or something other than 25

    app.dependency_overrides[get_current_user] = lambda: landlord
    try:
        res = await client.post(
            "/api/v1/landlord/generate-invite",
            json={
                "unit_id": str(unit.id),
                "lease_start": "2026-09-01",
                "lease_end": "2027-08-31",
                "rent_due_day": 25,
            },
        )
        assert res.status_code == 200

        # Verify unit rent_due_day was updated in DB
        await db_session.refresh(unit)
        assert unit.rent_due_day == 25
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_batch_create_units(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /api/v1/landlord/units/batch creates multiple units atomically."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        res = await client.post(
            "/api/v1/landlord/units/batch",
            json={
                "property_id": str(prop.id),
                "unit_labels": ["Apt 801", "Apt 802", "Apt 803"],
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 3
        labels = [u["unit_label"] for u in data]
        assert "Apt 801" in labels
        assert "Apt 802" in labels
        assert "Apt 803" in labels

        # Verify duplicate creation in same batch fails
        dup_res = await client.post(
            "/api/v1/landlord/units/batch",
            json={
                "property_id": str(prop.id),
                "unit_labels": ["Apt 801", "Apt 804"],
            },
        )
        assert dup_res.status_code == 400
        assert "already exists" in dup_res.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)

