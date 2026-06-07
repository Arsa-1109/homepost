from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

from app.core.database import get_session
from app.dependencies.auth import get_current_landlord
from app.models.user import User
from app.models.property import Property
from app.models.unit import Unit
from app.models.maintenance_request import MaintenanceRequest, VALID_TRANSITIONS
from app.models.announcement import Announcement
from app.schemas.property import PropertyCreate, PropertyUpdate
from app.schemas.unit import UnitCreate, UnitUpdate
from app.schemas.maintenance import MaintenanceRequestUpdate, MaintenanceRequestResponse
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.email import send_status_update
from app.services.storage import generate_presigned_download_url, hydrate_maintenance_request

router = APIRouter(prefix="/landlord", tags=["Landlord"])

# ---------------------------------------------------------------------------
# Properties
# ---------------------------------------------------------------------------
@router.post("/properties", response_model=Property)
async def create_property(
    prop_in: PropertyCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
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
    
    unit = Unit(**unit_in.model_dump())
    session.add(unit)
    await session.commit()
    await session.refresh(unit)
    return unit

@router.get("/properties/{property_id}/units", response_model=list[Unit])
async def list_units(
    property_id: uuid.UUID,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    prop = await session.get(Property, property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")
    
    result = await session.execute(select(Unit).where(Unit.property_id == property_id))
    return result.scalars().all()

# ---------------------------------------------------------------------------
# Maintenance Requests
# ---------------------------------------------------------------------------
@router.get("/maintenance", response_model=list[MaintenanceRequestResponse])
async def list_maintenance_requests(
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    # Get all maintenance requests for landlord's properties using a single JOIN
    req_result = await session.execute(
        select(MaintenanceRequest, Property.name, Unit.unit_label)
        .join(Unit, MaintenanceRequest.unit_id == Unit.id)
        .join(Property, Unit.property_id == Property.id)
        .where(Property.owner_id == user.id)
        .order_by(MaintenanceRequest.created_at.desc())
    )
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
        
    try:
        if req_in.status and req_in.status != db_req.status:
            if req_in.status not in VALID_TRANSITIONS.get(db_req.status, []):
                valid_states = [s.value for s in VALID_TRANSITIONS.get(db_req.status, [])]
                raise HTTPException(status_code=400, detail=f"Invalid status transition from '{db_req.status}' to '{req_in.status}'. Valid transitions are: {valid_states}")
            db_req.status = req_in.status
            
            # Trigger email if status is changing away from OPEN
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
                            new_status=req_in.status
                        )

        if req_in.priority:
            db_req.priority = req_in.priority
            
        if req_in.landlord_notes is not None:
            db_req.landlord_notes = req_in.landlord_notes
            
        if req_in.landlord_image_keys is not None:
            db_req.landlord_image_keys = req_in.landlord_image_keys
            
        await session.commit()
        await session.refresh(db_req)
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while updating the database: {str(e)}")
    
    resp = MaintenanceRequestResponse.model_validate(db_req)
    hydrate_maintenance_request(db_req, resp)
    return resp

# ---------------------------------------------------------------------------
# Announcements
# ---------------------------------------------------------------------------
@router.post("/announcements", response_model=Announcement)
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
    return ann

@router.get("/announcements", response_model=list[Announcement])
async def list_announcements(
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Announcement).where(Announcement.author_id == user.id).order_by(Announcement.created_at.desc())
    )
    return result.scalars().all()

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

# ---------------------------------------------------------------------------
# Onboarding & Invites (Phase 4)
# ---------------------------------------------------------------------------
from pydantic import BaseModel
from app.models.invite import Invite
from app.models.tenant_profile import TenantProfile
from app.models.user import UserRole

class GenerateInvitePayload(BaseModel):
    unit_id: uuid.UUID

class ApproveTenantPayload(BaseModel):
    user_id: uuid.UUID
    unit_id: uuid.UUID

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
        is_active=True
    )
    session.add(profile)
    await session.commit()
    return {"status": "success", "message": "Tenant approved."}

@router.post("/deny-tenant")
async def deny_tenant(
    payload: DenyTenantPayload,
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
    if unit_ids:
        occupied_result = await session.execute(
            select(TenantProfile.unit_id).where(
                TenantProfile.unit_id.in_(unit_ids),
                TenantProfile.is_active == True,
            )
        )
        occupied_unit_ids = {str(uid) for uid in occupied_result.scalars().all()}
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

    # --- Urgent Maintenance (open or in_progress, priority high/urgent) ---
    if unit_ids:
        urgent_result = await session.execute(
            select(MaintenanceRequest)
            .where(
                MaintenanceRequest.unit_id.in_(unit_ids),
                MaintenanceRequest.status.in_(["open", "in_progress"]),
                MaintenanceRequest.priority.in_(["high", "urgent"]),
            )
            .order_by(MaintenanceRequest.created_at.desc())
            .limit(5)
        )
        urgent_requests = urgent_result.scalars().all()
    else:
        urgent_requests = []

    # Build unit_label lookup for maintenance display
    unit_label_map = {str(u.id): u.unit_label for u in all_units}

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
        from app.schemas.activity import ActivityItem
        
        thirty_days_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
        
        recent_maint_result = await session.execute(
            select(MaintenanceRequest)
            .where(
                MaintenanceRequest.unit_id.in_(unit_ids),
                MaintenanceRequest.updated_at >= thirty_days_ago
            )
            .order_by(MaintenanceRequest.updated_at.desc())
            .limit(10)
        )
        recent_maint = recent_maint_result.scalars().all()
        
        for r in recent_maint:
            activity_list.append(ActivityItem(
                type="maintenance_update",
                id=r.id,
                title=r.title,
                timestamp=r.updated_at,
                meta=r.status.value if hasattr(r.status, 'value') else str(r.status)
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
                meta=d.file_type
            ))
            
        activity_list.sort(key=lambda x: x.timestamp, reverse=True)
        activity_list = activity_list[:5]

    prop_name_map = {str(p.id): p.name for p in properties}

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
                "has_pending": str(u.id) in pending_unit_ids,
            }
            for u in all_units
        ],
        "urgent_maintenance": [
            {
                "id": str(r.id),
                "title": r.title,
                "priority": r.priority,
                "status": r.status,
                "unit_label": unit_label_map.get(str(r.unit_id), "—"),
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
    Sets is_active=False and removed_at=now() on the TenantProfile.
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

    # 2. Find the active tenant profile for this unit
    statement = select(TenantProfile).where(
        TenantProfile.unit_id == unit_id,
        TenantProfile.is_active == True
    )
    result = await session.execute(statement)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="No active tenant found for this unit.")

    # 3. Soft-delete the tenant profile
    profile.is_active = False
    profile.removed_at = datetime.now(timezone.utc).replace(tzinfo=None)

    # 4. Reset unit status
    unit.status = "Vacant"

    # We do NOT delete or modify historical maintenance requests or documents.
    
    await session.commit()
    
    return {"message": "Tenant successfully removed from unit."}
