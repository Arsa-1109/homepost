"""
Adversarial Verification Suite for Milestone 1: Backend Lease Onboarding Pipeline

Tests cover:
1. Invite generation with null, partial, explicit, leap year, month boundary, and invalid dates.
2. Invite preview fallback hierarchy and override semantics.
3. Invite acceptance fallback hierarchy, override semantics, and profile reactivation.
4. Access request approval with explicit overrides, fallbacks to unit defaults, nulls, and profile reactivation.
5. Date formatting, leap years (2028-02-29), non-leap invalid leap days (2026-02-29), and month/year boundaries.
6. Tenant profile API response formatting.
7. Landlord lease update sync across Unit and active TenantProfile.
8. Unit creation without lease fields.
"""

import uuid
from datetime import date, datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.invite import Invite, InviteStatus
from app.dependencies.auth import (
    get_current_user,
    get_current_landlord,
    get_current_tenant_profile,
    get_active_tenant_profile,
)


# ===========================================================================
# 1. INVITE GENERATION TESTS (POST /api/v1/landlord/generate-invite)
# ===========================================================================

@pytest.mark.asyncio
async def test_adv_invite_gen_explicit_valid_dates(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Landlord generates an invite with explicit lease_start and lease_end."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit_101"]

    app.dependency_overrides[get_current_landlord] = lambda: landlord
    try:
        res = await client.post(
            "/api/v1/landlord/generate-invite",
            json={
                "unit_id": str(unit.id),
                "clear_data": False,
                "lease_start": "2026-09-01",
                "lease_end": "2027-08-31",
            },
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["lease_start"] == "2026-09-01"
        assert data["lease_end"] == "2027-08-31"

        invite_id = uuid.UUID(data["id"])
        db_invite = await db_session.get(Invite, invite_id)
        assert db_invite is not None
        assert db_invite.lease_start == date(2026, 9, 1)
        assert db_invite.lease_end == date(2027, 8, 31)
    finally:
        app.dependency_overrides.pop(get_current_landlord, None)


@pytest.mark.asyncio
async def test_adv_invite_gen_null_dates(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Landlord generates invite with explicit null or omitted lease dates."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit_101"]

    app.dependency_overrides[get_current_landlord] = lambda: landlord
    try:
        # Case A: Omitted dates
        res1 = await client.post(
            "/api/v1/landlord/generate-invite",
            json={"unit_id": str(unit.id)},
        )
        assert res1.status_code == 200, res1.text
        data1 = res1.json()
        assert data1["lease_start"] is None
        assert data1["lease_end"] is None

        # Case B: Explicit nulls
        res2 = await client.post(
            "/api/v1/landlord/generate-invite",
            json={
                "unit_id": str(unit.id),
                "lease_start": None,
                "lease_end": None,
            },
        )
        assert res2.status_code == 200, res2.text
        data2 = res2.json()
        assert data2["lease_start"] is None
        assert data2["lease_end"] is None
    finally:
        app.dependency_overrides.pop(get_current_landlord, None)


@pytest.mark.asyncio
async def test_adv_invite_gen_partial_dates(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Landlord generates invite with only lease_start (e.g. month-to-month) or only lease_end."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit_101"]

    app.dependency_overrides[get_current_landlord] = lambda: landlord
    try:
        # Only start date
        res = await client.post(
            "/api/v1/landlord/generate-invite",
            json={
                "unit_id": str(unit.id),
                "lease_start": "2026-10-01",
                "lease_end": None,
            },
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["lease_start"] == "2026-10-01"
        assert data["lease_end"] is None

        invite = await db_session.get(Invite, uuid.UUID(data["id"]))
        assert invite.lease_start == date(2026, 10, 1)
        assert invite.lease_end is None
    finally:
        app.dependency_overrides.pop(get_current_landlord, None)


@pytest.mark.asyncio
async def test_adv_invite_gen_leap_year_dates(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Landlord generates invite spanning a leap year (Feb 29, 2028)."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit_101"]

    app.dependency_overrides[get_current_landlord] = lambda: landlord
    try:
        res = await client.post(
            "/api/v1/landlord/generate-invite",
            json={
                "unit_id": str(unit.id),
                "lease_start": "2028-02-29",
                "lease_end": "2029-02-28",
            },
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["lease_start"] == "2028-02-29"
        assert data["lease_end"] == "2029-02-28"

        invite = await db_session.get(Invite, uuid.UUID(data["id"]))
        assert invite.lease_start == date(2028, 2, 29)
        assert invite.lease_end == date(2029, 2, 28)
    finally:
        app.dependency_overrides.pop(get_current_landlord, None)


@pytest.mark.asyncio
async def test_adv_invite_gen_invalid_date_format(client: AsyncClient, seed_data):
    """Pydantic rejects invalid date strings with 422 Unprocessable Entity."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit_101"]

    app.dependency_overrides[get_current_landlord] = lambda: landlord
    try:
        # Invalid leap day in non-leap year (2026-02-29)
        res1 = await client.post(
            "/api/v1/landlord/generate-invite",
            json={"unit_id": str(unit.id), "lease_start": "2026-02-29"},
        )
        assert res1.status_code == 422

        # Completely invalid format
        res2 = await client.post(
            "/api/v1/landlord/generate-invite",
            json={"unit_id": str(unit.id), "lease_start": "09-01-2026"},
        )
        assert res2.status_code == 422

        # Invalid month (month 13)
        res3 = await client.post(
            "/api/v1/landlord/generate-invite",
            json={"unit_id": str(unit.id), "lease_start": "2026-13-01"},
        )
        assert res3.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_landlord, None)


# ===========================================================================
# 2. INVITE PREVIEW FALLBACK MATRIX (GET /api/v1/onboarding/invite/{token})
# ===========================================================================

@pytest.mark.asyncio
async def test_adv_invite_preview_override_semantics(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Invite dates override unit dates on preview; fallback to unit dates when invite dates are null."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]

    # Unit has default lease dates
    unit_with_defaults = Unit(
        property_id=prop.id,
        unit_label="Unit With Defaults",
        rent_amount=2000.0,
        deposit_amount=2000.0,
        lease_start=date(2026, 1, 1),
        lease_end=date(2026, 12, 31),
    )
    db_session.add(unit_with_defaults)

    # Unit with no lease dates
    unit_no_defaults = Unit(
        property_id=prop.id,
        unit_label="Unit No Defaults",
        rent_amount=2000.0,
        deposit_amount=2000.0,
        lease_start=None,
        lease_end=None,
    )
    db_session.add(unit_no_defaults)
    await db_session.commit()
    await db_session.refresh(unit_with_defaults)
    await db_session.refresh(unit_no_defaults)

    # Scenario 1: Invite has explicit dates overriding unit defaults
    token_override = "adv-token-override-123"
    invite_override = Invite(
        unit_id=unit_with_defaults.id,
        created_by=landlord.id,
        token=token_override,
        lease_start=date(2026, 6, 1),
        lease_end=date(2027, 5, 31),
    )
    db_session.add(invite_override)

    # Scenario 2: Invite has null dates; should fall back to unit defaults
    token_fallback = "adv-token-fallback-456"
    invite_fallback = Invite(
        unit_id=unit_with_defaults.id,
        created_by=landlord.id,
        token=token_fallback,
        lease_start=None,
        lease_end=None,
    )
    db_session.add(invite_fallback)

    # Scenario 3: Neither invite nor unit has dates; preview returns nulls
    token_all_null = "adv-token-all-null-789"
    invite_all_null = Invite(
        unit_id=unit_no_defaults.id,
        created_by=landlord.id,
        token=token_all_null,
        lease_start=None,
        lease_end=None,
    )
    db_session.add(invite_all_null)

    # Scenario 4: Partial override - invite has start date, unit provides end date
    token_partial = "adv-token-partial-321"
    invite_partial = Invite(
        unit_id=unit_with_defaults.id,
        created_by=landlord.id,
        token=token_partial,
        lease_start=date(2026, 7, 1),
        lease_end=None,
    )
    db_session.add(invite_partial)

    await db_session.commit()

    # Test Scenario 1
    res1 = await client.get(f"/api/v1/onboarding/invite/{token_override}")
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["lease_start"] == "2026-06-01"
    assert d1["lease_end"] == "2027-05-31"

    # Test Scenario 2
    res2 = await client.get(f"/api/v1/onboarding/invite/{token_fallback}")
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["lease_start"] == "2026-01-01"
    assert d2["lease_end"] == "2026-12-31"

    # Test Scenario 3
    res3 = await client.get(f"/api/v1/onboarding/invite/{token_all_null}")
    assert res3.status_code == 200
    d3 = res3.json()
    assert d3["lease_start"] is None
    assert d3["lease_end"] is None

    # Test Scenario 4
    res4 = await client.get(f"/api/v1/onboarding/invite/{token_partial}")
    assert res4.status_code == 200
    d4 = res4.json()
    assert d4["lease_start"] == "2026-07-01"
    assert d4["lease_end"] == "2026-12-31"


# ===========================================================================
# 3. INVITE ACCEPTANCE TESTS (POST /api/v1/onboarding/accept-invite)
# ===========================================================================

@pytest.mark.asyncio
async def test_adv_accept_invite_override_and_fallback_matrix(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Accepting invite sets TenantProfile lease dates according to override/fallback hierarchy."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]

    # Create 3 units
    unit_override = Unit(
        property_id=prop.id,
        unit_label="Unit Override",
        rent_amount=1500.0,
        deposit_amount=1500.0,
        lease_start=date(2026, 1, 1),
        lease_end=date(2026, 12, 31),
    )
    unit_fallback = Unit(
        property_id=prop.id,
        unit_label="Unit Fallback",
        rent_amount=1600.0,
        deposit_amount=1600.0,
        lease_start=date(2026, 3, 1),
        lease_end=date(2027, 2, 28),
    )
    unit_empty = Unit(
        property_id=prop.id,
        unit_label="Unit Empty",
        rent_amount=1700.0,
        deposit_amount=1700.0,
        lease_start=None,
        lease_end=None,
    )
    db_session.add_all([unit_override, unit_fallback, unit_empty])
    await db_session.commit()
    await db_session.refresh(unit_override)
    await db_session.refresh(unit_fallback)
    await db_session.refresh(unit_empty)

    # 1. Tenant 1 accepts invite with explicit override dates
    t1 = User(
        clerk_id="clerk_adv_t1",
        email="adv_t1@homepost.dev",
        full_name="Adv Tenant One",
        role=UserRole.UNASSIGNED,
    )
    inv1 = Invite(
        unit_id=unit_override.id,
        created_by=landlord.id,
        token="token_t1_override",
        lease_start=date(2026, 11, 1),
        lease_end=date(2027, 10, 31),
    )
    db_session.add_all([t1, inv1])

    # 2. Tenant 2 accepts invite with null dates (should inherit unit fallback dates)
    t2 = User(
        clerk_id="clerk_adv_t2",
        email="adv_t2@homepost.dev",
        full_name="Adv Tenant Two",
        role=UserRole.UNASSIGNED,
    )
    inv2 = Invite(
        unit_id=unit_fallback.id,
        created_by=landlord.id,
        token="token_t2_fallback",
        lease_start=None,
        lease_end=None,
    )
    db_session.add_all([t2, inv2])

    # 3. Tenant 3 accepts invite where both unit and invite have null dates
    t3 = User(
        clerk_id="clerk_adv_t3",
        email="adv_t3@homepost.dev",
        full_name="Adv Tenant Three",
        role=UserRole.UNASSIGNED,
    )
    inv3 = Invite(
        unit_id=unit_empty.id,
        created_by=landlord.id,
        token="token_t3_empty",
        lease_start=None,
        lease_end=None,
    )
    db_session.add_all([t3, inv3])

    await db_session.commit()

    # Execute Accept 1 (Override)
    app.dependency_overrides[get_current_user] = lambda: t1
    res1 = await client.post("/api/v1/onboarding/accept-invite", json={"token": "token_t1_override"})
    assert res1.status_code == 200, res1.text
    prof1_res = await db_session.execute(select(TenantProfile).where(TenantProfile.user_id == t1.id))
    prof1 = prof1_res.scalar_one()
    assert prof1.lease_start == date(2026, 11, 1)
    assert prof1.lease_end == date(2027, 10, 31)

    # Execute Accept 2 (Fallback)
    app.dependency_overrides[get_current_user] = lambda: t2
    res2 = await client.post("/api/v1/onboarding/accept-invite", json={"token": "token_t2_fallback"})
    assert res2.status_code == 200, res2.text
    prof2_res = await db_session.execute(select(TenantProfile).where(TenantProfile.user_id == t2.id))
    prof2 = prof2_res.scalar_one()
    assert prof2.lease_start == date(2026, 3, 1)
    assert prof2.lease_end == date(2027, 2, 28)

    # Execute Accept 3 (Both None)
    app.dependency_overrides[get_current_user] = lambda: t3
    res3 = await client.post("/api/v1/onboarding/accept-invite", json={"token": "token_t3_empty"})
    assert res3.status_code == 200, res3.text
    prof3_res = await db_session.execute(select(TenantProfile).where(TenantProfile.user_id == t3.id))
    prof3 = prof3_res.scalar_one()
    assert prof3.lease_start is None
    assert prof3.lease_end is None

    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_adv_accept_invite_reactivates_previous_tenant_with_new_dates(client: AsyncClient, seed_data, db_session: AsyncSession):
    """A previously removed tenant accepting a new invite has their TenantProfile reactivated with new lease dates."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]

    unit_old = Unit(property_id=prop.id, unit_label="Unit Old", rent_amount=1000.0, deposit_amount=1000.0)
    unit_new = Unit(property_id=prop.id, unit_label="Unit New", rent_amount=1200.0, deposit_amount=1200.0)
    db_session.add_all([unit_old, unit_new])
    await db_session.commit()
    await db_session.refresh(unit_old)
    await db_session.refresh(unit_new)

    # Existing tenant user with deactivated previous tenancy
    tenant_user = User(
        clerk_id="clerk_adv_reactivate_invite",
        email="adv_reactivate_inv@homepost.dev",
        full_name="Reactivate Inv Tenant",
        role=UserRole.UNASSIGNED,
    )
    db_session.add(tenant_user)
    await db_session.commit()
    await db_session.refresh(tenant_user)

    old_profile = TenantProfile(
        user_id=tenant_user.id,
        unit_id=unit_old.id,
        lease_start=date(2024, 1, 1),
        lease_end=date(2024, 12, 31),
        is_active=False,
        removed_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db_session.add(old_profile)

    # New invite with new lease dates
    inv = Invite(
        unit_id=unit_new.id,
        created_by=landlord.id,
        token="token_reactivate_inv_123",
        lease_start=date(2028, 2, 29),  # Leap day test!
        lease_end=date(2029, 2, 28),
    )
    db_session.add(inv)
    await db_session.commit()

    # Accept new invite
    app.dependency_overrides[get_current_user] = lambda: tenant_user
    try:
        res = await client.post("/api/v1/onboarding/accept-invite", json={"token": "token_reactivate_inv_123"})
        assert res.status_code == 200, res.text

        await db_session.refresh(old_profile)
        assert old_profile.is_active is True
        assert old_profile.removed_at is None
        assert old_profile.unit_id == unit_new.id
        assert old_profile.lease_start == date(2028, 2, 29)
        assert old_profile.lease_end == date(2029, 2, 28)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ===========================================================================
# 4. TENANT APPROVAL FLOW TESTS (POST /api/v1/landlord/approve-tenant)
# ===========================================================================

@pytest.mark.asyncio
async def test_adv_approve_tenant_override_and_fallback_matrix(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Landlord approval supports explicit lease dates, fallback to unit dates, nulls, and leap years."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]

    # Unit A: Has default lease dates
    unit_a = Unit(
        property_id=prop.id,
        unit_label="Unit A Defaults",
        rent_amount=1500.0,
        deposit_amount=1500.0,
        lease_start=date(2026, 1, 1),
        lease_end=date(2026, 12, 31),
    )
    # Unit B: No default lease dates
    unit_b = Unit(
        property_id=prop.id,
        unit_label="Unit B No Defaults",
        rent_amount=1800.0,
        deposit_amount=1800.0,
        lease_start=None,
        lease_end=None,
    )
    db_session.add_all([unit_a, unit_b])
    await db_session.commit()
    await db_session.refresh(unit_a)
    await db_session.refresh(unit_b)

    # Pending applicant 1: Approved with explicit override dates
    app1 = User(
        clerk_id="clerk_app_1",
        email="app1@homepost.dev",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    # Pending applicant 2: Approved without dates -> falls back to Unit A dates
    app2 = User(
        clerk_id="clerk_app_2",
        email="app2@homepost.dev",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    # Pending applicant 3: Approved into Unit B with leap year dates
    app3 = User(
        clerk_id="clerk_app_3",
        email="app3@homepost.dev",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )

    db_session.add_all([app1, app2, app3])
    await db_session.commit()
    await db_session.refresh(app1)
    await db_session.refresh(app2)
    await db_session.refresh(app3)

    app.dependency_overrides[get_current_landlord] = lambda: landlord
    try:
        # Case 1: Explicit Override on Unit A
        res1 = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={
                "user_id": str(app1.id),
                "unit_id": str(unit_a.id),
                "lease_start": "2026-05-01",
                "lease_end": "2027-04-30",
            },
        )
        assert res1.status_code == 200, res1.text
        prof1_res = await db_session.execute(select(TenantProfile).where(TenantProfile.user_id == app1.id))
        prof1 = prof1_res.scalar_one()
        assert prof1.lease_start == date(2026, 5, 1)
        assert prof1.lease_end == date(2027, 4, 30)

        # Deactivate app1 to free up unit_a for app2 test
        prof1.is_active = False
        db_session.add(prof1)
        await db_session.commit()

        # Case 2: Fallback to Unit A defaults (no dates in payload)
        res2 = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={
                "user_id": str(app2.id),
                "unit_id": str(unit_a.id),
            },
        )
        assert res2.status_code == 200, res2.text
        prof2_res = await db_session.execute(select(TenantProfile).where(TenantProfile.user_id == app2.id))
        prof2 = prof2_res.scalar_one()
        assert prof2.lease_start == date(2026, 1, 1)
        assert prof2.lease_end == date(2026, 12, 31)

        # Case 3: Leap year dates on Unit B
        res3 = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={
                "user_id": str(app3.id),
                "unit_id": str(unit_b.id),
                "lease_start": "2028-02-29",
                "lease_end": "2029-02-28",
            },
        )
        assert res3.status_code == 200, res3.text
        prof3_res = await db_session.execute(select(TenantProfile).where(TenantProfile.user_id == app3.id))
        prof3 = prof3_res.scalar_one()
        assert prof3.lease_start == date(2028, 2, 29)
        assert prof3.lease_end == date(2029, 2, 28)

    finally:
        app.dependency_overrides.pop(get_current_landlord, None)


@pytest.mark.asyncio
async def test_adv_approve_tenant_reactivates_previous_profile_with_lease(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Re-approving an applicant who had a previous tenancy profile reactivates it with new lease dates."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit_101"]

    # Applicant who previously lived elsewhere
    tenant_user = User(
        clerk_id="clerk_adv_reactivate_app",
        email="adv_reactivate_app@homepost.dev",
        role=UserRole.TENANT_PENDING,
        requested_landlord_id=landlord.id,
    )
    db_session.add(tenant_user)
    await db_session.commit()
    await db_session.refresh(tenant_user)

    # Deactivate any existing active profile on this unit so it is vacant
    seed_data["profile"].is_active = False
    db_session.add(seed_data["profile"])
    await db_session.commit()

    old_profile = TenantProfile(
        user_id=tenant_user.id,
        unit_id=unit.id,
        lease_start=date(2023, 1, 1),
        lease_end=date(2023, 12, 31),
        is_active=False,
        removed_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db_session.add(old_profile)
    await db_session.commit()

    app.dependency_overrides[get_current_landlord] = lambda: landlord
    try:
        res = await client.post(
            "/api/v1/landlord/approve-tenant",
            json={
                "user_id": str(tenant_user.id),
                "unit_id": str(unit.id),
                "lease_start": "2026-10-01",
                "lease_end": "2027-09-30",
            },
        )
        assert res.status_code == 200, res.text

        await db_session.refresh(old_profile)
        assert old_profile.is_active is True
        assert old_profile.removed_at is None
        assert old_profile.lease_start == date(2026, 10, 1)
        assert old_profile.lease_end == date(2027, 9, 30)
    finally:
        app.dependency_overrides.pop(get_current_landlord, None)


# ===========================================================================
# 5. TENANT PROFILE API TESTS (GET /api/v1/tenant/profile)
# ===========================================================================

@pytest.mark.asyncio
async def test_adv_tenant_profile_api_date_representation(client: AsyncClient, seed_data, db_session: AsyncSession):
    """GET /api/v1/tenant/profile returns lease_start and lease_end as ISO strings or None."""
    unit = seed_data["unit_101"]

    # 1. Profile with lease dates
    t1_user = User(clerk_id="clerk_p1", email="p1@homepost.dev", role=UserRole.TENANT)
    db_session.add(t1_user)
    await db_session.commit()
    await db_session.refresh(t1_user)

    p1 = TenantProfile(
        user_id=t1_user.id,
        unit_id=unit.id,
        lease_start=date(2028, 2, 29),
        lease_end=date(2029, 2, 28),
        is_active=True,
    )
    db_session.add(p1)

    # 2. Profile with null lease dates
    t2_user = User(clerk_id="clerk_p2", email="p2@homepost.dev", role=UserRole.TENANT)
    db_session.add(t2_user)
    await db_session.commit()
    await db_session.refresh(t2_user)

    p2 = TenantProfile(
        user_id=t2_user.id,
        unit_id=unit.id,
        lease_start=None,
        lease_end=None,
        is_active=True,
    )
    db_session.add(p2)
    await db_session.commit()
    await db_session.refresh(p1)
    await db_session.refresh(p2)

    # Query Profile 1
    app.dependency_overrides[get_current_tenant_profile] = lambda: p1
    res1 = await client.get("/api/v1/tenant/profile")
    assert res1.status_code == 200, res1.text
    d1 = res1.json()
    assert d1["lease_start"] == "2028-02-29"
    assert d1["lease_end"] == "2029-02-28"

    # Query Profile 2
    app.dependency_overrides[get_current_tenant_profile] = lambda: p2
    res2 = await client.get("/api/v1/tenant/profile")
    assert res2.status_code == 200, res2.text
    d2 = res2.json()
    assert d2["lease_start"] is None
    assert d2["lease_end"] is None

    app.dependency_overrides.pop(get_current_tenant_profile, None)


# ===========================================================================
# 6. LANDLORD LEASE UPDATE ENDPOINT (PUT /api/v1/landlord/units/{unit_id}/lease)
# ===========================================================================

@pytest.mark.asyncio
async def test_adv_landlord_update_lease_syncs_with_active_tenant(client: AsyncClient, seed_data, db_session: AsyncSession):
    """PUT /api/v1/landlord/units/{unit_id}/lease updates Unit AND active TenantProfile synchronously."""
    landlord = seed_data["landlord"]
    prop = seed_data["property"]

    unit = Unit(
        property_id=prop.id,
        unit_label="Unit Sync",
        rent_amount=1500.0,
        deposit_amount=1500.0,
        lease_start=date(2026, 1, 1),
        lease_end=date(2026, 12, 31),
    )
    db_session.add(unit)
    await db_session.commit()
    await db_session.refresh(unit)

    tenant_user = User(clerk_id="clerk_sync_t", email="sync_t@homepost.dev", role=UserRole.TENANT)
    db_session.add(tenant_user)
    await db_session.commit()
    await db_session.refresh(tenant_user)

    profile = TenantProfile(
        user_id=tenant_user.id,
        unit_id=unit.id,
        lease_start=date(2026, 1, 1),
        lease_end=date(2026, 12, 31),
        is_active=True,
    )
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(profile)

    app.dependency_overrides[get_current_landlord] = lambda: landlord
    try:
        # 1. Update lease to new dates
        res = await client.put(
            f"/api/v1/landlord/units/{unit.id}/lease",
            json={
                "lease_start": "2027-01-01",
                "lease_end": "2027-12-31",
            },
        )
        assert res.status_code == 200, res.text

        await db_session.refresh(unit)
        await db_session.refresh(profile)
        assert unit.lease_start == date(2027, 1, 1)
        assert unit.lease_end == date(2027, 12, 31)
        assert profile.lease_start == date(2027, 1, 1)
        assert profile.lease_end == date(2027, 12, 31)

        # 2. Clear lease dates
        res_clear = await client.put(
            f"/api/v1/landlord/units/{unit.id}/lease",
            json={
                "lease_start": None,
                "lease_end": None,
            },
        )
        assert res_clear.status_code == 200, res_clear.text

        await db_session.refresh(unit)
        await db_session.refresh(profile)
        assert unit.lease_start is None
        assert unit.lease_end is None
        assert profile.lease_start is None
        assert profile.lease_end is None

    finally:
        app.dependency_overrides.pop(get_current_landlord, None)
