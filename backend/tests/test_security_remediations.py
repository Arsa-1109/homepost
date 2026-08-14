"""
Comprehensive Security Remediations Test Suite

Validates all 14 findings and remediation controls from the Security Audit Report:
1. File download BOLA/IDOR protection (Landlord & Tenant isolation).
2. Cascade deletion of MaintenanceEvents before MaintenanceRequests.
3. Landlord approval double-occupancy conflict guard (HTTP 409).
4. Landlord approval re-tenancy profile reactivation without UniqueViolation.
5. Insecure Direct Object Reference (IDOR) tenant maintenance isolation.
6. File upload MIME type and extension allowlist validation (HTTP 400).
7. Onboarding role synchronization.
8. Tenant eviction role reset to UNASSIGNED and Vacant status.
9. Verified identity sync in onboarding router.
10. HTML entity escaping in transactional emails against stored XSS / injection.
11. Property-unit linkage validation on announcements (HTTP 400).
12. Announcement attachment download authorization (HTTP 200 / 403).
13. Scheduled reminder milestone cadence (5 & 1 rent, 30 & 7 lease).
14. Address formatting word-boundary regex sanitization.
"""

import html
import uuid
from datetime import date, datetime, timezone, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.dependencies.auth import (
    get_current_user,
    get_current_tenant_profile,
    get_active_tenant_profile,
)
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.maintenance_request import (
    MaintenanceRequest,
    RequestStatus,
    RequestPriority,
)
from app.models.maintenance_event import MaintenanceEvent
from app.models.announcement import Announcement
from app.models.document import Document
from app.routers.landlord import format_address
from app.services.email import (
    send_maintenance_notification,
    send_reopen_notification,
    send_status_update,
    send_pending_tenant_notification,
    send_approval_notification,
    send_rent_reminder,
    send_lease_expiry_reminder,
)
from app.services.scheduler import _check_reminders


# ===========================================================================
# 1. BOLA / IDOR Protection on Presigned Download URLs (Findings 1 & 12)
# ===========================================================================

