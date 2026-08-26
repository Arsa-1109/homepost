import logging
import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.core.limiter import limiter
from app.core.pagination import PaginationParams, Page
from app.core.time import utc_now
from app.dependencies.auth import get_current_landlord, require_non_demo_user
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.maintenance_request import MaintenanceRequest
from app.models.announcement import Announcement
from app.models.document import Document
from app.models.invite import Invite

from app.schemas.property import PropertyCreate, PropertyUpdate
from app.schemas.unit import UnitCreate, UnitUpdate, UnitResponse
from app.schemas.maintenance import MaintenanceRequestUpdate, MaintenanceRequestResponse
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from app.schemas.document import DocumentCreate, DocumentResponse

from app.services.email import (
    send_approval_notification,
    send_denial_notification,
)
from app.services.storage import (
    hydrate_maintenance_request,
    hydrate_announcement,
    generate_presigned_urls_batch,
)
from app.services.properties import (
    format_address,
    delete_property_cascade,
    delete_unit_cascade,
    create_property_units_batch,
    get_unit_occupancy_maps,
    build_unit_details_response,
)
from app.services.tenants import (
    approve_tenant_for_unit,
    create_unit_invite,
    deny_pending_tenant,
    update_unit_lease,
    remove_active_tenant,
)
from app.services.maintenance import (
    process_maintenance_update,
    fetch_maintenance_events_with_urls,
)
from app.services.dashboard import (
    get_landlord_dashboard_data,
)

