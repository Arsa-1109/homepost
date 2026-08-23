"""
Tenant Management Domain Services

Approval, removal, and lease workflows linking users, units, and tenant
profiles. Routers stay thin: guards and persistence live here.
"""

import uuid
from datetime import date

from fastapi import BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.user import User, UserRole
from app.core.time import utc_now


async def _get_owned_unit(
    session: AsyncSession, unit_id: uuid.UUID, owner_id: uuid.UUID
) -> tuple[Unit, Property]:
    """Load a unit and assert the landlord owns its parent property."""
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Unit access denied.")
    return unit, prop


async def approve_tenant_for_unit(
    session: AsyncSession,
    tenant_user_id: uuid.UUID,
    unit_id: uuid.UUID,
    owner_id: uuid.UUID,
    lease_start: date | None,
    lease_end: date | None,
) -> tuple[User, Property, Unit]:
    """
    Approve a pending access request: activate a single-occupancy profile on
    the target unit, flip roles, and mark the unit occupied.

    Returns (tenant_user, property, unit) so callers can queue notifications.
    """
    tenant = await session.get(User, tenant_user_id)
    if not tenant or tenant.requested_landlord_id != owner_id or tenant.role != UserRole.TENANT_PENDING:
        raise HTTPException(status_code=404, detail="Pending tenant request not found.")

    unit, prop = await _get_owned_unit(session, unit_id, owner_id)

    # Guard: prevent double active occupancy with row locking
    occ_res = await session.execute(
        select(TenantProfile)
        .where(TenantProfile.unit_id == unit.id, TenantProfile.is_active == True)
        .with_for_update()
    )
    if occ_res.scalars().first():
        raise HTTPException(status_code=409, detail="This unit is already occupied by an active tenant.")

    tenant.role = UserRole.TENANT
    tenant.requested_landlord_id = None
    session.add(tenant)

    effective_lease_start = lease_start if lease_start is not None else unit.lease_start
    effective_lease_end = lease_end if lease_end is not None else unit.lease_end

    user_prof_res = await session.execute(
        select(TenantProfile).where(TenantProfile.user_id == tenant.id)
    )
    profile = user_prof_res.scalar_one_or_none()

    if profile:
        profile.unit_id = unit.id
        profile.lease_start = effective_lease_start
        profile.lease_end = effective_lease_end
        profile.is_active = True
        profile.removed_at = None
        session.add(profile)
    else:
        session.add(TenantProfile(
            user_id=tenant.id,
            unit_id=unit.id,
            lease_start=effective_lease_start,
            lease_end=effective_lease_end,
            is_active=True,
        ))

    unit.status = "Occupied"
    session.add(unit)
    await session.commit()
    return tenant, prop, unit


async def deny_pending_tenant(
    session: AsyncSession, tenant_user_id: uuid.UUID, owner_id: uuid.UUID
) -> User:
    """Reject a pending access request; the user returns to UNASSIGNED."""
    tenant = await session.get(User, tenant_user_id)
    if not tenant or tenant.requested_landlord_id != owner_id or tenant.role != UserRole.TENANT_PENDING:
        raise HTTPException(status_code=404, detail="Pending tenant request not found.")

    tenant.role = UserRole.UNASSIGNED
    tenant.requested_landlord_id = None
    session.add(tenant)
    await session.commit()
    return tenant


async def update_unit_lease(
    session: AsyncSession,
    unit_id: uuid.UUID,
    owner_id: uuid.UUID,
    lease_start: date | None,
    lease_end: date | None,
) -> None:
    """Persist lease dates on the unit and mirror them onto the active profile."""
    unit, _prop = await _get_owned_unit(session, unit_id, owner_id)

    unit.lease_start = lease_start
    unit.lease_end = lease_end
    session.add(unit)

    occ_res = await session.execute(
        select(TenantProfile).where(
            TenantProfile.unit_id == unit.id,
            TenantProfile.is_active == True,
        )
    )
    tenant_profile = occ_res.scalars().first()
    if tenant_profile:
        tenant_profile.lease_start = lease_start
        tenant_profile.lease_end = lease_end
        session.add(tenant_profile)

    await session.commit()


async def remove_active_tenant(
    session: AsyncSession, unit_id: uuid.UUID, owner_id: uuid.UUID
) -> dict:
    """
    Deactivate all active profiles on a unit, revert their users to
    UNASSIGNED, and mark the unit vacant. Returns the success payload.
    """
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")

    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")

    result = await session.execute(
        select(TenantProfile).where(
            TenantProfile.unit_id == unit.id,
            TenantProfile.is_active == True,
        )
    )
    profiles = result.scalars().all()
    if not profiles:
        raise HTTPException(status_code=404, detail="No active tenant found for this unit.")

    now = utc_now()
    user_ids = [profile.user_id for profile in profiles]
    for profile in profiles:
        profile.is_active = False
        profile.removed_at = now
        session.add(profile)

    if user_ids:
        tenant_users_result = await session.execute(
            select(User).where(User.id.in_(user_ids))
        )
        for tenant_user in tenant_users_result.scalars().all():
            tenant_user.role = UserRole.UNASSIGNED
            tenant_user.requested_landlord_id = None
            session.add(tenant_user)

        unit.status = "Vacant"
    session.add(unit)

    await session.commit()
    return {"message": "Tenant successfully removed from unit."}


async def create_unit_invite(
    session: AsyncSession,
    unit_id: uuid.UUID,
    owner_id: uuid.UUID,
    clear_data: bool,
    lease_start: date | None,
    lease_end: date | None,
    rent_due_day: int | None,
):
    """Generate a pending invite for a unit, optionally archiving its documents."""
    from app.models.document import Document
    from app.models.invite import Invite

    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    prop = await session.get(Property, unit.property_id)
    if prop.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if clear_data:
        docs_result = await session.execute(
            select(Document).where(Document.unit_id == unit.id)
        )
        for d in docs_result.scalars().all():
            d.is_archived = True

    if rent_due_day is not None:
        unit.rent_due_day = rent_due_day
        session.add(unit)

    invite = Invite(
        unit_id=unit.id,
        created_by=owner_id,
        lease_start=lease_start,
        lease_end=lease_end,
    )
    session.add(invite)
    await session.commit()
    await session.refresh(invite)
    return invite
