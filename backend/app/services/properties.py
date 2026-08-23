"""
Property Domain Services

Pure business logic and cascade management for properties and units.
"""

import logging
import re
import uuid
from fastapi import BackgroundTasks, HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, delete

from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.invite import Invite
from app.models.maintenance_request import MaintenanceRequest
from app.models.maintenance_event import MaintenanceEvent
from app.models.document import Document
from app.models.announcement import Announcement
from app.services.storage_cleanup import (
    collect_property_storage_keys,
    collect_unit_storage_keys,
    purge_storage_keys,
    record_cleanup_failures,
)

logger = logging.getLogger(__name__)


def format_address(address: str) -> str:
    """
    Format address string by trimming whitespace, fixing plural street suffixes
    at word boundaries, and capitalizing words.
    """
    if not address:
        return ""
    formatted = address.strip()
    formatted = re.sub(r'\bstreets\b', 'street', formatted, flags=re.IGNORECASE)
    formatted = re.sub(r'\bdrives\b', 'drive', formatted, flags=re.IGNORECASE)
    formatted = re.sub(r'\bavenues\b', 'avenue', formatted, flags=re.IGNORECASE)
    words = formatted.split()
    return ' '.join(w.capitalize() for w in words)


async def purge_storage_keys_with_failure_tracking(object_keys: list[str]) -> None:
    """
    Background task: delete R2 objects best-effort, recording any failures.
    Uses independent error tracking so failures persist independently of request transactions.
    """
    failed = await purge_storage_keys(object_keys)
    if failed:
        await record_cleanup_failures(failed)


async def delete_property_cascade(
    session: AsyncSession,
    property_id: uuid.UUID,
    owner_id: uuid.UUID,
    background_tasks: BackgroundTasks | None = None,
) -> None:
    """
    Perform authorized property cascade deletion with tenant validation and storage key cleanup.
    """
    prop = await session.get(Property, property_id)
    if not prop or prop.owner_id != owner_id:
        raise HTTPException(status_code=404, detail="Property not found")

    # M2: collect R2 keys BEFORE cascade deletes remove their database rows
    storage_keys = await collect_property_storage_keys(session, property_id)

    # Check for active tenants in any unit
    units_res = await session.execute(select(Unit.id).where(Unit.property_id == property_id))
    unit_ids = units_res.scalars().all()

    if unit_ids:
        tenant_res = await session.execute(
            select(TenantProfile).where(
                TenantProfile.unit_id.in_(unit_ids),
                TenantProfile.is_active == True,
            )
        )
        if tenant_res.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="Cannot delete a property with occupied units. Please remove the tenants first.",
            )

        # Delete timeline events first to avoid FK constraint violation
        req_res = await session.execute(
            select(MaintenanceRequest.id).where(MaintenanceRequest.unit_id.in_(unit_ids))
        )
        req_ids = req_res.scalars().all()
        if req_ids:
            await session.execute(
                delete(MaintenanceEvent).where(MaintenanceEvent.maintenance_request_id.in_(req_ids))
            )

        await session.execute(delete(Invite).where(Invite.unit_id.in_(unit_ids)))
        await session.execute(delete(MaintenanceRequest).where(MaintenanceRequest.unit_id.in_(unit_ids)))
        await session.execute(delete(Document).where(Document.unit_id.in_(unit_ids)))
        await session.execute(delete(TenantProfile).where(TenantProfile.unit_id.in_(unit_ids)))

        # Delete the units
        await session.execute(delete(Unit).where(Unit.property_id == property_id))

    # Delete property-level data
    await session.execute(delete(Announcement).where(Announcement.property_id == property_id))
    await session.execute(delete(Document).where(Document.property_id == property_id))

    await session.delete(prop)
    await session.commit()

    # Best-effort background R2 cleanup — never blocks the response
    if storage_keys and background_tasks is not None:
        background_tasks.add_task(purge_storage_keys_with_failure_tracking, storage_keys)


async def delete_unit_cascade(
    session: AsyncSession,
    unit_id: uuid.UUID,
    owner_id: uuid.UUID,
    background_tasks: BackgroundTasks | None = None,
) -> None:
    """
    Perform authorized unit cascade deletion with tenant validation and storage key cleanup.
    """
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")

    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # M2: collect R2 keys BEFORE cascade deletes remove rows
    storage_keys = await collect_unit_storage_keys(session, unit.id)

    # Check for active tenant in unit
    tenant_res = await session.execute(
        select(TenantProfile).where(
            TenantProfile.unit_id == unit.id,
            TenantProfile.is_active == True,
        )
    )
    if tenant_res.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an occupied unit. Please remove the tenant first.",
        )

    # Delete timeline events first
    req_res = await session.execute(
        select(MaintenanceRequest.id).where(MaintenanceRequest.unit_id == unit.id)
    )
    req_ids = req_res.scalars().all()
    if req_ids:
        await session.execute(
            delete(MaintenanceEvent).where(MaintenanceEvent.maintenance_request_id.in_(req_ids))
        )

    await session.execute(delete(Invite).where(Invite.unit_id == unit.id))
    await session.execute(delete(MaintenanceRequest).where(MaintenanceRequest.unit_id == unit.id))
    await session.execute(delete(Document).where(Document.unit_id == unit.id))
    await session.execute(delete(TenantProfile).where(TenantProfile.unit_id == unit.id))

    await session.delete(unit)
    await session.commit()

    if storage_keys and background_tasks is not None:
        background_tasks.add_task(purge_storage_keys_with_failure_tracking, storage_keys)

