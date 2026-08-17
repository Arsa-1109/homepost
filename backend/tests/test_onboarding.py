import uuid
from datetime import date, datetime, timezone, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.invite import Invite, InviteStatus
from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile


async def test_get_me(client: AsyncClient, seed_data):
    """GET /onboarding/me returns the authenticated user."""
    user = seed_data["unassigned"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.get("/api/v1/onboarding/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@homepost.dev"
        assert data["role"] == "unassigned"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_sync_user(client: AsyncClient, seed_data):
    """POST /onboarding/sync updates user profile attributes."""
    user = seed_data["unassigned"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.post(
            "/api/v1/onboarding/sync",
            json={"email": "synced@homepost.dev", "full_name": "Synced User"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["user"]["email"] == "synced@homepost.dev"
        assert data["user"]["full_name"] == "Synced User"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_register_landlord_success(client: AsyncClient, seed_data):
    """POST /onboarding/register-landlord succeeds for unassigned user."""
    user = seed_data["unassigned"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.post("/api/v1/onboarding/register-landlord")
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert user.role == UserRole.LANDLORD
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_register_landlord_already_assigned(client: AsyncClient, seed_data):
    """POST /onboarding/register-landlord fails with 400 if user already has a role."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        response = await client.post("/api/v1/onboarding/register-landlord")
        assert response.status_code == 400
        assert "already selected a role" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_request_access_success_and_email_dispatched(client: AsyncClient, seed_data, mock_emails):
    """POST /onboarding/request-access transitions role to TENANT_PENDING and sends email to landlord."""
    user = seed_data["unassigned"]
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.post(
            "/api/v1/onboarding/request-access",
            json={"landlord_email": landlord.email},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert user.role == UserRole.TENANT_PENDING
        assert user.requested_landlord_id == landlord.id

        # Verify email notification was scheduled and sent
        assert len(mock_emails) == 1
        assert mock_emails[0]["to"] == landlord.email
        assert "New Tenant Request" in mock_emails[0]["subject"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_request_access_landlord_not_found(client: AsyncClient, seed_data):
    """POST /onboarding/request-access returns 404 when landlord email is unknown."""
    user = seed_data["unassigned"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.post(
            "/api/v1/onboarding/request-access",
            json={"landlord_email": "nonexistent@homepost.dev"},
        )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_get_invite_preview(client: AsyncClient, seed_data, db_session: AsyncSession):
    """GET /onboarding/invite/{token} returns invite and property metadata."""
    unit = seed_data["unit"]
    prop = seed_data["property"]
    landlord = seed_data["landlord"]

    invite = Invite(
        id=uuid.uuid4(),
        token="preview-token-123",
        unit_id=unit.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db_session.add(invite)
    await db_session.commit()

    res = await client.get("/api/v1/onboarding/invite/preview-token-123")
    assert res.status_code == 200
    data = res.json()
    assert data["token"] == "preview-token-123"
    assert data["property_name"] == prop.name
    assert data["unit_label"] == unit.unit_label
    assert data["landlord_name"] == landlord.full_name
    assert data["property_owner_id"] == str(prop.owner_id)
    assert data["status"] == "pending"


async def test_accept_invite_landlord_rejected(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /onboarding/accept-invite rejects landlord users from accepting any invites."""
    unit = seed_data["unit"]
    landlord = seed_data["landlord"]

    invite = Invite(
        id=uuid.uuid4(),
        token="landlord-test-token",
        unit_id=unit.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db_session.add(invite)
    await db_session.commit()

    # Attempt with landlord role (same landlord)
    app.dependency_overrides[get_current_user] = lambda: landlord
    try:
        res = await client.post("/api/v1/onboarding/accept-invite", json={"token": "landlord-test-token"})
        assert res.status_code == 403
        assert "Landlords cannot accept tenant invites" in res.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_accept_invite_owner_rejected_even_if_unassigned_state(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /onboarding/accept-invite rejects user if user ID matches the property owner ID."""
    unit = seed_data["unit"]
    landlord = seed_data["landlord"]

    invite = Invite(
        id=uuid.uuid4(),
        token="owner-unassigned-test-token",
        unit_id=unit.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db_session.add(invite)
    await db_session.commit()

    # Create an unassigned user object whose id is the property owner_id (simulating edge case or manipulated token/owner)
    owner_as_unassigned = User(
        id=landlord.id,
        clerk_id="clerk_owner_edge",
        email="owner_edge@homepost.dev",
        role=UserRole.UNASSIGNED,
    )
    app.dependency_overrides[get_current_user] = lambda: owner_as_unassigned
    try:
        res = await client.post("/api/v1/onboarding/accept-invite", json={"token": "owner-unassigned-test-token"})
        assert res.status_code == 403
        assert "cannot accept tenant invites for your own units" in res.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_accept_invite_lifecycle(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Test full invite acceptance lifecycle (success, already used, and expired)."""
    prop = seed_data["property"]
    landlord = seed_data["landlord"]

    # Create a fresh vacant unit for invite testing
    unit = Unit(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_label="Unit 9Z",
        rent_due_day=1,
    )
    db_session.add(unit)
    await db_session.commit()

    # 1. Create valid pending invite
    invite = Invite(
        id=uuid.uuid4(),
        token="valid-token-123",
        unit_id=unit.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db_session.add(invite)
    await db_session.commit()

    # User accepts invite
    new_user = User(
        clerk_id="clerk_invitee",
        email="invitee@homepost.dev",
        role=UserRole.UNASSIGNED,
    )
    db_session.add(new_user)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: new_user

    try:
        # Happy Path
        res = await client.post("/api/v1/onboarding/accept-invite", json={"token": "valid-token-123"})
        assert res.status_code == 200
        assert res.json()["status"] == "success"
        assert new_user.role == UserRole.TENANT

        # Duplicate Attempt by another unassigned user -> 409 Conflict
        second_user = User(
            clerk_id="clerk_invitee_2",
            email="invitee2@homepost.dev",
            role=UserRole.UNASSIGNED,
        )
        db_session.add(second_user)
        await db_session.commit()
        app.dependency_overrides[get_current_user] = lambda: second_user

        res_dup = await client.post("/api/v1/onboarding/accept-invite", json={"token": "valid-token-123"})
        assert res_dup.status_code == 409
        assert res_dup.json()["detail"] == "invite_already_used"

        # Expired Invite -> 410 Gone
        expired_invite = Invite(
            id=uuid.uuid4(),
            token="expired-token-456",
            unit_id=unit.id,
            created_by=landlord.id,
            status=InviteStatus.PENDING,
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1),
        )
        db_session.add(expired_invite)
        await db_session.commit()

        res_exp = await client.post("/api/v1/onboarding/accept-invite", json={"token": "expired-token-456"})
        assert res_exp.status_code == 410
        assert res_exp.json()["detail"] == "invite_expired"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_accept_invite_already_occupied_unit(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /onboarding/accept-invite returns 409 if the unit already has an active tenant profile."""
    unit = seed_data["unit"]
    landlord = seed_data["landlord"]
    # seed_data["unit"] already has an active tenant (seed_data["profile"])

    invite = Invite(
        id=uuid.uuid4(),
        token="occupied-unit-token",
        unit_id=unit.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db_session.add(invite)
    await db_session.commit()

    another_user = User(
        clerk_id="clerk_occupied_test",
        email="occupied_test@homepost.dev",
        role=UserRole.UNASSIGNED,
    )
    db_session.add(another_user)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: another_user
    try:
        res = await client.post("/api/v1/onboarding/accept-invite", json={"token": "occupied-unit-token"})
        assert res.status_code == 409
        assert res.json()["detail"] == "unit_already_occupied"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_accept_invite_deactivates_previous_user_tenancy(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /onboarding/accept-invite deactivates previous active tenant profile of user."""
    prop = seed_data["property"]
    landlord = seed_data["landlord"]

    unit_a = Unit(id=uuid.uuid4(), property_id=prop.id, unit_label="Unit A")
    unit_b = Unit(id=uuid.uuid4(), property_id=prop.id, unit_label="Unit B")
    db_session.add(unit_a)
    db_session.add(unit_b)
    await db_session.commit()

    switching_user = User(
        id=uuid.uuid4(),
        clerk_id="clerk_switching_tenant",
        email="switcher@homepost.dev",
        role=UserRole.UNASSIGNED,
    )
    db_session.add(switching_user)
    await db_session.commit()

    from app.models.tenant_profile import TenantProfile
    profile_a = TenantProfile(
        id=uuid.uuid4(),
        user_id=switching_user.id,
        unit_id=unit_a.id,
        is_active=True,
    )
    db_session.add(profile_a)
    await db_session.commit()

    invite_b = Invite(
        id=uuid.uuid4(),
        token="invite-unit-b",
        unit_id=unit_b.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db_session.add(invite_b)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: switching_user
    try:
        res = await client.post("/api/v1/onboarding/accept-invite", json={"token": "invite-unit-b"})
        assert res.status_code == 200

        # Reload profile_a (which was updated to unit_b)
        await db_session.refresh(profile_a)
        assert profile_a.is_active is True
        assert profile_a.unit_id == unit_b.id

        # Verify switching user has exactly 1 active profile linked to unit_b
        res_profiles = await db_session.execute(
            select(TenantProfile).where(TenantProfile.user_id == switching_user.id, TenantProfile.is_active == True)
        )
        active_profiles = res_profiles.scalars().all()
        assert len(active_profiles) == 1
        assert active_profiles[0].unit_id == unit_b.id
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_reset_role(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /onboarding/reset-role handles role resets and enforces property cleanup guard."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # Landlord with existing property should get 400
        res = await client.post("/api/v1/onboarding/reset-role")
        assert res.status_code == 400
        assert "active properties" in res.json()["detail"]

        # User in TENANT_PENDING can reset to UNASSIGNED
        pending_user = User(
            clerk_id="clerk_pending_reset",
            email="pending@homepost.dev",
            role=UserRole.TENANT_PENDING,
            requested_landlord_id=landlord.id,
        )
        db_session.add(pending_user)
        await db_session.commit()

        app.dependency_overrides[get_current_user] = lambda: pending_user
        res_pending = await client.post("/api/v1/onboarding/reset-role")
        assert res_pending.status_code == 200
        assert pending_user.role == UserRole.UNASSIGNED
        assert pending_user.requested_landlord_id is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_get_invite_preview_not_found_and_expired(client: AsyncClient, seed_data, db_session: AsyncSession):
    """GET /onboarding/invite/{token} returns 404 for invalid tokens and 410 for expired tokens."""
    unit = seed_data["unit"]
    landlord = seed_data["landlord"]

    # 1. Non-existent token -> 404
    res_404 = await client.get("/api/v1/onboarding/invite/non-existent-token-xyz")
    assert res_404.status_code == 404
    assert res_404.json()["detail"] == "invite_not_found"

    # 2. Expired token -> 410
    expired_invite = Invite(
        id=uuid.uuid4(),
        token="expired-preview-token",
        unit_id=unit.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=2),
    )
    db_session.add(expired_invite)
    await db_session.commit()

    res_410 = await client.get("/api/v1/onboarding/invite/expired-preview-token")
    assert res_410.status_code == 410
    assert res_410.json()["detail"] == "invite_expired"


async def test_get_invite_preview_includes_lease_dates(client: AsyncClient, seed_data, db_session: AsyncSession):
    """GET /onboarding/invite/{token} returns populated lease_start and lease_end."""
    unit = seed_data["unit"]
    landlord = seed_data["landlord"]

    invite = Invite(
        id=uuid.uuid4(),
        token="lease-preview-token-123",
        unit_id=unit.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        lease_start=date(2026, 9, 1),
        lease_end=date(2027, 8, 31),
    )
    db_session.add(invite)
    await db_session.commit()

    res = await client.get("/api/v1/onboarding/invite/lease-preview-token-123")
    assert res.status_code == 200
    data = res.json()
    assert data["token"] == "lease-preview-token-123"
    assert data["lease_start"] == "2026-09-01"
    assert data["lease_end"] == "2027-08-31"


async def test_accept_invite_transfers_lease_to_tenant_profile(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /onboarding/accept-invite transfers lease dates from invite to TenantProfile."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]

    # Create a vacant unit for this invite
    vacant_unit = Unit(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_label="Unit AcceptLease",
        rent_due_day=1,
        status="Vacant",
    )
    invite = Invite(
        id=uuid.uuid4(),
        token="accept-transfer-token-456",
        unit_id=vacant_unit.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        lease_start=date(2026, 9, 1),
        lease_end=date(2027, 8, 31),
    )
    unassigned_user = User(
        id=uuid.uuid4(),
        clerk_id=f"user_accept_{uuid.uuid4()}",
        email="tenant_accept_lease@homepost.dev",
        role=UserRole.UNASSIGNED,
    )
    db_session.add(vacant_unit)
    db_session.add(invite)
    db_session.add(unassigned_user)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: unassigned_user
    try:
        res = await client.post(
            "/api/v1/onboarding/accept-invite",
            json={"token": "accept-transfer-token-456"},
        )
        assert res.status_code == 200

        # Verify TenantProfile has transferred lease dates
        stmt = select(TenantProfile).where(TenantProfile.user_id == unassigned_user.id)
        profile_res = await db_session.execute(stmt)
        profile = profile_res.scalar_one_or_none()
        assert profile is not None
        assert profile.unit_id == vacant_unit.id
        assert profile.lease_start == date(2026, 9, 1)
        assert profile.lease_end == date(2027, 8, 31)
    finally:
        app.dependency_overrides.pop(get_current_user, None)
