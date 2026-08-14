from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

from app.core.database import get_session
from app.dependencies.auth import get_current_landlord
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.maintenance_request import MaintenanceRequest, VALID_TRANSITIONS
from app.models.maintenance_event import MaintenanceEvent
from app.models.announcement import Announcement
from app.schemas.property import PropertyCreate, PropertyUpdate
from app.schemas.unit import UnitCreate, UnitUpdate, UnitResponse
from app.schemas.maintenance import MaintenanceRequestUpdate, MaintenanceRequestResponse
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.email import (
    send_status_update,
    send_approval_notification,
    send_denial_notification,
)
from app.services.storage import generate_presigned_download_url, hydrate_maintenance_request, hydrate_announcement

router = APIRouter(prefix="/landlord", tags=["Landlord"])

# ---------------------------------------------------------------------------
# Properties
# ---------------------------------------------------------------------------

def format_address(address: str) -> str:
    if not address:
        return ""
    words = address.split(' ')
    formatted_words = []
    for word in words:
        if not word:
            continue
        w = word.lower()
        if w == 'drives':
            w = 'drive'
        elif w == 'streets':
            w = 'street'
        elif w == 'avenues':
            w = 'avenue'
        formatted_words.append(w[0].upper() + w[1:])
    return ' '.join(formatted_words)


@router.post("/properties", response_model=Property)
async def create_property(
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

@router.get("/properties", response_model=list[Property])
async def list_properties(
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Property).where(Property.owner_id == user.id))
    return result.scalars().all()