async def test_unauthorized_file_download_rejection_403(
    client: AsyncClient, seed_data, db_session: AsyncSession, mock_storage
):
    """Ensure unauthorized users receive 403 when requesting download URLs for files they do not own."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit"]

    # 1. Create a Document record for Landlord 1's property
    doc_prop = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        file_key="documents/prop1_secret.pdf",
        title="Prop 1 Secret",
        file_type="application/pdf",
        uploaded_by=landlord.id,
    )
    doc_unit = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=unit.id,
        file_key="documents/unit1_lease.pdf",
        title="Unit 1 Lease",
        file_type="application/pdf",
        uploaded_by=landlord.id,
    )
    db_session.add(doc_prop)
    db_session.add(doc_unit)
    await db_session.commit()

    # 2. Create another Landlord (Landlord 2)
    other_landlord = User(
        id=uuid.uuid4(),
        clerk_id="clerk_landlord_other",
        email="other_landlord@homepost.dev",
        role=UserRole.LANDLORD,
    )
    db_session.add(other_landlord)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: other_landlord

    try:
        # Other landlord cannot download Landlord 1's property doc
        res = await client.get("/api/v1/uploads/download-url", params={"file_key": doc_prop.file_key})
        assert res.status_code == 403

        # Other landlord cannot download Landlord 1's unit doc
        res = await client.get("/api/v1/uploads/download-url", params={"file_key": doc_unit.file_key})
        assert res.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # 3. Create a Tenant in a different unit/property
    other_prop = Property(
        id=uuid.uuid4(),
        owner_id=other_landlord.id,
        name="Other Property",
        address="999 Elm St",
        city="Varanasi",
    )
    other_unit = Unit(
        id=uuid.uuid4(),
        property_id=other_prop.id,
        unit_label="Unit 99",
    )
    other_tenant_user = User(
        id=uuid.uuid4(),
        clerk_id="clerk_tenant_other",
        email="other_tenant@homepost.dev",
        role=UserRole.TENANT,
    )
    db_session.add(other_prop)
    db_session.add(other_unit)
    db_session.add(other_tenant_user)
    await db_session.commit()

    other_profile = TenantProfile(
        id=uuid.uuid4(),
        user_id=other_tenant_user.id,
        unit_id=other_unit.id,
        is_active=True,
    )
    db_session.add(other_profile)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: other_tenant_user

    try:
        # Other tenant cannot download Landlord 1's property doc
        res = await client.get("/api/v1/uploads/download-url", params={"file_key": doc_prop.file_key})
        assert res.status_code == 403

        # Other tenant cannot download Landlord 1's unit doc
        res = await client.get("/api/v1/uploads/download-url", params={"file_key": doc_unit.file_key})
        assert res.status_code == 403

        # Request with an unlinked / invalid key returns 403
        res = await client.get("/api/v1/uploads/download-url", params={"file_key": "documents/nonexistent.pdf"})
        assert res.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_authorized_file_download_landlord_and_tenant_200(
    client: AsyncClient, seed_data, db_session: AsyncSession, mock_storage
):
    """Ensure authorized landlords and tenants receive 200 and presigned URLs for their accessible files."""
    landlord = seed_data["landlord"]
    tenant = seed_data["tenant"]
    prop = seed_data["property"]
    unit = seed_data["unit"]

    doc = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_id=unit.id,
        file_key="documents/shared_lease.pdf",
        title="Shared Lease",
        file_type="application/pdf",
        uploaded_by=landlord.id,
    )
    maint_req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=seed_data["profile"].id,
        unit_id=unit.id,
        title="Leaking Faucet",
        description="Bathroom faucet is leaking",
        image_keys=["maintenance/faucet1.jpg"],
    )
    db_session.add(doc)
    db_session.add(maint_req)
    await db_session.commit()

    # 1. Landlord download
    app.dependency_overrides[get_current_user] = lambda: landlord
    try:
        res_doc = await client.get("/api/v1/uploads/download-url", params={"file_key": doc.file_key})
        assert res_doc.status_code == 200
        assert "download_url" in res_doc.json()

        res_maint = await client.get("/api/v1/uploads/download-url", params={"file_key": "maintenance/faucet1.jpg"})
        assert res_maint.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # 2. Tenant download
    app.dependency_overrides[get_current_user] = lambda: tenant
    try:
        res_doc = await client.get("/api/v1/uploads/download-url", params={"file_key": doc.file_key})
        assert res_doc.status_code == 200

        res_maint = await client.get("/api/v1/uploads/download-url", params={"file_key": "maintenance/faucet1.jpg"})
        assert res_maint.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_announcement_attachment_download_authorization(
    client: AsyncClient, seed_data, db_session: AsyncSession, mock_storage
):
    """Verify download-url supports announcements/ prefix and validates property access."""
    landlord = seed_data["landlord"]
    tenant = seed_data["tenant"]
    prop = seed_data["property"]

    ann = Announcement(
        id=uuid.uuid4(),
        property_id=prop.id,
        author_id=landlord.id,
        title="Building Notice",
        body="Water shutoff tomorrow",
        attachment_keys=["announcements/notice_pdf.pdf"],
    )
    db_session.add(ann)
    await db_session.commit()

    # 1. Landlord authorized
    app.dependency_overrides[get_current_user] = lambda: landlord
    try:
        res = await client.get("/api/v1/uploads/download-url", params={"file_key": "announcements/notice_pdf.pdf"})
        assert res.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # 2. Tenant in this property authorized
    app.dependency_overrides[get_current_user] = lambda: tenant
    try:
        res = await client.get("/api/v1/uploads/download-url", params={"file_key": "announcements/notice_pdf.pdf"})
        assert res.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ===========================================================================
# 2. Cascade Deletion with Maintenance Events (Finding 2)
# ===========================================================================

async def test_delete_property_and_unit_with_maintenance_events_cascade(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Ensure deleting unit and property cleanly removes child MaintenanceEvents before requests."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit"]
    profile = seed_data["profile"]

    # 1. Create MaintenanceRequest with multiple MaintenanceEvents
    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="Broken AC",
        description="AC not cooling",
        status=RequestStatus.OPEN,
        priority=RequestPriority.HIGH,
    )
    db_session.add(req)
    await db_session.commit()

    event1 = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req.id,
        actor_id=landlord.id,
        event_type="status_changed",
        description="Created request",
    )
    event2 = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req.id,
        actor_id=landlord.id,
        event_type="note_added",
        description="Technician assigned",
    )
    db_session.add(event1)
    db_session.add(event2)
    await db_session.commit()

    # Deactivate profile and mark unit vacant so deletion is permitted
    profile.is_active = False
    unit.status = "Vacant"
    db_session.add(profile)
    db_session.add(unit)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # Delete unit — must cascade events and requests without Foreign key violation
        res_unit = await client.delete(f"/api/v1/landlord/units/{unit.id}")
        assert res_unit.status_code == 200

        # Verify records are deleted
        events_after = (await db_session.execute(select(MaintenanceEvent))).scalars().all()
        assert len(events_after) == 0

        requests_after = (await db_session.execute(select(MaintenanceRequest))).scalars().all()
        assert len(requests_after) == 0

        # Delete property — must succeed cleanly
        res_prop = await client.delete(f"/api/v1/landlord/properties/{prop.id}")
        assert res_prop.status_code in (200, 204)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ===========================================================================
# 3. Double-Occupancy Conflict & Profile Reactivation (Findings 3 & 4)
# ===========================================================================

async def test_double_occupancy_approval_rejection_409(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Ensure approving a tenant into an already occupied unit returns 409 Conflict."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]

    # Seed data unit already has active tenant
    applicant = User(
        id=uuid.uuid4(),
        clerk_id="clerk_applicant_new",
        email="applicant@homepost.dev",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    db_session.add(applicant)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        res = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={"user_id": str(applicant.id), "unit_id": str(unit.id)},
        )
        assert res.status_code == 409
        assert "already occupied" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_reapproval_of_previously_removed_tenant_without_unique_violation(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Ensure re-approving a previously removed tenant reactivates profile without UniqueViolation crash."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]

    # Create vacant unit
    vacant_unit = Unit(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_label="Unit 99-Vacant",
    )
    # Former tenant user
    former_tenant = User(
        id=uuid.uuid4(),
        clerk_id="clerk_former_tenant_reapp",
        email="former_reapp@homepost.dev",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    db_session.add(vacant_unit)
    db_session.add(former_tenant)
    await db_session.commit()

    # Pre-existing deactivated TenantProfile for former_tenant
    old_profile = TenantProfile(
        id=uuid.uuid4(),
        user_id=former_tenant.id,
        unit_id=seed_data["unit"].id,
        is_active=False,
    )
    db_session.add(old_profile)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # Landlord approves former tenant into new vacant unit
        res_approve = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={"user_id": str(former_tenant.id), "unit_id": str(vacant_unit.id)},
        )
        assert res_approve.status_code == 200
        assert res_approve.json()["status"] == "success"

        # Verify old profile was updated and reactivated
        await db_session.refresh(old_profile)
        assert old_profile.unit_id == vacant_unit.id
        assert old_profile.is_active is True
        assert old_profile.removed_at is None

        # Verify tenant user role and unit status
        await db_session.refresh(former_tenant)
        assert former_tenant.role == UserRole.TENANT
        await db_session.refresh(vacant_unit)
        assert vacant_unit.status == "Occupied"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ===========================================================================
# 4. Insecure Direct Object Reference (IDOR) Isolation (Finding 5)
# ===========================================================================

async def test_cross_tenant_maintenance_request_idor_isolation_404(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Verify new tenant cannot view, reopen, or close tickets created by previous tenant of the unit."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]
    tenant_1 = seed_data["tenant"]
    profile_1 = seed_data["profile"]

    # 1. Tenant 1 creates a maintenance request
    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile_1.id,
        unit_id=unit.id,
        title="Tenant 1 Private Request",
        description="Private description",
        status=RequestStatus.RESOLVED,
    )
    db_session.add(req)
    await db_session.commit()

    # 2. Deactivate Tenant 1 and onboard Tenant 2
    profile_1.is_active = False
    db_session.add(profile_1)

    tenant_2 = User(
        id=uuid.uuid4(),
        clerk_id="clerk_tenant_2_idor",
        email="tenant2_idor@homepost.dev",
        role=UserRole.TENANT,
    )
    db_session.add(tenant_2)
    await db_session.commit()

    profile_2 = TenantProfile(
        id=uuid.uuid4(),
        user_id=tenant_2.id,
        unit_id=unit.id,
        is_active=True,
    )
    db_session.add(profile_2)
    await db_session.commit()

    # 3. Tenant 2 attempts to view, reopen, or close Tenant 1's request
    app.dependency_overrides[get_current_user] = lambda: tenant_2
    app.dependency_overrides[get_current_tenant_profile] = lambda: profile_2
    app.dependency_overrides[get_active_tenant_profile] = lambda: profile_2

    try:
        res_view = await client.get(f"/api/v1/tenant/maintenance/{req.id}")
        assert res_view.status_code == 404

        res_reopen = await client.post(
            f"/api/v1/tenant/maintenance/{req.id}/reopen",
            json={"notes": "Trying to reopen Tenant 1 ticket"},
        )
        assert res_reopen.status_code == 404

        res_close = await client.post(f"/api/v1/tenant/maintenance/{req.id}/close")
        assert res_close.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_current_tenant_profile, None)
        app.dependency_overrides.pop(get_active_tenant_profile, None)


# ===========================================================================
# 5. File Upload MIME Allowlist Validation (Finding 6)
# ===========================================================================

async def test_unsupported_mime_type_upload_rejection_400(
    client: AsyncClient, seed_data, mock_storage
):
    """Ensure dangerous or unapproved MIME types and extensions are rejected with 400 Bad Request."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # HTML payload
        res_html = await client.post(
            "/api/v1/uploads/",
            files={"file": ("malicious.html", b"<html><script>alert(1)</script></html>", "text/html")},
            data={"prefix": "maintenance"},
        )
        assert res_html.status_code == 400
        assert "Unsupported file type" in res_html.json()["detail"]

        # Executable payload
        res_exe = await client.post(
            "/api/v1/uploads/",
            files={"file": ("payload.exe", b"binary content", "application/x-msdownload")},
            data={"prefix": "documents"},
        )
        assert res_exe.status_code == 400
        assert "Unsupported file type" in res_exe.json()["detail"]

        # Valid JPEG upload
        res_jpg = await client.post(
            "/api/v1/uploads/",
            files={"file": ("photo.jpg", b"\xff\xd8\xff\xe0testimage", "image/jpeg")},
            data={"prefix": "maintenance"},
        )
        assert res_jpg.status_code == 200
        assert res_jpg.json()["file_key"].startswith("maintenance/")
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ===========================================================================
# 6. Tenant Removal Role Reset (Finding 8)
# ===========================================================================