# require_non_demo_user at router level (H7): every mutating route on this
# router structurally rejects demo accounts — no per-endpoint guard calls.
router = APIRouter(
    prefix="/landlord",
    tags=["Landlord"],
    dependencies=[Depends(require_non_demo_user)],
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request Payload Models
# ---------------------------------------------------------------------------
class BatchUnitCreate(BaseModel):
    property_id: uuid.UUID
    unit_labels: list[str] = Field(..., min_length=1, max_length=50)


class GenerateInvitePayload(BaseModel):
    unit_id: uuid.UUID
    clear_data: bool = False
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None
    rent_due_day: Optional[int] = Field(default=None, ge=1, le=31)


class ApproveTenantPayload(BaseModel):
    user_id: uuid.UUID
    unit_id: uuid.UUID
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None


class DenyTenantPayload(BaseModel):
    user_id: uuid.UUID


class UpdateLeasePayload(BaseModel):
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None


# ---------------------------------------------------------------------------
# Properties
# ---------------------------------------------------------------------------
@router.post("/properties", response_model=Property)
@limiter.limit("10/minute")
async def create_property(
    request: Request,
    prop_in: PropertyCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    if prop_in.name:
        prop_in.name = format_address(prop_in.name)
    if prop_in.address:
        prop_in.address = format_address(prop_in.address)
    if prop_in.city:
        prop_in.city = format_address(prop_in.city)

    prop = Property(**prop_in.model_dump(), owner_id=user.id)
    session.add(prop)
    await session.commit()
    await session.refresh(prop)
    return prop


@router.get("/properties", response_model=Page[Property])
async def list_properties(
    pagination: PaginationParams = Depends(),
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    base = select(Property).where(Property.owner_id == user.id)
    total_res = await session.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = total_res.scalar_one()

    result = await session.execute(
        base.order_by(Property.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    items = result.scalars().all()
    return Page(items=items, total=total, limit=pagination.limit, offset=pagination.offset)


@router.put("/properties/{property_id}", response_model=Property)
@limiter.limit("20/minute")
async def update_property(
    request: Request,
    property_id: uuid.UUID,
    prop_in: PropertyUpdate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Property not found")

    update_data = prop_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"]:
        update_data["name"] = format_address(update_data["name"])
    if "address" in update_data and update_data["address"]:
        update_data["address"] = format_address(update_data["address"])
    if "city" in update_data and update_data["city"]:
        update_data["city"] = format_address(update_data["city"])

    for field, value in update_data.items():
        if value is not None:
            setattr(prop, field, value)

    session.add(prop)
    await session.commit()
    await session.refresh(prop)
    return prop


@router.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_property(
    request: Request,
    property_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    await delete_property_cascade(session, property_id, user.id, background_tasks)
    return None


# ---------------------------------------------------------------------------
# Units
# ---------------------------------------------------------------------------
@router.post("/units", response_model=Unit)
@limiter.limit("20/minute")
async def create_unit(
    request: Request,
    unit_in: UnitCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, unit_in.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")

    existing_result = await session.execute(
        select(Unit).where(
            Unit.property_id == unit_in.property_id,
            func.lower(func.trim(Unit.unit_label)) == func.lower(func.trim(unit_in.unit_label))
        )
    )
    if existing_result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail=f"A unit with label '{unit_in.unit_label}' already exists in this property."
        )

    if unit_in.unit_label:
        unit_in.unit_label = format_address(unit_in.unit_label)

    unit = Unit(**unit_in.model_dump())
    session.add(unit)
    await session.commit()
    await session.refresh(unit)
    return unit


@router.post("/units/batch", response_model=list[Unit])
@limiter.limit("20/minute")
async def create_units_batch(
    request: Request,
    batch_in: BatchUnitCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, batch_in.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")

    return await create_property_units_batch(
        session, batch_in.property_id, user.id, batch_in.unit_labels
    )


@router.get("/properties/{property_id}/units", response_model=list[UnitResponse])
async def list_units(
    property_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")

    result = await session.execute(select(Unit).where(Unit.property_id == property_id))
    units = result.scalars().all()

    tenant_profile_map, pending_unit_ids = await get_unit_occupancy_maps(
        session, [u.id for u in units]
    )
    occupied_unit_ids = set(tenant_profile_map.keys())

    response_data = []
    for u in units:
        resp = UnitResponse.model_validate(u)
        tp = tenant_profile_map.get(u.id)
        if not resp.lease_start and tp and tp.lease_start:
            resp.lease_start = tp.lease_start
        if not resp.lease_end and tp and tp.lease_end:
            resp.lease_end = tp.lease_end
        resp.is_occupied = u.id in occupied_unit_ids
        resp.has_pending = u.id in pending_unit_ids
        response_data.append(resp)

    return response_data


@router.get("/units/{unit_id}")
async def get_unit_details(
    unit_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    return await build_unit_details_response(session, unit_id, user.id)


@router.put("/units/{unit_id}", response_model=Unit)
@limiter.limit("20/minute")
async def update_unit(
    request: Request,
    unit_id: uuid.UUID,
    unit_in: UnitUpdate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")

    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if unit_in.unit_label and unit_in.unit_label.strip().lower() != unit.unit_label.strip().lower():
        existing_result = await session.execute(
            select(Unit).where(
                Unit.property_id == unit.property_id,
                Unit.id != unit.id,
                func.lower(func.trim(Unit.unit_label)) == func.lower(func.trim(unit_in.unit_label))
            )
        )
        if existing_result.scalars().first():
            raise HTTPException(
                status_code=400,
                detail=f"A unit with label '{unit_in.unit_label}' already exists in this property."
            )

    if unit_in.unit_label is not None:
        unit.unit_label = format_address(unit_in.unit_label)
    if unit_in.rent_due_day is not None:
        unit.rent_due_day = unit_in.rent_due_day
    if unit_in.lease_start is not None:
        unit.lease_start = unit_in.lease_start
    if unit_in.lease_end is not None:
        unit.lease_end = unit_in.lease_end

    session.add(unit)
    await session.commit()
    await session.refresh(unit)
    return unit


@router.delete("/units/{unit_id}", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def delete_unit(
    request: Request,
    unit_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    await delete_unit_cascade(session, unit_id, user.id, background_tasks)
    return {"message": "Unit deleted successfully"}


# ---------------------------------------------------------------------------
# Maintenance Requests
# ---------------------------------------------------------------------------
@router.get("/maintenance", response_model=Page[MaintenanceRequestResponse])
async def list_maintenance_requests(
    unit_id: uuid.UUID | None = None,
    pagination: PaginationParams = Depends(),
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    filters = [Property.owner_id == user.id]
    if unit_id:
        filters.append(Unit.id == unit_id)

    total_res = await session.execute(
        select(func.count())
        .select_from(MaintenanceRequest)
        .join(Unit, MaintenanceRequest.unit_id == Unit.id)
        .join(Property, Unit.property_id == Property.id)
        .where(*filters)
    )
    total = total_res.scalar_one()

    query = (
        select(MaintenanceRequest, Property.id, Property.name, Unit.unit_label)
        .join(Unit, MaintenanceRequest.unit_id == Unit.id)
        .join(Property, Unit.property_id == Property.id)
        .where(*filters)
        .order_by(MaintenanceRequest.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )

    req_result = await session.execute(query)
    requests = req_result.all()

    response_data = []
    for r, prop_id, prop_name, unit_label in requests:
        resp = MaintenanceRequestResponse.model_validate(r)
        resp.property_id = prop_id
        resp.property_name = prop_name
        resp.unit_label = unit_label
        await hydrate_maintenance_request(r, resp)
        response_data.append(resp)

    return Page(items=response_data, total=total, limit=pagination.limit, offset=pagination.offset)


@router.patch("/maintenance/{request_id}", response_model=MaintenanceRequestResponse)
@limiter.limit("20/minute")
async def update_maintenance_request(
    request: Request,
    request_id: uuid.UUID,
    req_in: MaintenanceRequestUpdate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    db_req = await session.get(MaintenanceRequest, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Maintenance request not found.")

    unit = await session.get(Unit, db_req.unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    prop = await session.get(Property, unit.property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    updated_req = await process_maintenance_update(
        session, db_req, user, req_in, background_tasks
    )

    resp = MaintenanceRequestResponse.model_validate(updated_req)
    resp.property_id = prop.id
    resp.property_name = prop.name
    resp.unit_label = unit.unit_label
    await hydrate_maintenance_request(updated_req, resp)
    return resp


@router.get("/maintenance/{request_id}/events")
async def list_maintenance_events(
    request_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    db_req = await session.get(MaintenanceRequest, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Maintenance request not found.")

    unit = await session.get(Unit, db_req.unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    prop = await session.get(Property, unit.property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return await fetch_maintenance_events_with_urls(session, request_id)


# ---------------------------------------------------------------------------
# Announcements
# ---------------------------------------------------------------------------
@router.post("/announcements", response_model=AnnouncementResponse)
@limiter.limit("10/minute")
async def create_announcement(
    request: Request,
    ann_in: AnnouncementCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, ann_in.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")

    if ann_in.unit_id:
        unit = await session.get(Unit, ann_in.unit_id)
        if not unit or unit.property_id != ann_in.property_id:
            raise HTTPException(status_code=400, detail="Unit does not belong to the specified property.")

    ann = Announcement(**ann_in.model_dump(), author_id=user.id)
    session.add(ann)
    await session.commit()
    await session.refresh(ann)

    resp = AnnouncementResponse.model_validate(ann)
    if ann.unit_id:
        unit = await session.get(Unit, ann.unit_id)
        if unit:
            resp.unit_label = unit.unit_label
    resp.property_name = prop.name
    await hydrate_announcement(ann, resp)
    return resp


@router.get("/announcements", response_model=Page[AnnouncementResponse])
async def list_announcements(
    pagination: PaginationParams = Depends(),
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    base = select(Announcement).where(Announcement.author_id == user.id)
    total_res = await session.execute(select(func.count()).select_from(base.subquery()))
    total = total_res.scalar_one()

    result = await session.execute(
        base.order_by(Announcement.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    anns = result.scalars().all()

    unit_ids = [ann.unit_id for ann in anns if ann.unit_id]
    prop_ids = [ann.property_id for ann in anns if ann.property_id]

    units_map = {}
    if unit_ids:
        unit_res = await session.execute(select(Unit.id, Unit.unit_label).where(Unit.id.in_(unit_ids)))
        units_map = {row[0]: row[1] for row in unit_res.all()}

    props_map = {}
    if prop_ids:
        prop_res = await session.execute(select(Property.id, Property.name).where(Property.id.in_(prop_ids)))
        props_map = {row[0]: row[1] for row in prop_res.all()}

    out = []
    for ann in anns:
        resp = AnnouncementResponse.model_validate(ann)
        if ann.unit_id and ann.unit_id in units_map:
            resp.unit_label = units_map[ann.unit_id]
        if ann.property_id and ann.property_id in props_map:
            resp.property_name = props_map[ann.property_id]
        await hydrate_announcement(ann, resp)
        out.append(resp)
    return Page(items=out, total=total, limit=pagination.limit, offset=pagination.offset)


@router.put("/announcements/{announcement_id}", response_model=AnnouncementResponse)
@limiter.limit("15/minute")
async def update_announcement(
    request: Request,
    announcement_id: uuid.UUID,
    ann_in: AnnouncementUpdate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    ann = await session.get(Announcement, announcement_id)
    if not ann or ann.author_id != user.id:
        raise HTTPException(status_code=404, detail="Announcement not found or access denied.")

    update_data = ann_in.model_dump(exclude_unset=True)
    target_prop_id = update_data.get("property_id", ann.property_id)
    target_unit_id = update_data.get("unit_id", ann.unit_id)

    target_unit = None
    if target_unit_id:
        target_unit = await session.get(Unit, target_unit_id)
        if not target_unit or target_unit.property_id != target_prop_id:
            raise HTTPException(status_code=400, detail="Unit does not belong to the specified property.")

    for key, value in update_data.items():
        setattr(ann, key, value)

    session.add(ann)
    await session.commit()
    await session.refresh(ann)

    resp = AnnouncementResponse.model_validate(ann)
    if ann.unit_id:
        if not target_unit or target_unit.id != ann.unit_id:
            target_unit = await session.get(Unit, ann.unit_id)
        if target_unit:
            resp.unit_label = target_unit.unit_label
    if ann.property_id:
        prop = await session.get(Property, ann.property_id)
        if prop:
            resp.property_name = prop.name
    await hydrate_announcement(ann, resp)
    return resp


@router.delete("/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_announcement(
    request: Request,
    announcement_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    ann = await session.get(Announcement, announcement_id)
    if not ann or ann.author_id != user.id:
        raise HTTPException(status_code=404, detail="Announcement not found or access denied.")

    await session.delete(ann)
    await session.commit()
    return None


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
@router.post("/documents", response_model=DocumentResponse)
@limiter.limit("20/minute")
async def create_document_record(
    request: Request,
    doc_in: DocumentCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, doc_in.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")

    if doc_in.unit_id:
        unit = await session.get(Unit, doc_in.unit_id)
        if not unit or unit.property_id != doc_in.property_id:
            raise HTTPException(status_code=400, detail="Invalid unit for this property.")

    doc = Document(**doc_in.model_dump(), uploaded_by=user.id)
    session.add(doc)
    await session.commit()
    await session.refresh(doc)

    urls = await generate_presigned_urls_batch([doc.file_key])
    resp = DocumentResponse.model_validate(doc)
    resp.file_url = urls[0] if urls else ""
    if doc.unit_id:
        unit = await session.get(Unit, doc.unit_id)
        if unit:
            resp.unit_label = unit.unit_label
    resp.property_name = prop.name
    return resp


@router.get("/properties/{property_id}/documents", response_model=Page[DocumentResponse])
async def list_documents(
    property_id: uuid.UUID,
    pagination: PaginationParams = Depends(),
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")

    base = select(Document).where(Document.property_id == property_id)
    total_res = await session.execute(select(func.count()).select_from(base.subquery()))
    total = total_res.scalar_one()

    result = await session.execute(
        base.order_by(Document.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    docs = result.scalars().all()

    unit_ids = [d.unit_id for d in docs if d.unit_id]
    units_map = {}
    if unit_ids:
        unit_res = await session.execute(select(Unit.id, Unit.unit_label).where(Unit.id.in_(unit_ids)))
        units_map = {row[0]: row[1] for row in unit_res.all()}

    urls = await generate_presigned_urls_batch([d.file_key for d in docs])
    response_data = []
    for d, url in zip(docs, urls):
        resp = DocumentResponse.model_validate(d)
        resp.file_url = url
        if d.unit_id and d.unit_id in units_map:
            resp.unit_label = units_map[d.unit_id]
        resp.property_name = prop.name
        response_data.append(resp)

    return Page(items=response_data, total=total, limit=pagination.limit, offset=pagination.offset)


@router.get("/units/{unit_id}/documents", response_model=Page[DocumentResponse])
async def list_unit_documents(
    unit_id: uuid.UUID,
    pagination: PaginationParams = Depends(),
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    base = select(Document).where(Document.unit_id == unit_id)
    total_res = await session.execute(select(func.count()).select_from(base.subquery()))
    total = total_res.scalar_one()

    result = await session.execute(
        base.order_by(Document.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    docs = result.scalars().all()

    urls = await generate_presigned_urls_batch([d.file_key for d in docs])
    response_data = []
    for d, url in zip(docs, urls):
        resp = DocumentResponse.model_validate(d)
        resp.file_url = url
        resp.unit_label = unit.unit_label
        resp.property_name = prop.name
        response_data.append(resp)

    return Page(items=response_data, total=total, limit=pagination.limit, offset=pagination.offset)


# ---------------------------------------------------------------------------
# Onboarding & Invites
# ---------------------------------------------------------------------------
@router.post("/generate-invite", response_model=Invite)
@limiter.limit("15/minute")
async def generate_invite(
    request: Request,
    payload: GenerateInvitePayload,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    return await create_unit_invite(
        session,
        unit_id=payload.unit_id,
        owner_id=user.id,
        clear_data=payload.clear_data,
        lease_start=payload.lease_start,
        lease_end=payload.lease_end,
        rent_due_day=payload.rent_due_day,
    )


@router.get("/pending-tenants", response_model=Page[User])
async def pending_tenants(
    pagination: PaginationParams = Depends(),
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    base = select(User).where(
        User.requested_landlord_id == user.id, User.role == UserRole.TENANT_PENDING
    )
    total_res = await session.execute(select(func.count()).select_from(base.subquery()))
    total = total_res.scalar_one()

    result = await session.execute(
        base.offset(pagination.offset).limit(pagination.limit)
    )
    items = result.scalars().all()
    return Page(items=items, total=total, limit=pagination.limit, offset=pagination.offset)


@router.post("/approve-tenant")
@limiter.limit("15/minute")
async def approve_tenant(
    request: Request,
    payload: ApproveTenantPayload,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    tenant, prop, unit = await approve_tenant_for_unit(
        session,
        tenant_user_id=payload.user_id,
        unit_id=payload.unit_id,
        owner_id=user.id,
        lease_start=payload.lease_start,
        lease_end=payload.lease_end,
    )

    if tenant.email:
        background_tasks.add_task(
            send_approval_notification,
            tenant_email=tenant.email,
            property_name=prop.name,
            unit_label=unit.unit_label,
        )

    return {"status": "success", "message": "Tenant approved."}


@router.put("/units/{unit_id}/lease")
@limiter.limit("10/minute")
async def update_lease(
    request: Request,
    unit_id: uuid.UUID,
    payload: UpdateLeasePayload,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    await update_unit_lease(
        session, unit_id, user.id, payload.lease_start, payload.lease_end
    )
    return {"status": "success", "message": "Lease dates updated."}


@router.post("/deny-tenant")
@limiter.limit("15/minute")
async def deny_tenant(
    request: Request,
    payload: DenyTenantPayload,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    tenant = await deny_pending_tenant(session, payload.user_id, user.id)

    if tenant.email:
        background_tasks.add_task(
            send_denial_notification,
            tenant_email=tenant.email,
        )

    return {"status": "success", "message": "Tenant request denied."}


# ---------------------------------------------------------------------------
# Dashboard Summary
# ---------------------------------------------------------------------------
@router.get("/dashboard")
async def get_dashboard_summary(
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns all data needed to render the landlord dashboard bento grid.
    Delegates aggregation to dashboard domain service.
    """
    return await get_landlord_dashboard_data(session, user.id)


# ---------------------------------------------------------------------------
# Tenant Management
# ---------------------------------------------------------------------------
@router.delete("/units/{unit_id}/tenant", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def remove_tenant(
    request: Request,
    unit_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    """
    Remove an active tenant from a unit.
    Sets is_active=False and removed_at=now() on all active TenantProfiles for this unit.
    Sets unit.status = 'Vacant'.
    """
    return await remove_active_tenant(session, unit_id, user.id)


