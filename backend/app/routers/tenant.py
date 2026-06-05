from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

from app.core.database import get_session
from app.dependencies.auth import get_current_tenant_profile, get_current_user
from app.models.user import User
from app.models.tenant_profile import TenantProfile
from app.models.property import Property
from app.models.unit import Unit
from app.models.maintenance_request import MaintenanceRequest, RequestStatus
from app.models.announcement import Announcement
from app.models.document import Document
from app.schemas.maintenance import MaintenanceRequestCreate, MaintenanceRequestResponse
from app.services.email import send_maintenance_notification
from app.services.storage import generate_presigned_download_url

router = APIRouter(prefix="/tenant", tags=["Tenant"])

# ---------------------------------------------------------------------------
# Tenant Profile (Dashboard data)
# ---------------------------------------------------------------------------
@router.get("/profile")
async def get_my_profile(
    profile: TenantProfile = Depends(get_current_tenant_profile),
    session: AsyncSession = Depends(get_session),
):
    """
    Return the tenant's current unit, property, and lease details.
    Used by the dashboard to compute rent-due and lease-expiry countdowns.
    """
    unit = await session.get(Unit, profile.unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")

    prop = await session.get(Property, unit.property_id)

    return {
        "unit_label": unit.unit_label,
        "property_name": prop.name if prop else "Unknown Property",
        "property_address": prop.address if prop else "",
        "property_city": prop.city if prop else "",
        "lease_start": profile.lease_start.isoformat() if profile.lease_start else None,
        "lease_end": profile.lease_end.isoformat() if profile.lease_end else None,
        "rent_due_day": unit.rent_due_day,
        "is_active": profile.is_active,
    }

# ---------------------------------------------------------------------------
# Maintenance Requests
# ---------------------------------------------------------------------------
@router.post("/maintenance", response_model=MaintenanceRequestResponse)
async def submit_maintenance_request(
    req_in: MaintenanceRequestCreate,
    profile: TenantProfile = Depends(get_current_tenant_profile),
    session: AsyncSession = Depends(get_session),
):
    req = MaintenanceRequest(
        **req_in.model_dump(),
        tenant_id=profile.id,
        unit_id=profile.unit_id,
        status=RequestStatus.OPEN
    )
    session.add(req)
    await session.commit()
    await session.refresh(req)
    
    # Send email notification to landlord
    unit = await session.get(Unit, profile.unit_id)
    if unit:
        prop = await session.get(Property, unit.property_id)
        if prop:
            landlord = await session.get(User, prop.owner_id)
            if landlord and landlord.email:
                tenant_user = await session.get(User, profile.id)
                tenant_name = f"{tenant_user.first_name} {tenant_user.last_name}" if tenant_user else "A tenant"
                send_maintenance_notification(
                    landlord_email=landlord.email,
                    tenant_name=tenant_name,
                    unit_label=unit.unit_label,
                    request_title=req.title,
                    priority=req.priority
                )
    
    urls = []
    if req.image_keys:
        for key in req.image_keys:
            try:
                urls.append(generate_presigned_download_url(key))
            except Exception:
                pass

    resp = MaintenanceRequestResponse.model_validate(req)
    resp.image_urls = urls
    return resp

@router.get("/maintenance", response_model=list[MaintenanceRequestResponse])
async def list_my_maintenance_requests(
    profile: TenantProfile = Depends(get_current_tenant_profile),
    session: AsyncSession = Depends(get_session),
):
    # Data isolation anchored on profile.unit_id
    result = await session.execute(
        select(MaintenanceRequest)
        .where(MaintenanceRequest.unit_id == profile.unit_id)
        .order_by(MaintenanceRequest.created_at.desc())
    )
    requests = result.scalars().all()

    response_data = []
    for r in requests:
        urls = []
        if r.image_keys:
            for key in r.image_keys:
                try:
                    urls.append(generate_presigned_download_url(key))
                except Exception:
                    pass
        resp = MaintenanceRequestResponse.model_validate(r)
        resp.image_urls = urls
        response_data.append(resp)

    return response_data

@router.post("/maintenance/{request_id}/reopen", response_model=MaintenanceRequestResponse)
async def reopen_maintenance_request(
    request_id: uuid.UUID,
    profile: TenantProfile = Depends(get_current_tenant_profile),
    session: AsyncSession = Depends(get_session),
):
    req = await session.get(MaintenanceRequest, request_id)
    if not req or req.unit_id != profile.unit_id:
        raise HTTPException(status_code=404, detail="Maintenance request not found.")
        
    if req.status != RequestStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Only resolved requests can be reopened.")
        
    req.status = RequestStatus.OPEN
    await session.commit()
    await session.refresh(req)
    
    # TODO: Send email notification to landlord about reopen
    urls = []
    if req.image_keys:
        for key in req.image_keys:
            try:
                urls.append(generate_presigned_download_url(key))
            except Exception:
                pass

    resp = MaintenanceRequestResponse.model_validate(req)
    resp.image_urls = urls
    return resp

# ---------------------------------------------------------------------------
# Announcements
# ---------------------------------------------------------------------------
@router.get("/announcements", response_model=list[Announcement])
async def list_property_announcements(
    profile: TenantProfile = Depends(get_current_tenant_profile),
    session: AsyncSession = Depends(get_session),
):
    # First, get the unit to find the property_id
    unit = await session.get(Unit, profile.unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
        
    result = await session.execute(
        select(Announcement)
        .where(Announcement.property_id == unit.property_id)
        .order_by(Announcement.created_at.desc())
    )
    return result.scalars().all()

# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
@router.get("/documents", response_model=list[Document])
async def list_shared_documents(
    profile: TenantProfile = Depends(get_current_tenant_profile),
    session: AsyncSession = Depends(get_session),
):
    # First, get the unit to find the property_id
    unit = await session.get(Unit, profile.unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
        
    # Return documents for this property that are either property-wide (unit_id IS NULL) 
    # or specific to this tenant's unit (unit_id == unit.id)
    result = await session.execute(
        select(Document)
        .where(
            Document.property_id == unit.property_id,
            (Document.unit_id == None) | (Document.unit_id == unit.id)
        )
        .order_by(Document.created_at.desc())
    )
    return result.scalars().all()

