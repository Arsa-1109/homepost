from fastapi import APIRouter, Depends, HTTPException, status
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
from app.schemas.maintenance import MaintenanceRequestUpdate
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate
from app.schemas.document import DocumentCreate
from app.services.email import send_status_update

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
@router.get("/maintenance", response_model=list[MaintenanceRequest])
async def list_maintenance_requests(
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    # Get all properties for this landlord
    prop_result = await session.execute(select(Property.id).where(Property.owner_id == user.id))
    prop_ids = prop_result.scalars().all()
    
    if not prop_ids:
        return []
        
    # Get all units for these properties
    unit_result = await session.execute(select(Unit.id).where(Unit.property_id.in_(prop_ids)))
    unit_ids = unit_result.scalars().all()
    
    if not unit_ids:
        return []
        
    # Get all maintenance requests for these units
    req_result = await session.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.unit_id.in_(unit_ids)).order_by(MaintenanceRequest.created_at.desc())
    )
    return req_result.scalars().all()

@router.patch("/maintenance/{request_id}", response_model=MaintenanceRequest)
async def update_maintenance_request(
    request_id: uuid.UUID,
    req_in: MaintenanceRequestUpdate,
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
        
    if req_in.status:
        if req_in.status not in VALID_TRANSITIONS.get(db_req.status, []):
            raise HTTPException(status_code=400, detail=f"Invalid status transition from {db_req.status} to {req_in.status}")
        db_req.status = req_in.status
        
        # Trigger email if status is changing away from OPEN
        if req_in.status != "open":
            tenant_profile = await session.get(User, db_req.tenant_id)
            if tenant_profile and tenant_profile.email:
                send_status_update(
                    tenant_email=tenant_profile.email,
                    request_title=db_req.title,
                    new_status=req_in.status
                )

    if req_in.priority:
        db_req.priority = req_in.priority
        
    await session.commit()
    await session.refresh(db_req)
    return db_req

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

@router.post("/documents", response_model=Document)
async def create_document_record(
    doc_in: DocumentCreate,
    user: User = Depends(get_current_landlord),
    session: AsyncSession = Depends(get_session),
):
    # Ensure property belongs to landlord
    prop = await session.get(Property, doc_in.property_id)
    if not prop or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Property not found or access denied.")
        
    doc = Document(**doc_in.model_dump(), uploaded_by=user.id)
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return doc

@router.get("/properties/{property_id}/documents", response_model=list[Document])
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
    return result.scalars().all()

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
