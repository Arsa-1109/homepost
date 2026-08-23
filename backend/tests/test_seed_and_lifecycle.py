import pytest
from sqlalchemy import select
from sqlmodel import SQLModel

from app.dependencies.auth import get_current_landlord, get_active_tenant_profile, get_current_user
from app.main import app
from app.models.announcement import Announcement
from app.models.document import Document
from app.models.maintenance_event import MaintenanceEvent
from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority
from app.models.property import Property
from app.models.tenant_profile import TenantProfile
from app.models.unit import Unit
from app.models.user import User, UserRole
from seed import (
    DEFAULT_LANDLORD_CLERK_ID,
    DEFAULT_LANDLORD_EMAIL,
    DEFAULT_TENANT_1_CLERK_ID,
    DEFAULT_TENANT_2_CLERK_ID,
    clean_database,
    seed_data,
)


@pytest.mark.asyncio
async def test_seed_creates_expected_entities(db_session):
    """Verify that seed_data populates the exact expected entity hierarchy."""
    await seed_data(clean_first=True, session=db_session)

    # 1. Check Landlord User
    landlords = (
        await db_session.execute(
            select(User).where(User.clerk_id == DEFAULT_LANDLORD_CLERK_ID)
        )
    ).scalars().all()
    assert len(landlords) == 1
    landlord = landlords[0]
    assert landlord.role == UserRole.LANDLORD
    assert landlord.email == DEFAULT_LANDLORD_EMAIL

    # 2. Check Mock Tenants
    tenants = (
        await db_session.execute(
            select(User).where(User.role == UserRole.TENANT)
        )
    ).scalars().all()
    assert len(tenants) == 2
    tenant_clerk_ids = {t.clerk_id for t in tenants}
    assert DEFAULT_TENANT_1_CLERK_ID in tenant_clerk_ids
    assert DEFAULT_TENANT_2_CLERK_ID in tenant_clerk_ids

    # 3. Check Properties
    properties = (
        await db_session.execute(
            select(Property).where(Property.owner_id == landlord.id)
        )
    ).scalars().all()
    assert len(properties) == 2
    property_names = {p.name for p in properties}
    assert "Maplewood Heights" in property_names
    assert "Sunset Vista Apartments" in property_names

    # 4. Check Units
    units = (await db_session.execute(select(Unit))).scalars().all()
    assert len(units) == 4
    occupied_units = [u for u in units if u.status == "Occupied"]
    vacant_units = [u for u in units if u.status == "Vacant"]
    assert len(occupied_units) == 2
    assert len(vacant_units) == 2

    # 5. Check Tenant Profiles
    profiles = (await db_session.execute(select(TenantProfile))).scalars().all()
    assert len(profiles) == 2
    for profile in profiles:
        assert profile.is_active is True
        assert profile.lease_start is not None
        assert profile.lease_end is not None

    # 6. Check Maintenance Requests across 3 states
    requests = (await db_session.execute(select(MaintenanceRequest))).scalars().all()
    assert len(requests) == 3
    statuses = {r.status for r in requests}
    assert RequestStatus.OPEN in statuses
    assert RequestStatus.IN_PROGRESS in statuses
    assert RequestStatus.RESOLVED in statuses

    # 7. Check Maintenance Events
    events = (await db_session.execute(select(MaintenanceEvent))).scalars().all()
    assert len(events) == 8  # 1 on open + 3 on in_progress + 4 on resolved
    event_types = {e.event_type for e in events}
    assert "created" in event_types
    assert "status_changed" in event_types
    assert "note_added" in event_types

    # 8. Check Announcements (property-wide and unit-specific)
    announcements = (await db_session.execute(select(Announcement))).scalars().all()
    assert len(announcements) == 3
    property_wide = [a for a in announcements if a.unit_id is None]
    unit_specific = [a for a in announcements if a.unit_id is not None]
    assert len(property_wide) == 2
    assert len(unit_specific) == 1

    # 9. Check Documents visible to the Unit 101 demo tenant
    documents = (await db_session.execute(select(Document))).scalars().all()
    assert len(documents) == 3
    doc_property_wide = [d for d in documents if d.unit_id is None]
    doc_unit_specific = [d for d in documents if d.unit_id is not None]
    assert len(doc_property_wide) == 2
    assert len(doc_unit_specific) == 1
    unit101 = next(u for u in units if u.unit_label == "Unit 101")
    assert doc_unit_specific[0].unit_id == unit101.id
    assert all(d.file_key for d in documents)
    assert all(d.uploaded_by == landlord.id for d in documents)


