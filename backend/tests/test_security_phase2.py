import uuid
from datetime import date
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


async def test_approve_tenant_double_occupancy_rejected_409(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Attempting to approve a tenant into an already-occupied unit must return 409 Conflict."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]  # seed_data["profile"] is already active in this unit

    # Pending applicant
    applicant = User(
        id=uuid.uuid4(),
        clerk_id="clerk_double_occupant",
        email="applicant@homepost.dev",
        full_name="Second Applicant",
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


async def test_approve_tenant_reused_profile_reactivates_without_unique_crash(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Approving a tenant who previously had a profile must reactivate the existing record without crashing."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]

    # Vacant new unit
    new_unit = Unit(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_label="Unit 10-Vacant",
    )
    # Former tenant user
    former_tenant = User(
        id=uuid.uuid4(),
        clerk_id="clerk_former_tenant",
        email="former@homepost.dev",
        full_name="Former Resident",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    db_session.add_all([new_unit, former_tenant])
    await db_session.commit()

    # Pre-existing deactivated TenantProfile for former_tenant
    old_profile = TenantProfile(
        id=uuid.uuid4(),
        user_id=former_tenant.id,
        unit_id=seed_data["unit"].id,
        is_active=False,
        lease_start=date(2025, 1, 1),
        lease_end=date(2025, 12, 31),
    )
    db_session.add(old_profile)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        res = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={
                "user_id": str(former_tenant.id),
                "unit_id": str(new_unit.id),
                "lease_start": "2026-09-01",
                "lease_end": "2027-08-31",
            },
        )
        assert res.status_code == 200
        assert res.json()["status"] == "success"

        # Verify old profile was updated and reactivated
        await db_session.refresh(old_profile)
        assert old_profile.unit_id == new_unit.id
        assert old_profile.is_active is True
        assert old_profile.lease_start == date(2026, 9, 1)

        # Verify unit status set to Occupied
        await db_session.refresh(new_unit)
        assert new_unit.status == "Occupied"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_upload_file_direct_unsupported_mime_rejected_400(
    client: AsyncClient, seed_data, mock_storage
):
    """Uploading dangerous file extensions or MIME types must be rejected with 400."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # Malicious HTML
        files_html = {"file": ("exploit.html", b"<script>alert(1)</script>", "text/html")}
        res_html = await client.post("/api/v1/uploads/", data={"prefix": "maintenance"}, files=files_html)
        assert res_html.status_code == 400
        assert "Unsupported file type" in res_html.json()["detail"]

        # Executable
        files_exe = {"file": ("malware.exe", b"MZ fake binary", "application/x-msdownload")}
        res_exe = await client.post("/api/v1/uploads/", data={"prefix": "maintenance"}, files=files_exe)
        assert res_exe.status_code == 400
        assert "Unsupported file type" in res_exe.json()["detail"]

        # SVG with script
        files_svg = {"file": ("vector.svg", b"<svg><script>alert(1)</script></svg>", "image/svg+xml")}
        res_svg = await client.post("/api/v1/uploads/", data={"prefix": "documents"}, files=files_svg)
        assert res_svg.status_code == 400

        # Invalid upload prefix
        files_valid = {"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")}
        res_prefix = await client.post("/api/v1/uploads/", data={"prefix": "system_secrets"}, files=files_valid)
        assert res_prefix.status_code == 400
        assert "Invalid upload prefix" in res_prefix.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_upload_file_direct_supported_types_accepted_200(
    client: AsyncClient, seed_data, mock_storage
):
    """Valid images and PDF/DOC documents upload successfully."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # PDF in documents
        files_pdf = {"file": ("lease.pdf", b"%PDF-1.4 sample content", "application/pdf")}
        res_pdf = await client.post("/api/v1/uploads/", data={"prefix": "documents"}, files=files_pdf)
        assert res_pdf.status_code == 200
        assert res_pdf.json()["file_key"].startswith("documents/")

        # JPEG in maintenance
        files_jpg = {"file": ("photo.jpg", b"\xff\xd8\xff sample jpeg", "image/jpeg")}
        res_jpg = await client.post("/api/v1/uploads/", data={"prefix": "maintenance"}, files=files_jpg)
        assert res_jpg.status_code == 200
        assert res_jpg.json()["file_key"].startswith("maintenance/")

        # Announcement attachment prefix
        files_png = {"file": ("announcement.png", b"\x89PNG sample png", "image/png")}
        res_png = await client.post("/api/v1/uploads/", data={"prefix": "announcements"}, files=files_png)
        assert res_png.status_code == 200
        assert res_png.json()["file_key"].startswith("announcements/")
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_cross_tenant_maintenance_idor_isolation(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Tenant B in the same unit cannot view, reopen, or close tickets submitted by previous Tenant A."""
    unit = seed_data["unit"]
    profile_a = seed_data["profile"]  # Tenant A

    # Create resolved maintenance request submitted by Tenant A
    req_a = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile_a.id,
        unit_id=unit.id,
        title="Tenant A Old Request",
        description="Leaking pipe resolved previously.",
        priority=RequestPriority.LOW,
        status=RequestStatus.RESOLVED,
    )
    db_session.add(req_a)
    await db_session.commit()

    # Tenant B takes over the unit
    tenant_b_user = User(
        id=uuid.uuid4(),
        clerk_id="clerk_tenant_b_user",
        email="tenant_b@homepost.dev",
        full_name="Tenant B",
        role=UserRole.TENANT,
    )
    db_session.add(tenant_b_user)
    await db_session.commit()

    profile_b = TenantProfile(
        id=uuid.uuid4(),
        user_id=tenant_b_user.id,
        unit_id=unit.id,
        is_active=True,
    )
    db_session.add(profile_b)
    # Deactivate profile A
    profile_a.is_active = False
    db_session.add(profile_a)
    await db_session.commit()

    # Authenticate as Tenant B
    from app.dependencies.auth import get_current_tenant_profile, get_active_tenant_profile
    app.dependency_overrides[get_current_user] = lambda: tenant_b_user
    app.dependency_overrides[get_current_tenant_profile] = lambda: profile_b
    app.dependency_overrides[get_active_tenant_profile] = lambda: profile_b

    try:
        # Tenant B cannot GET Tenant A's request -> 404
        get_res = await client.get(f"/api/v1/tenant/maintenance/{req_a.id}")
        assert get_res.status_code == 404

        # Tenant B cannot REOPEN Tenant A's request -> 404
        reopen_res = await client.post(
            f"/api/v1/tenant/maintenance/{req_a.id}/reopen",
            json={"notes": "Trying to reopen Tenant A ticket"},
        )
        assert reopen_res.status_code == 404

        # Tenant B cannot CLOSE Tenant A's request -> 404
        close_res = await client.post(f"/api/v1/tenant/maintenance/{req_a.id}/close")
        assert close_res.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_current_tenant_profile, None)
        app.dependency_overrides.pop(get_active_tenant_profile, None)