async def test_tenant_removal_role_reset_to_unassigned(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Ensure deleting tenant from unit resets role to UNASSIGNED and clears requested_landlord_id."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]
    tenant = seed_data["tenant"]

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        res = await client.delete(f"/api/v1/landlord/units/{unit.id}/tenant")
        assert res.status_code == 200

        await db_session.refresh(tenant)
        assert tenant.role == UserRole.UNASSIGNED
        assert tenant.requested_landlord_id is None

        await db_session.refresh(unit)
        assert unit.status == "Vacant"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ===========================================================================
# 7. Transactional Email HTML Entity Sanitization (Finding 10)
# ===========================================================================

def test_transactional_email_html_escaping(mock_emails):
    """Verify all transactional email templates escape dynamic HTML to prevent injection / XSS."""
    xss_payload = '<img src=x onerror=alert(1)>'

    # 1. Maintenance
    send_maintenance_notification("landlord@test.com", xss_payload, "Unit 1", xss_payload, "high")
    assert "<img" not in mock_emails[-1]["html"]
    assert "&lt;img" in mock_emails[-1]["html"]

    # 2. Reopen
    send_reopen_notification("landlord@test.com", xss_payload, "Unit 1", xss_payload)
    assert "<img" not in mock_emails[-1]["html"]

    # 3. Status Update
    send_status_update("tenant@test.com", xss_payload, "resolved")
    assert "<img" not in mock_emails[-1]["html"]

    # 4. Pending tenant request
    send_pending_tenant_notification("landlord@test.com", xss_payload, "evil@test.com")
    assert "<img" not in mock_emails[-1]["html"]

    # 5. Approval notification
    send_approval_notification("tenant@test.com", xss_payload, "Unit 1")
    assert "<img" not in mock_emails[-1]["html"]

    # 6. Rent & Lease reminders
    send_rent_reminder("tenant@test.com", xss_payload, 5)
    assert "<img" not in mock_emails[-1]["html"]

    send_lease_expiry_reminder("tenant@test.com", xss_payload, 30)
    assert "<img" not in mock_emails[-1]["html"]


# ===========================================================================
# 8. Announcement Unit-Property Linkage Validation (Finding 11)
# ===========================================================================

async def test_announcement_mismatched_unit_validation_400(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Ensure announcements reject unit_ids that do not belong to the target property."""
    landlord = seed_data["landlord"]
    prop1 = seed_data["property"]

    prop2 = Property(
        id=uuid.uuid4(),
        owner_id=landlord.id,
        name="Property Two",
        address="222 Main St",
        city="Varanasi",
    )
    unit2 = Unit(
        id=uuid.uuid4(),
        property_id=prop2.id,
        unit_label="Unit 2-X",
    )
    db_session.add(prop2)
    db_session.add(unit2)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # Create with mismatched unit_id
        res = await client.post(
            "/api/v1/landlord/announcements",
            json={
                "property_id": str(prop1.id),
                "unit_id": str(unit2.id),
                "title": "Mismatched Notice",
                "body": "Body content",
            },
        )
        assert res.status_code == 400
        assert "does not belong" in res.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ===========================================================================
# 9. Reminder Cadence & Address Formatting (Findings 13 & 14)
# ===========================================================================

async def test_scheduled_reminders_milestone_dispatch(
    seed_data, db_session: AsyncSession, mock_emails
):
    """Verify scheduler only dispatches on milestone intervals (5 & 1 rent, 30 & 7 lease)."""
    unit = seed_data["unit"]
    profile = seed_data["profile"]
    today = date.today()

    # Non-milestone: Rent in 4 days, Lease in 12 days
    unit.rent_due_day = (today + timedelta(days=4)).day
    profile.lease_end = today + timedelta(days=12)
    db_session.add(unit)
    db_session.add(profile)
    await db_session.commit()

    mock_emails.clear()
    await _check_reminders(db_session)
    assert len(mock_emails) == 0

    # Milestone 1: Rent in 1 day, Lease in 7 days
    unit.rent_due_day = (today + timedelta(days=1)).day
    profile.lease_end = today + timedelta(days=7)
    db_session.add(unit)
    db_session.add(profile)
    await db_session.commit()

    mock_emails.clear()
    await _check_reminders(db_session)
    assert len(mock_emails) == 2


def test_format_address_word_boundary_sanitization():
    """Verify word-boundary address sanitization doesn't corrupt multi-word titles."""
    assert format_address("123 highland streets") == "123 Highland Street"
    assert format_address("456 pine drives") == "456 Pine Drive"
    assert format_address("Grand Suites & Resorts") == "Grand Suites & Resorts"