async def create_property_units_batch(
    session: AsyncSession,
    property_id: uuid.UUID,
    owner_id: uuid.UUID,
    raw_labels: list[str],
) -> list[Unit]:
    """
    Validate, dedupe, format, and persist a batch of units for one property.
    """
    prop = await session.get(Property, property_id)
    if not prop or prop.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")

    clean_labels: list[str] = []
    seen_lower = set()
    for raw_label in raw_labels:
        stripped = raw_label.strip()
        if not stripped:
            continue
        formatted = format_address(stripped)
        lower = formatted.lower()
        if lower in seen_lower:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate unit label '{formatted}' found within the request batch."
            )
        seen_lower.add(lower)
        clean_labels.append(formatted)

    if not clean_labels:
        raise HTTPException(status_code=400, detail="At least one valid unit label must be provided.")

    existing_result = await session.execute(
        select(Unit.unit_label).where(
            Unit.property_id == property_id,
            func.lower(func.trim(Unit.unit_label)).in_(list(seen_lower))
        )
    )
    existing_labels = existing_result.scalars().all()
    if existing_labels:
        raise HTTPException(
            status_code=400,
            detail=f"A unit with label '{existing_labels[0]}' already exists in this property."
        )

    created_units: list[Unit] = []
    for label in clean_labels:
        unit = Unit(property_id=property_id, unit_label=label, rent_due_day=1)
        session.add(unit)
        created_units.append(unit)

    await session.commit()
    for u in created_units:
        await session.refresh(u)
    return created_units


async def get_unit_occupancy_maps(
    session: AsyncSession, unit_ids: list[uuid.UUID]
) -> tuple[dict, set]:
    """
    Latest active TenantProfile per unit plus the set of unit ids holding a
    pending invite.
    """
    tenant_profile_map: dict = {}
    pending_unit_ids: set = set()
    if not unit_ids:
        return tenant_profile_map, pending_unit_ids

    occ_res = await session.execute(
        select(TenantProfile).where(
            TenantProfile.unit_id.in_(unit_ids),
            TenantProfile.is_active == True,
        ).order_by(TenantProfile.created_at.desc())
    )
    for tp in occ_res.scalars().all():
        tenant_profile_map.setdefault(tp.unit_id, tp)

    inv_res = await session.execute(
        select(Invite.unit_id).where(
            Invite.unit_id.in_(unit_ids),
            Invite.status == "pending"
        )
    )
    pending_unit_ids = {uid for uid in inv_res.scalars().all()}
    return tenant_profile_map, pending_unit_ids


async def build_unit_details_response(
    session: AsyncSession, unit_id: uuid.UUID, owner_id: uuid.UUID
) -> dict:
    """Assemble the full unit-detail payload incl. tenant identity and lease."""
    from app.models.user import User
    from app.schemas.unit import UnitResponse

    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")

    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    occ_res = await session.execute(
        select(TenantProfile).where(
            TenantProfile.unit_id == unit.id,
            TenantProfile.is_active == True,
        )
    )
    tenant_profile = occ_res.scalars().first()

    tenant_name = None
    tenant_email = None
    if tenant_profile:
        tenant_user = await session.get(User, tenant_profile.user_id)
        if tenant_user:
            tenant_name = tenant_user.full_name
            tenant_email = tenant_user.email

    inv_res = await session.execute(
        select(Invite).where(
            Invite.unit_id == unit.id,
            Invite.status == "pending"
        )
    )

    resp = UnitResponse.model_validate(unit)
    resp.is_occupied = tenant_profile is not None
    resp.has_pending = inv_res.first() is not None

    return {
        "unit": resp,
        "property_name": prop.name,
        "tenant_name": tenant_name,
        "tenant_email": tenant_email,
        "lease_start": (unit.lease_start.isoformat() if unit.lease_start else (tenant_profile.lease_start.isoformat() if tenant_profile and tenant_profile.lease_start else None)),
        "lease_end": (unit.lease_end.isoformat() if unit.lease_end else (tenant_profile.lease_end.isoformat() if tenant_profile and tenant_profile.lease_end else None))
    }