@router.put("/properties/{property_id}", response_model=Property)
async def update_property(
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
async def delete_property(
    property_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Property not found")
        
    # Check for active tenants in any unit
    from app.models.tenant_profile import TenantProfile
    from app.models.unit import Unit
    from sqlalchemy import select, delete
    
    units_res = await session.execute(select(Unit.id).where(Unit.property_id == property_id))
    unit_ids = units_res.scalars().all()
    
    if unit_ids:
        tenant_res = await session.execute(
            select(TenantProfile).where(
                TenantProfile.unit_id.in_(unit_ids),
                TenantProfile.is_active == True
            )
        )
        if tenant_res.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="Cannot delete a property with occupied units. Please remove the tenants first."
            )
            
        # Delete associated data for all units
        from app.models.invite import Invite
        from app.models.maintenance_request import MaintenanceRequest
        from app.models.document import Document
        
        await session.execute(delete(Invite).where(Invite.unit_id.in_(unit_ids)))
        await session.execute(delete(MaintenanceRequest).where(MaintenanceRequest.unit_id.in_(unit_ids)))
        await session.execute(delete(Document).where(Document.unit_id.in_(unit_ids)))
        await session.execute(delete(TenantProfile).where(TenantProfile.unit_id.in_(unit_ids)))
        
        # Delete the units
        await session.execute(delete(Unit).where(Unit.property_id == property_id))
        
    # Delete property-level data
    from app.models.announcement import Announcement
    from app.models.document import Document
    await session.execute(delete(Announcement).where(Announcement.property_id == property_id))
    await session.execute(delete(Document).where(Document.property_id == property_id))
    
    await session.delete(prop)
    await session.commit()
    return None

# ---------------------------------------------------------------------------
# Units
# ---------------------------------------------------------------------------
@router.post("/units", response_model=Unit)
async def create_unit(
    unit_in: UnitCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    # Ensure property belongs to landlord
    prop = await session.get(Property, unit_in.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")
    
    # Check for duplicate unit_label in the same property
    from sqlalchemy import func
    existing_result = await session.execute(
        select(Unit).where(
            Unit.property_id == unit_in.property_id,
            func.lower(func.trim(Unit.unit_label)) == func.lower(func.trim(unit_in.unit_label))
        )
    )
    existing_unit = existing_result.scalars().first()
    if existing_unit:
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

@router.get("/properties/{property_id}/units", response_model=list[UnitResponse])
async def list_units(
    property_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    from app.models.tenant_profile import TenantProfile
    from app.models.invite import Invite

    prop = await session.get(Property, property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")
    
    result = await session.execute(select(Unit).where(Unit.property_id == property_id))
    units = result.scalars().all()

    unit_ids = [u.id for u in units]
    occupied_unit_ids = set()
    pending_unit_ids = set()

    tenant_profile_map = {}
    if unit_ids:
        # Occupied
        occ_res = await session.execute(
            select(TenantProfile).where(
                TenantProfile.unit_id.in_(unit_ids),
                TenantProfile.is_active == True,
            ).order_by(TenantProfile.created_at.desc())
        )
        profiles = occ_res.scalars().all()
        for tp in profiles:
            if tp.unit_id not in tenant_profile_map:
                tenant_profile_map[tp.unit_id] = tp
        occupied_unit_ids = set(tenant_profile_map.keys())

        # Pending
        inv_res = await session.execute(
            select(Invite.unit_id).where(
                Invite.unit_id.in_(unit_ids),
                Invite.status == "pending"
            )
        )
        pending_unit_ids = {uid for uid in inv_res.scalars().all()}

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
    from app.models.tenant_profile import TenantProfile
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
        
    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    # Check if occupied and get tenant
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
            
    # Check if pending invite
    from app.models.invite import Invite
    inv_res = await session.execute(
        select(Invite).where(
            Invite.unit_id == unit.id,
            Invite.status == "pending"
        )
    )
    has_pending = inv_res.first() is not None

    resp = UnitResponse.model_validate(unit)
    resp.is_occupied = tenant_profile is not None
    resp.has_pending = has_pending

    return {
        "unit": resp,
        "property_name": prop.name,
        "tenant_name": tenant_name,
        "tenant_email": tenant_email,
        "lease_start": (unit.lease_start.isoformat() if unit.lease_start else (tenant_profile.lease_start.isoformat() if tenant_profile and tenant_profile.lease_start else None)),
        "lease_end": (unit.lease_end.isoformat() if unit.lease_end else (tenant_profile.lease_end.isoformat() if tenant_profile and tenant_profile.lease_end else None))
    }

@router.put("/units/{unit_id}", response_model=Unit)
async def update_unit(
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
        
    # If label changes, check for duplicates in the same property
    if unit_in.unit_label and unit_in.unit_label.strip().lower() != unit.unit_label.strip().lower():
        from sqlalchemy import func
        existing_result = await session.execute(
            select(Unit).where(
                Unit.property_id == unit.property_id,
                Unit.id != unit.id,
                func.lower(func.trim(Unit.unit_label)) == func.lower(func.trim(unit_in.unit_label))
            )
        )
        existing_unit = existing_result.scalars().first()
        if existing_unit:
            raise HTTPException(
                status_code=400,
                detail=f"A unit with label '{unit_in.unit_label}' already exists in this property."
            )
            
    # Update fields
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
async def delete_unit(
    unit_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
        
    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    # Check if there is an active tenant in this unit
    from app.models.tenant_profile import TenantProfile
    tenant_res = await session.execute(
        select(TenantProfile).where(
            TenantProfile.unit_id == unit.id,
            TenantProfile.is_active == True
        )
    )
    if tenant_res.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an occupied unit. Please remove the tenant first."
        )
        
    # Delete associated data
    from app.models.invite import Invite
    from app.models.maintenance_request import MaintenanceRequest
    from app.models.document import Document
    from sqlalchemy import delete
    
    await session.execute(delete(Invite).where(Invite.unit_id == unit.id))
    await session.execute(delete(MaintenanceRequest).where(MaintenanceRequest.unit_id == unit.id))
    await session.execute(delete(Document).where(Document.unit_id == unit.id))
    await session.execute(delete(TenantProfile).where(TenantProfile.unit_id == unit.id))
    
    await session.delete(unit)
    await session.commit()
    return {"message": "Unit deleted successfully"}

# ---------------------------------------------------------------------------
# Maintenance Requests
# ---------------------------------------------------------------------------
@router.get("/maintenance", response_model=list[MaintenanceRequestResponse])
async def list_maintenance_requests(
    unit_id: uuid.UUID | None = None,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    # Get maintenance requests for landlord's properties using a single JOIN
    query = (
        select(MaintenanceRequest, Property.name, Unit.unit_label)
        .join(Unit, MaintenanceRequest.unit_id == Unit.id)
        .join(Property, Unit.property_id == Property.id)
        .where(Property.owner_id == user.id)
    )
    
    if unit_id:
        query = query.where(Unit.id == unit_id)
        
    query = query.order_by(MaintenanceRequest.created_at.desc())
    
    req_result = await session.execute(query)
    requests = req_result.all()
    
    response_data = []
    for r, prop_name, unit_label in requests:
        resp = MaintenanceRequestResponse.model_validate(r)
        resp.property_name = prop_name
        resp.unit_label = unit_label
        hydrate_maintenance_request(r, resp)
        response_data.append(resp)
        
    return response_data

@router.patch("/maintenance/{request_id}", response_model=MaintenanceRequestResponse)
async def update_maintenance_request(
    request_id: uuid.UUID,
    req_in: MaintenanceRequestUpdate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    db_req = await session.get(MaintenanceRequest, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Maintenance request not found.")

    # Ensure this request belongs to one of landlord's units
    unit = await session.get(Unit, db_req.unit_id)
    prop = await session.get(Property, unit.property_id)
    if prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # ---------------------------------------------------------------
    # Phase 1: validate inputs and compute change flags
    # ---------------------------------------------------------------
    try:
        if db_req.status == "closed":
            raise HTTPException(status_code=400, detail="Cannot modify a closed maintenance request.")

        status_changed = False
        priority_changed = False
        notes_changed = False
        images_changed = False
        new_image_keys: list[str] = []

        if req_in.status and req_in.status != db_req.status:
            if req_in.status not in VALID_TRANSITIONS.get(db_req.status, []):
                valid_states = [s.value for s in VALID_TRANSITIONS.get(db_req.status, [])]
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status transition from '{db_req.status}' to '{req_in.status}'. "
                           f"Valid transitions are: {valid_states}",
                )
            status_changed = True

        if req_in.priority and req_in.priority != db_req.priority:
            priority_changed = True

        if req_in.landlord_notes is not None and req_in.landlord_notes != db_req.landlord_notes:
            notes_changed = True

        if req_in.landlord_image_keys is not None:
            existing_keys = db_req.landlord_image_keys or []
            new_image_keys = [k for k in req_in.landlord_image_keys if k not in existing_keys]
            if new_image_keys:
                images_changed = True

        # Capture enum string values BEFORE mutating db_req so event logging has accurate before/after
        old_status_val: str = db_req.status.value if hasattr(db_req.status, "value") else str(db_req.status)
        old_priority_val: str = db_req.priority.value if hasattr(db_req.priority, "value") else str(db_req.priority)
        new_status_val: str = (
            (req_in.status.value if hasattr(req_in.status, "value") else str(req_in.status))
            if req_in.status else old_status_val
        )
        new_priority_val: str = (
            (req_in.priority.value if hasattr(req_in.priority, "value") else str(req_in.priority))
            if req_in.priority else old_priority_val
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ---------------------------------------------------------------
    # Phase 2: apply mutations and commit (this MUST always succeed)
    # ---------------------------------------------------------------
    from datetime import datetime, timezone as _tz

    try:
        if status_changed:
            db_req.status = req_in.status
            if req_in.status != "open":
                from app.models.tenant_profile import TenantProfile
                tenant_profile = await session.get(TenantProfile, db_req.tenant_id)
                if tenant_profile:
                    tenant_user = await session.get(User, tenant_profile.user_id)
                    if tenant_user and tenant_user.email:
                        background_tasks.add_task(
                            send_status_update,
                            tenant_email=tenant_user.email,
                            request_title=db_req.title,
                            new_status=req_in.status,
                        )

        if priority_changed:
            db_req.priority = req_in.priority

        if notes_changed:
            db_req.landlord_notes = req_in.landlord_notes

        if req_in.landlord_image_keys is not None:
            db_req.landlord_image_keys = req_in.landlord_image_keys

        db_req.updated_at = datetime.now(_tz.utc)

        await session.commit()
        await session.refresh(db_req)

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while updating the database: {str(e)}",
        )

    # ---------------------------------------------------------------
    # Phase 3: audit event logging — best-effort, never blocks response
    # ---------------------------------------------------------------
    try:
        events: list[MaintenanceEvent] = []

        if status_changed:
            payload: dict = {"old_status": old_status_val, "new_status": new_status_val}
            desc_parts = [f"Landlord changed status from {old_status_val.upper()} to {new_status_val.upper()}."]
            if notes_changed:
                payload["notes"] = req_in.landlord_notes
                desc_parts.append("Added notes.")
            if images_changed:
                payload["image_keys"] = new_image_keys
                payload["image_count"] = len(new_image_keys)
                desc_parts.append(f"Attached {len(new_image_keys)} file(s).")
            events.append(MaintenanceEvent(
                maintenance_request_id=db_req.id,
                actor_id=user.id,
                event_type="status_changed",
                description=" ".join(desc_parts),
                payload=payload,
            ))
        else:
            if notes_changed:
                events.append(MaintenanceEvent(
                    maintenance_request_id=db_req.id,
                    actor_id=user.id,
                    event_type="note_added",
                    description="Landlord updated the resolution notes." if old_status_val else "Landlord added resolution notes.",
                    payload={"notes": req_in.landlord_notes},
                ))
            if images_changed:
                events.append(MaintenanceEvent(
                    maintenance_request_id=db_req.id,
                    actor_id=user.id,
                    event_type="images_attached",
                    description=f"Landlord attached {len(new_image_keys)} resolution file(s).",
                    payload={"image_count": len(new_image_keys), "image_keys": new_image_keys},
                ))

        if priority_changed:
            events.append(MaintenanceEvent(
                maintenance_request_id=db_req.id,
                actor_id=user.id,
                event_type="priority_changed",
                description=f"Landlord changed priority from {old_priority_val.upper()} to {new_priority_val.upper()}.",
                payload={"old_priority": old_priority_val, "new_priority": new_priority_val},
            ))

        if events:
            for ev in events:
                session.add(ev)
            await session.commit()

    except Exception:
        # Audit logging must never surface as a 500 to the client
        try:
            await session.rollback()
        except Exception:
            pass

    resp = MaintenanceRequestResponse.model_validate(db_req)
    hydrate_maintenance_request(db_req, resp)
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
    prop = await session.get(Property, unit.property_id)
    if prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    result = await session.execute(
        select(MaintenanceEvent, User.full_name)
        .join(User, MaintenanceEvent.actor_id == User.id)
        .where(MaintenanceEvent.maintenance_request_id == request_id)
        .order_by(MaintenanceEvent.created_at.asc())
    )
    
    events = []
    for event, user_name in result.all():
        data = event.model_dump()
        data["actor_name"] = user_name or "Unknown User"
        if data.get("payload") and "image_keys" in data["payload"]:
            urls = []
            for key in data["payload"]["image_keys"]:
                try:
                    urls.append(generate_presigned_download_url(key))
                except Exception:
                    pass
            data["payload"]["image_urls"] = urls
        events.append(data)
        
    return events

# ---------------------------------------------------------------------------
# Announcements
# ---------------------------------------------------------------------------
@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    ann_in: AnnouncementCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, ann_in.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")
        
    ann = Announcement(**ann_in.model_dump(), author_id=user.id)
    session.add(ann)
    await session.commit()
    await session.refresh(ann)

    resp = AnnouncementResponse.model_validate(ann)
    hydrate_announcement(ann, resp)
    return resp

@router.get("/announcements", response_model=list[AnnouncementResponse])
async def list_announcements(
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Announcement).where(Announcement.author_id == user.id).order_by(Announcement.created_at.desc())
    )
    anns = result.scalars().all()
    out = []
    for ann in anns:
        resp = AnnouncementResponse.model_validate(ann)
        hydrate_announcement(ann, resp)
        out.append(resp)
    return out

@router.put("/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: uuid.UUID,
    ann_in: AnnouncementUpdate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    ann = await session.get(Announcement, announcement_id)
    if not ann or ann.author_id != user.id:
        raise HTTPException(status_code=404, detail="Announcement not found or access denied.")

    update_data = ann_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ann, key, value)

    session.add(ann)
    await session.commit()
    await session.refresh(ann)

    resp = AnnouncementResponse.model_validate(ann)
    hydrate_announcement(ann, resp)
    return resp

@router.delete("/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
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
from app.models.document import Document

@router.post("/documents", response_model=DocumentResponse)
async def create_document_record(
    doc_in: DocumentCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    # Ensure property belongs to landlord
    prop = await session.get(Property, doc_in.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")
        
    # Validate unit_id if provided
    if doc_in.unit_id:
        unit = await session.get(Unit, doc_in.unit_id)
        if not unit or unit.property_id != doc_in.property_id:
            raise HTTPException(status_code=400, detail="Invalid unit for this property.")

    doc = Document(**doc_in.model_dump(), uploaded_by=user.id)
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    
    url = ""
    try:
        url = generate_presigned_download_url(doc.file_key)
    except Exception:
        pass
        
    resp = DocumentResponse.model_validate(doc)
    resp.file_url = url
    return resp

@router.get("/properties/{property_id}/documents", response_model=list[DocumentResponse])
async def list_documents(
    property_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    # Ensure property belongs to landlord
    prop = await session.get(Property, property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")
        
    result = await session.execute(
        select(Document)
        .where(Document.property_id == property_id)
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    
    response_data = []
    for d in docs:
        url = ""
        try:
            url = generate_presigned_download_url(d.file_key)
        except Exception:
            pass
        resp = DocumentResponse.model_validate(d)
        resp.file_url = url
        response_data.append(resp)
        
    return response_data

@router.get("/units/{unit_id}/documents", response_model=list[DocumentResponse])
async def list_unit_documents(
    unit_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    # Ensure unit and property belong to landlord
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    result = await session.execute(
        select(Document)
        .where(Document.unit_id == unit_id)
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    
    response_data = []
    for d in docs:
        url = ""
        try:
            url = generate_presigned_download_url(d.file_key)
        except Exception:
            pass
        resp = DocumentResponse.model_validate(d)
        resp.file_url = url
        response_data.append(resp)
        
    return response_data

# ---------------------------------------------------------------------------
# Onboarding & Invites (Phase 4)
# ---------------------------------------------------------------------------
from datetime import date
from typing import Optional
from pydantic import BaseModel
from app.models.invite import Invite
from app.models.tenant_profile import TenantProfile
from app.models.user import UserRole

class GenerateInvitePayload(BaseModel):
    unit_id: uuid.UUID
    clear_data: bool = False

class ApproveTenantPayload(BaseModel):
    user_id: uuid.UUID
    unit_id: uuid.UUID
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None

class DenyTenantPayload(BaseModel):
    user_id: uuid.UUID

@router.post("/generate-invite", response_model=Invite)
async def generate_invite(
    payload: GenerateInvitePayload,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session)
):
    # Ensure unit belongs to landlord
    unit = await session.get(Unit, payload.unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    prop = await session.get(Property, unit.property_id)
    if prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if payload.clear_data:
        from app.models.document import Document
        from sqlmodel import select
        # Archive all documents associated with this unit
        docs_result = await session.execute(
            select(Document).where(Document.unit_id == unit.id)
        )
        docs = docs_result.scalars().all()
        for d in docs:
            d.is_archived = True

    invite = Invite(unit_id=unit.id, created_by=user.id)
    session.add(invite)
    await session.commit()
    await session.refresh(invite)
    return invite

@router.get("/pending-tenants", response_model=list[User])
async def pending_tenants(
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(User).where(User.requested_landlord_id == user.id, User.role == UserRole.TENANT_PENDING)
    )
    return result.scalars().all()

@router.post("/approve-tenant")
async def approve_tenant(
    payload: ApproveTenantPayload,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session)
):
    tenant = await session.get(User, payload.user_id)
    if not tenant or tenant.requested_landlord_id != user.id or tenant.role != UserRole.TENANT_PENDING:
        raise HTTPException(status_code=404, detail="Pending tenant request not found.")

    unit = await session.get(Unit, payload.unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    prop = await session.get(Property, unit.property_id)
    if prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Unit access denied.")

    tenant.role = UserRole.TENANT
    tenant.requested_landlord_id = None
    session.add(tenant)

    profile = TenantProfile(
        user_id=tenant.id,
        unit_id=unit.id,
        lease_start=payload.lease_start,
        lease_end=payload.lease_end,
        is_active=True
    )
    session.add(profile)
    await session.commit()

    if tenant.email:
        background_tasks.add_task(
            send_approval_notification,
            tenant_email=tenant.email,
            property_name=prop.name,
            unit_label=unit.unit_label,
        )

    return {"status": "success", "message": "Tenant approved."}

class UpdateLeasePayload(BaseModel):
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None

@router.put("/units/{unit_id}/lease")
async def update_lease(
    unit_id: uuid.UUID,
    payload: UpdateLeasePayload,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session)
):
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Unit access denied.")

    unit.lease_start = payload.lease_start
    unit.lease_end = payload.lease_end
    session.add(unit)

    # Get active tenant profile if any
    occ_res = await session.execute(
        select(TenantProfile).where(
            TenantProfile.unit_id == unit.id,
            TenantProfile.is_active == True,
        )
    )
    tenant_profile = occ_res.scalars().first()
    if tenant_profile:
        tenant_profile.lease_start = payload.lease_start
        tenant_profile.lease_end = payload.lease_end
        session.add(tenant_profile)

    await session.commit()
    return {"status": "success", "message": "Lease dates updated."}

@router.post("/deny-tenant")
async def deny_tenant(
    payload: DenyTenantPayload,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session)
):
    tenant = await session.get(User, payload.user_id)
    if not tenant or tenant.requested_landlord_id != user.id or tenant.role != UserRole.TENANT_PENDING:
        raise HTTPException(status_code=404, detail="Pending tenant request not found.")

    tenant.role = UserRole.UNASSIGNED
    tenant.requested_landlord_id = None
    session.add(tenant)
    await session.commit()

    if tenant.email:
        background_tasks.add_task(
            send_denial_notification,
            tenant_email=tenant.email,
        )

    return {"status": "success", "message": "Tenant request denied."}


# ---------------------------------------------------------------------------
# Dashboard Summary (all data in one call)
# ---------------------------------------------------------------------------
from app.models.tenant_profile import TenantProfile

@router.get("/dashboard")
async def get_dashboard_summary(
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns all data needed to render the landlord dashboard bento grid:
    - Property & unit stats (total, occupied, vacant)
    - Urgent/high-priority open maintenance requests
    - Pending tenant approvals
    - Recent maintenance activity (last 5 events)
    """
    # --- Properties ---
    prop_result = await session.execute(select(Property).where(Property.owner_id == user.id))
    properties = prop_result.scalars().all()
    prop_ids = [p.id for p in properties]

    # --- Units ---
    if prop_ids:
        unit_result = await session.execute(select(Unit).where(Unit.property_id.in_(prop_ids)))
        all_units = unit_result.scalars().all()
    else:
        all_units = []

    unit_ids = [u.id for u in all_units]

    # Occupied = units that have an active tenant profile
    unit_tenant_map = {}
    if unit_ids:
        tenant_profile_result = await session.execute(
            select(TenantProfile.unit_id, User.full_name, User.email)
            .join(User, TenantProfile.user_id == User.id)
            .where(
                TenantProfile.unit_id.in_(unit_ids),
                TenantProfile.is_active == True,
            )
            .order_by(TenantProfile.created_at.desc())
        )
        for uid, full_name, email in tenant_profile_result.all():
            uid_str = str(uid)
            if uid_str not in unit_tenant_map:
                unit_tenant_map[uid_str] = full_name or email
        occupied_unit_ids = set(unit_tenant_map.keys())
    else:
        occupied_unit_ids = set()

    # --- Pending Invites ---
    if unit_ids:
        from app.models.invite import Invite
        invite_result = await session.execute(
            select(Invite.unit_id).where(
                Invite.unit_id.in_(unit_ids),
                Invite.status == "pending"
            )
        )
        pending_unit_ids = {str(uid) for uid in invite_result.scalars().all()}
    else:
        pending_unit_ids = set()

    total_units = len(all_units)
    occupied_count = len(occupied_unit_ids)
    vacant_count = total_units - occupied_count

    # --- Active Maintenance (all open/in_progress, sorted by priority) ---
    if unit_ids:
        from sqlalchemy import case, literal
        priority_order = case(
            (MaintenanceRequest.priority == "urgent", literal(1)),
            (MaintenanceRequest.priority == "high", literal(2)),
            (MaintenanceRequest.priority == "medium", literal(3)),
            (MaintenanceRequest.priority == "low", literal(4)),
            else_=literal(5)
        )
        urgent_result = await session.execute(
            select(MaintenanceRequest)
            .where(
                MaintenanceRequest.unit_id.in_(unit_ids),
                MaintenanceRequest.status.in_(["open", "in_progress"]),
            )
            .order_by(priority_order, MaintenanceRequest.updated_at.desc(), MaintenanceRequest.created_at.desc())
        )
        urgent_requests = urgent_result.scalars().all()
        units_with_pending_maint = {str(r.unit_id) for r in urgent_requests}
    else:
        urgent_requests = []
        units_with_pending_maint = set()

    # Build unit_label lookup for maintenance display
    unit_label_map = {str(u.id): u.unit_label for u in all_units}
    prop_name_map = {str(p.id): p.name for p in properties}
    unit_property_name_map = {
        str(u.id): prop_name_map.get(str(u.property_id), "Unknown Property")
        for u in all_units
    }

    # --- Pending Tenants ---
    pending_result = await session.execute(
        select(User).where(
            User.requested_landlord_id == user.id,
            User.role == UserRole.TENANT_PENDING,
        )
    )
    pending_tenants = pending_result.scalars().all()

    pending_list = []
    for t in pending_tenants:
        pending_list.append({
            "id": str(t.id),
            "name": t.full_name or t.email,
            "email": t.email,
            "unit_label": "—",
        })

    # --- Recent Activity ---
    activity_list = []
    if unit_ids and prop_ids:
        from datetime import datetime, timedelta, timezone
        from app.models.document import Document
        from app.models.maintenance_event import MaintenanceEvent
        from app.models.announcement import Announcement
        from app.schemas.activity import ActivityItem
        
        thirty_days_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
        
        # Fetch maintenance events (landlord actions OR tenant reopens/closures)
        maint_events_result = await session.execute(
            select(MaintenanceEvent, MaintenanceRequest)
            .join(MaintenanceRequest, MaintenanceEvent.maintenance_request_id == MaintenanceRequest.id)
            .where(
                MaintenanceRequest.unit_id.in_(unit_ids),
                MaintenanceEvent.created_at >= thirty_days_ago,
                (MaintenanceEvent.actor_id == user.id) | (MaintenanceEvent.event_type.in_(["reopened", "status_changed"]))
            )
            .order_by(MaintenanceEvent.created_at.desc())
            .limit(10)
        )
        maint_events = maint_events_result.all()
        
        for event, r in maint_events:
            event_meta = r.status.value if hasattr(r.status, 'value') else str(r.status)
            if event.event_type == "reopened":
                event_meta = "reopened"
            
            actor = "landlord" if event.actor_id == user.id else "tenant"
            
            # Exclude status changes to closed if performed by landlord
            if event_meta == "closed" and actor == "landlord":
                continue

            activity_list.append(ActivityItem(
                type="maintenance_update",
                id=r.id,
                title=r.title,
                timestamp=event.created_at,
                meta=event_meta,
                actor=actor,
                property_name=unit_property_name_map.get(str(r.unit_id), "Unknown Property"),
                unit_label=unit_label_map.get(str(r.unit_id), "—")
            ))
            
        recent_docs_result = await session.execute(
            select(Document)
            .where(Document.property_id.in_(prop_ids))
            .order_by(Document.created_at.desc())
            .limit(10)
        )
        recent_docs = recent_docs_result.scalars().all()
        
        for d in recent_docs:
            activity_list.append(ActivityItem(
                type="document_upload",
                id=d.id,
                title=d.title,
                timestamp=d.created_at,
                meta=d.file_type,
                actor="landlord",
                property_name=prop_name_map.get(str(d.property_id), "Unknown Property"),
                unit_label=unit_label_map.get(str(d.unit_id)) if d.unit_id else "All units"
            ))
            
        recent_anns_result = await session.execute(
            select(Announcement)
            .where(Announcement.property_id.in_(prop_ids))
            .order_by(Announcement.created_at.desc())
            .limit(10)
        )
        recent_anns = recent_anns_result.scalars().all()
        
        for a in recent_anns:
            activity_list.append(ActivityItem(
                type="announcement_posted",
                id=a.id,
                title=a.title,
                timestamp=a.created_at,
                meta="",
                actor="landlord",
                property_name=prop_name_map.get(str(a.property_id), "Unknown Property"),
                unit_label=unit_label_map.get(str(a.unit_id)) if a.unit_id else "All units"
            ))
            
        activity_list.sort(key=lambda x: x.timestamp, reverse=True)
        activity_list = activity_list[:5]

    return {
        "property_stats": {
            "total_properties": len(properties),
            "total_units": total_units,
            "occupied_units": occupied_count,
            "vacant_units": vacant_count,
        },
        "units": [
            {
                "id": str(u.id),
                "property_id": str(u.property_id),
                "property_name": prop_name_map.get(str(u.property_id), "Unknown Property"),
                "unit_label": u.unit_label,
                "is_occupied": str(u.id) in occupied_unit_ids,
                "tenant_name": unit_tenant_map.get(str(u.id)),
                "has_pending_maintenance": str(u.id) in units_with_pending_maint,
                "has_pending_invite": str(u.id) in pending_unit_ids,
                "has_pending": str(u.id) in units_with_pending_maint,
            }
            for u in all_units
        ],
        "urgent_maintenance": [
            {
                "id": str(r.id),
                "title": r.title,
                "priority": r.priority.value if hasattr(r.priority, 'value') else str(r.priority),
                "status": r.status.value if hasattr(r.status, 'value') else str(r.status),
                "unit_label": unit_label_map.get(str(r.unit_id), "—"),
                "property_name": unit_property_name_map.get(str(r.unit_id), "—"),
                "created_at": r.created_at.isoformat(),
            }
            for r in urgent_requests
        ],
        "pending_approvals": pending_list,
        "recent_activity": activity_list,
    }


# ---------------------------------------------------------------------------
# Tenant Management
# ---------------------------------------------------------------------------
@router.delete("/units/{unit_id}/tenant", status_code=status.HTTP_200_OK)
async def remove_tenant(
    unit_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    """
    Remove an active tenant from a unit.
    Sets is_active=False and removed_at=now() on all active TenantProfiles for this unit.
    Sets unit.status = 'Vacant'.
    """
    from app.models.tenant_profile import TenantProfile
    from datetime import datetime, timezone

    # 1. Verify landlord owns the property this unit belongs to
    unit = await session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")

    prop = await session.get(Property, unit.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")

    # 2. Find all active tenant profiles for this unit
    statement = select(TenantProfile).where(
        TenantProfile.unit_id == unit_id,
        TenantProfile.is_active == True
    )
    result = await session.execute(statement)
    profiles = result.scalars().all()

    if not profiles:
        raise HTTPException(status_code=404, detail="No active tenant found for this unit.")

    # 3. Soft-delete the tenant profiles
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for profile in profiles:
        profile.is_active = False
        profile.removed_at = now
        session.add(profile)

    # 4. Reset unit status
    unit.status = "Vacant"
    session.add(unit)

    # We do NOT delete or modify historical maintenance requests or documents.
    
    await session.commit()
    
    return {"message": "Tenant successfully removed from unit."}