@pytest.mark.asyncio
async def test_seed_idempotency(db_session):
    """Verify that calling seed_data multiple times without clean_first doesn't duplicate records."""
    await seed_data(clean_first=True, session=db_session)
    await seed_data(clean_first=False, session=db_session)

    users = (await db_session.execute(select(User))).scalars().all()
    assert len(users) == 3

    properties = (await db_session.execute(select(Property))).scalars().all()
    assert len(properties) == 2

    units = (await db_session.execute(select(Unit))).scalars().all()
    assert len(units) == 4

    requests = (await db_session.execute(select(MaintenanceRequest))).scalars().all()
    assert len(requests) == 3


@pytest.mark.asyncio
async def test_clean_database_wipes_all_records(db_session):
    """Verify that clean_database removes all seeded records cleanly."""
    await seed_data(clean_first=True, session=db_session)
    await clean_database(db_session)

    assert len((await db_session.execute(select(User))).scalars().all()) == 0
    assert len((await db_session.execute(select(Property))).scalars().all()) == 0
    assert len((await db_session.execute(select(Unit))).scalars().all()) == 0
    assert len((await db_session.execute(select(TenantProfile))).scalars().all()) == 0
    assert len((await db_session.execute(select(MaintenanceRequest))).scalars().all()) == 0
    assert len((await db_session.execute(select(MaintenanceEvent))).scalars().all()) == 0
    assert len((await db_session.execute(select(Announcement))).scalars().all()) == 0


@pytest.mark.asyncio
async def test_seed_with_custom_landlord_clerk_id(db_session):
    """Verify that custom landlord credentials can be passed via CLI/args."""
    custom_clerk_id = "user_custom_test_landlord_999"
    custom_email = "custom_landlord@test.com"

    await seed_data(
        landlord_clerk_id=custom_clerk_id,
        landlord_email=custom_email,
        clean_first=True,
        session=db_session,
    )

    user = (
        await db_session.execute(
            select(User).where(User.clerk_id == custom_clerk_id)
        )
    ).scalars().first()

    assert user is not None
    assert user.email == custom_email
    assert user.role == UserRole.LANDLORD


@pytest.mark.asyncio
async def test_seeded_data_queried_via_landlord_api(db_session, client):
    """Verify that landlord endpoints return seeded properties and summary accurately."""
    await seed_data(clean_first=True, session=db_session)

    landlord = (
        await db_session.execute(
            select(User).where(User.clerk_id == DEFAULT_LANDLORD_CLERK_ID)
        )
    ).scalars().first()

    # Override auth to act as the seeded landlord
    app.dependency_overrides[get_current_user] = lambda: landlord
    app.dependency_overrides[get_current_landlord] = lambda: landlord

    # 1. Properties API
    resp = await client.get("/api/v1/landlord/properties")
    assert resp.status_code == 200
    props = resp.json()["items"]
    assert len(props) == 2

    # 2. Maintenance Requests API
    resp = await client.get("/api/v1/landlord/maintenance")
    assert resp.status_code == 200
    requests = resp.json()["items"]
    assert len(requests) == 3

    # Clean up overrides
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_landlord, None)


@pytest.mark.asyncio
async def test_seeded_data_queried_via_tenant_api(db_session, client, mock_storage):
    """Verify that tenant endpoints return unit-isolated maintenance requests and announcements."""
    await seed_data(clean_first=True, session=db_session)

    tenant1 = (
        await db_session.execute(
            select(User).where(User.clerk_id == DEFAULT_TENANT_1_CLERK_ID)
        )
    ).scalars().first()

    t1_profile = (
        await db_session.execute(
            select(TenantProfile).where(TenantProfile.user_id == tenant1.id)
        )
    ).scalars().first()

    # Override auth to act as Tenant 1 (Unit 101)
    app.dependency_overrides[get_current_user] = lambda: tenant1
    app.dependency_overrides[get_active_tenant_profile] = lambda: t1_profile

    # 1. Tenant Maintenance Requests (Should see Unit 101 requests: sink leak & balcony door = 2)
    resp = await client.get("/api/v1/tenant/maintenance")
    assert resp.status_code == 200
    reqs = resp.json()["items"]
    assert len(reqs) == 2
    titles = {r["title"] for r in reqs}
    assert "Leaking kitchen sink pipe" in titles
    assert "Broken balcony door latch" in titles

    # 2. Tenant Announcements (Should see Maplewood Heights property-wide + Unit 101 announcement = 2)
    resp = await client.get("/api/v1/tenant/announcements")
    assert resp.status_code == 200
    announcements = resp.json()["items"]
    assert len(announcements) == 2

    # Clean up overrides
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_active_tenant_profile, None)
