import uuid
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
from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority
from app.models.maintenance_event import MaintenanceEvent
from app.models.announcement import Announcement
from app.models.document import Document


async def test_bola_file_download_landlord_authorization(
    client: AsyncClient, seed_data, db_session: AsyncSession, mock_storage
):
    """Verify landlords can only download files belonging to their properties."""
    landlord_a = seed_data["landlord"]
    prop_a = seed_data["property"]
    unit_a = seed_data["unit"]
    profile_a = seed_data["profile"]

    # Create Landlord B with Property B
    landlord_b = User(
        id=uuid.uuid4(),
        clerk_id="clerk_landlord_b",
        email="landlord_b@homepost.dev",
        full_name="Landlord B",
        role=UserRole.LANDLORD,
    )
    prop_b = Property(
        id=uuid.uuid4(),
        owner_id=landlord_b.id,
        name="Sunset Villas",
        address="789 Sunset Blvd",
        city="Mumbai",
    )
    unit_b = Unit(
        id=uuid.uuid4(),
        property_id=prop_b.id,
        unit_label="Villa 1",
    )
    db_session.add(landlord_b)
    db_session.add(prop_b)
    db_session.add(unit_b)

    # Documents
    doc_a = Document(
        id=uuid.uuid4(),
        property_id=prop_a.id,
        uploaded_by=landlord_a.id,
        title="Landlord A Lease",
        file_key="documents/prop_a/lease.pdf",
        file_type="application/pdf",
    )
    doc_b = Document(
        id=uuid.uuid4(),
        property_id=prop_b.id,
        uploaded_by=landlord_b.id,
        title="Landlord B Lease",
        file_key="documents/prop_b/lease.pdf",
        file_type="application/pdf",
    )

    # Maintenance Requests with photos
    maint_a = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile_a.id,
        unit_id=unit_a.id,
        title="A's Issue",
        description="Issue in A",
        priority=RequestPriority.LOW,
        status=RequestStatus.OPEN,
        image_keys=["maintenance/prop_a/sink.jpg"],
        landlord_image_keys=["maintenance/prop_a/receipt.jpg"],
    )
    maint_b = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        unit_id=unit_b.id,
        title="B's Issue",
        description="Issue in B",
        priority=RequestPriority.LOW,
        status=RequestStatus.OPEN,
        image_keys=["maintenance/prop_b/roof.jpg"],
    )

    # Announcements with attachments
    ann_a = Announcement(
        id=uuid.uuid4(),
        property_id=prop_a.id,
        author_id=landlord_a.id,
        title="Notice A",
        body="Notice body",
        attachment_keys=["announcements/prop_a/notice.pdf"],
    )
    ann_b = Announcement(
        id=uuid.uuid4(),
        property_id=prop_b.id,
        author_id=landlord_b.id,
        title="Notice B",
        body="Notice body",
        attachment_keys=["announcements/prop_b/notice.pdf"],
    )

    db_session.add_all([doc_a, doc_b, maint_a, maint_b, ann_a, ann_b])
    await db_session.commit()

    # Authenticate as Landlord A
    app.dependency_overrides[get_current_user] = lambda: landlord_a

    try:
        # Landlord A accessing own files -> 200
        res1 = await client.get("/api/v1/uploads/download-url?file_key=documents/prop_a/lease.pdf")
        assert res1.status_code == 200

        res2 = await client.get("/api/v1/uploads/download-url?file_key=maintenance/prop_a/sink.jpg")
        assert res2.status_code == 200

        res3 = await client.get("/api/v1/uploads/download-url?file_key=maintenance/prop_a/receipt.jpg")
        assert res3.status_code == 200

        res4 = await client.get("/api/v1/uploads/download-url?file_key=announcements/prop_a/notice.pdf")
        assert res4.status_code == 200

        # Landlord A trying to access Landlord B's files -> 403 Forbidden
        unauth1 = await client.get("/api/v1/uploads/download-url?file_key=documents/prop_b/lease.pdf")
        assert unauth1.status_code == 403

        unauth2 = await client.get("/api/v1/uploads/download-url?file_key=maintenance/prop_b/roof.jpg")
        assert unauth2.status_code == 403

        unauth3 = await client.get("/api/v1/uploads/download-url?file_key=announcements/prop_b/notice.pdf")
        assert unauth3.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_bola_file_download_tenant_authorization(
    client: AsyncClient, seed_data, db_session: AsyncSession, mock_storage
):
    """Verify tenants can only download files belonging to their assigned property/unit."""
    tenant = seed_data["tenant"]
    prop = seed_data["property"]
    unit = seed_data["unit"]
    profile = seed_data["profile"]

    # Unit document
    doc_unit = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=unit.id,
        uploaded_by=seed_data["landlord"].id,
        title="Unit 4B Lease",
        file_key="documents/unit4b/lease.pdf",
        file_type="application/pdf",
    )
    # Property document (unit_id is None)
    doc_prop = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=None,
        uploaded_by=seed_data["landlord"].id,
        title="Building Rules",
        file_key="documents/prop/rules.pdf",
        file_type="application/pdf",
    )
    # Other unit's document
    doc_other = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=uuid.uuid4(),
        uploaded_by=seed_data["landlord"].id,
        title="Other Unit Lease",
        file_key="documents/unit5c/lease.pdf",
        file_type="application/pdf",
    )
    # Maintenance request by this tenant
    maint_req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="AC Repair",
        description="AC not cooling",
        priority=RequestPriority.HIGH,
        status=RequestStatus.OPEN,
        image_keys=["maintenance/tenant/ac.jpg"],
    )
    # Maintenance request by another tenant
    maint_other = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        unit_id=uuid.uuid4(),
        title="Heater Repair",
        description="Heater issue",
        priority=RequestPriority.LOW,
        status=RequestStatus.OPEN,
        image_keys=["maintenance/other/heater.jpg"],
    )
    # Announcement for this property
    ann = Announcement(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=None,
        author_id=seed_data["landlord"].id,
        title="Pool Cleaning",
        body="Closed on Monday",
        attachment_keys=["announcements/prop/pool.pdf"],
    )

    db_session.add_all([doc_unit, doc_prop, doc_other, maint_req, maint_other, ann])
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: tenant

    try:
        # Tenant accessing own unit doc & property doc -> 200
        res1 = await client.get("/api/v1/uploads/download-url?file_key=documents/unit4b/lease.pdf")
        assert res1.status_code == 200

        res2 = await client.get("/api/v1/uploads/download-url?file_key=documents/prop/rules.pdf")
        assert res2.status_code == 200

        res3 = await client.get("/api/v1/uploads/download-url?file_key=maintenance/tenant/ac.jpg")
        assert res3.status_code == 200

        res4 = await client.get("/api/v1/uploads/download-url?file_key=announcements/prop/pool.pdf")
        assert res4.status_code == 200

        # Tenant accessing other unit's doc -> 403 Forbidden
        unauth1 = await client.get("/api/v1/uploads/download-url?file_key=documents/unit5c/lease.pdf")
        assert unauth1.status_code == 403

        # Tenant accessing other tenant's maintenance image -> 403 Forbidden
        unauth2 = await client.get("/api/v1/uploads/download-url?file_key=maintenance/other/heater.jpg")
        assert unauth2.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_delete_property_and_unit_with_maintenance_events_cascade(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Verify deleting a property or unit with historical maintenance events does not trigger FK errors."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit"]
    profile = seed_data["profile"]

    # Create maintenance request with multiple timeline events
    maint_req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="Plumbing Leak",
        description="Pipe leaking in bathroom",
        priority=RequestPriority.HIGH,
        status=RequestStatus.OPEN,
    )
    db_session.add(maint_req)
    await db_session.commit()

    event1 = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=maint_req.id,
        actor_id=seed_data["tenant"].id,
        event_type="created",
        description="Request submitted by tenant",
    )
    event2 = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=maint_req.id,
        actor_id=landlord.id,
        event_type="status_changed",
        description="Status changed from open to in_progress",
    )
    db_session.add_all([event1, event2])
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # First, deactivate tenant so unit/property deletion is permitted
        profile.is_active = False
        db_session.add(profile)
        await db_session.commit()

        # Delete unit should delete MaintenanceEvent, MaintenanceRequest and unit cleanly
        del_unit_res = await client.delete(f"/api/v1/landlord/units/{unit.id}")
        assert del_unit_res.status_code == 200

        # Verify events and request are removed
        event_check = await db_session.execute(
            select(MaintenanceEvent).where(MaintenanceEvent.maintenance_request_id == maint_req.id)
        )
        assert event_check.scalars().all() == []

        req_check = await db_session.execute(
            select(MaintenanceRequest).where(MaintenanceRequest.id == maint_req.id)
        )
        assert req_check.scalars().first() is None

        # Create a new unit with maintenance request and events, then delete property
        unit2 = Unit(
            id=uuid.uuid4(),
            property_id=prop.id,
            unit_label="Unit 9Z",
        )
        db_session.add(unit2)
        await db_session.commit()

        maint_req2 = MaintenanceRequest(
            id=uuid.uuid4(),
            tenant_id=profile.id,
            unit_id=unit2.id,
            title="Electrical Issue",
            description="Outlet sparked",
            priority=RequestPriority.URGENT,
            status=RequestStatus.OPEN,
        )
        db_session.add(maint_req2)
        await db_session.commit()

        event3 = MaintenanceEvent(
            id=uuid.uuid4(),
            maintenance_request_id=maint_req2.id,
            actor_id=landlord.id,
            event_type="created",
            description="Created by landlord",
        )
        db_session.add(event3)
        await db_session.commit()

        # Delete Property should delete all events, requests, and units under it
        del_prop_res = await client.delete(f"/api/v1/landlord/properties/{prop.id}")
        assert del_prop_res.status_code in (200, 204)

        # Verify property is deleted
        prop_check = await db_session.get(Property, prop.id)
        assert prop_check is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)
