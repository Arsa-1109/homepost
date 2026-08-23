"""
Onboarding Router

Handles the three onboarding paths:
1. Landlord self-registration (POST /register-landlord)
2. Tenant pending request without token (POST /request-access)
3. Tenant accept invite token (POST /accept-invite)

All endpoints require a valid Clerk JWT (get_current_user dependency).
"""

import secrets
import uuid
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.dependencies.auth import get_current_user, guard_demo_mutation
from app.models.user import User, UserRole
from app.models.tenant_profile import TenantProfile
from app.models.invite import Invite, InviteStatus
from app.models.property import Property
from app.models.unit import Unit
from app.services.email import send_pending_tenant_notification
from app.core.time import utc_now, as_aware_utc
from sqlalchemy import func

from app.core.limiter import limiter

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


class RequestAccessPayload(BaseModel):
    landlord_email: str


class AcceptInvitePayload(BaseModel):
    token: str


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return user


class SyncUserPayload(BaseModel):
    email: str
    full_name: str


@router.post("/sync")
@limiter.limit("15/minute")
async def sync_user(
    request: Request,
    payload: SyncUserPayload,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Sync profile fields for the JWT-verified identity.

    The client may only confirm the email already bound to its Clerk identity.
    Roles are NEVER derived from client-supplied emails (C1 hardening).
    """
    if payload.email != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "The submitted email does not match your verified account email.",
                "code": "EMAIL_IDENTITY_MISMATCH",
            },
        )

    user.full_name = payload.full_name

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return {"status": "success", "user": user}



@router.post("/register-landlord")
@limiter.limit("5/minute")
async def register_landlord(
    request: Request,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if user.role != UserRole.UNASSIGNED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has already selected a role."
        )
    
    user.role = UserRole.LANDLORD
    session.add(user)
    await session.commit()
    return {"status": "success", "message": "Registered as Landlord."}


@router.post("/reset-role")
@limiter.limit("5/minute")
async def reset_role(
    request: Request,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    guard_demo_mutation(user, "reset roles")

    if user.role == UserRole.LANDLORD:
        # Check if they have any properties
        statement = select(func.count(Property.id)).where(Property.owner_id == user.id)
        result = await session.execute(statement)
        property_count = result.scalar_one()
        
        if property_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reset role. You have active properties. Please delete them first."
            )
        
        user.role = UserRole.UNASSIGNED
        session.add(user)
        await session.commit()
        return {"status": "success", "message": "Role reset to unassigned."}
    
    elif user.role == UserRole.TENANT_PENDING:
        user.role = UserRole.UNASSIGNED
        user.requested_landlord_id = None
        session.add(user)
        await session.commit()
        return {"status": "success", "message": "Role reset to unassigned."}
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reset role from current state."
        )


@router.post("/request-access")
@limiter.limit("5/minute")
async def request_access(
    request: Request,
    payload: RequestAccessPayload,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if user.role != UserRole.UNASSIGNED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has already selected a role."
        )

    # Find the landlord by email
    statement = select(User).where(User.email == payload.landlord_email, User.role == UserRole.LANDLORD)
    result = await session.execute(statement)
    landlord = result.scalar_one_or_none()

    if not landlord:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Landlord with that email not found."
        )

    user.role = UserRole.TENANT_PENDING
    user.requested_landlord_id = landlord.id
    session.add(user)
    await session.commit()
    
    if landlord.email:
        tenant_name = user.full_name or "A tenant"
        tenant_email = user.email or "No email provided"
        background_tasks.add_task(
            send_pending_tenant_notification,
            landlord_email=landlord.email,
            tenant_name=tenant_name,
            tenant_email=tenant_email,
        )

    return {"status": "success", "message": "Access requested. Waiting for landlord approval."}


class InvitePreviewResponse(BaseModel):
    token: str
    property_name: str
    property_address: str | None = None
    property_city: str | None = None
    unit_label: str
    landlord_name: str | None = None
    landlord_id: uuid.UUID
    property_owner_id: uuid.UUID
    status: str
    expires_at: datetime
    lease_start: date | None = None
    lease_end: date | None = None


@router.get("/invite/{token}", response_model=InvitePreviewResponse)
@limiter.limit("30/minute")
async def get_invite_preview(
    request: Request,
    token: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Public/Authenticated Invite Preview.
    Returns metadata about the invite without accepting or auto-assigning anything.
    """
    statement = select(Invite).where(Invite.token == token)
    result = await session.execute(statement)
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="invite_not_found"
        )

    if invite.status == InviteStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invite_already_used"
        )

    if invite.status == InviteStatus.EXPIRED or as_aware_utc(invite.expires_at) < utc_now():
        if invite.status != InviteStatus.EXPIRED:
            invite.status = InviteStatus.EXPIRED
            session.add(invite)
            await session.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="invite_expired"
        )

    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invite_inactive"
        )

    unit = await session.get(Unit, invite.unit_id)
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="unit_not_found"
        )

    prop = await session.get(Property, unit.property_id)
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="property_not_found"
        )

    landlord = await session.get(User, prop.owner_id)

    return InvitePreviewResponse(
        token=invite.token,
        property_name=prop.name,
        property_address=prop.address,
        property_city=prop.city,
        unit_label=unit.unit_label,
        landlord_name=landlord.full_name if landlord and landlord.full_name else "Property Owner",
        landlord_id=prop.owner_id,
        property_owner_id=prop.owner_id,
        status=invite.status.value if hasattr(invite.status, "value") else str(invite.status),
        expires_at=invite.expires_at,
        lease_start=invite.lease_start or (unit.lease_start if unit else None),
        lease_end=invite.lease_end or (unit.lease_end if unit else None),
    )


@router.post("/accept-invite")
@limiter.limit("10/minute")
async def accept_invite(
    request: Request,
    payload: AcceptInvitePayload,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if user.role == UserRole.LANDLORD:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Landlords cannot accept tenant invites."
        )

    if user.role not in [UserRole.UNASSIGNED, UserRole.TENANT_PENDING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User cannot accept an invite in their current state."
        )

    # Find the invite
    statement = select(Invite).where(Invite.token == payload.token)
    result = await session.execute(statement)
    invite = result.scalar_one_or_none()

    if not invite or not secrets.compare_digest(invite.token, payload.token):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="invite_not_found"
        )

    if invite.status == InviteStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invite_already_used"
        )

    # Note: aware-UTC comparison via core/time helpers (M10)
    if invite.status == InviteStatus.EXPIRED or as_aware_utc(invite.expires_at) < utc_now():
        if invite.status != InviteStatus.EXPIRED:
            invite.status = InviteStatus.EXPIRED
            session.add(invite)
            await session.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="invite_expired"
        )

    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invite_inactive"
        )

    # Fetch unit and property to verify hierarchy and ownership
    unit = await session.get(Unit, invite.unit_id)
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="unit_not_found"
        )

    prop = await session.get(Property, unit.property_id)
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="property_not_found"
        )

    # Prevent property owner or invite creator from accepting their own invite / becoming a tenant
    if user.id == prop.owner_id or user.id == invite.created_by:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are the owner of this property and cannot accept tenant invites for your own units."
        )

    # Check if the unit is already occupied by an active tenant with pessimistic row locking
    occ_statement = (
        select(TenantProfile)
        .where(
            TenantProfile.unit_id == invite.unit_id,
            TenantProfile.is_active == True,
        )
        .with_for_update()
    )
    occ_res = await session.execute(occ_statement)
    existing_unit_profile = occ_res.scalars().first()
    if existing_unit_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="unit_already_occupied"
        )

    # Valid invite. Accept it!
    invite.status = InviteStatus.ACCEPTED
    session.add(invite)

    # Update user role to tenant
    user.role = UserRole.TENANT
    user.requested_landlord_id = None
    session.add(user)

    # Update unit status
    unit.status = "Occupied"
    session.add(unit)

    # Transfer invite lease dates with fallback to unit lease dates
    effective_lease_start = invite.lease_start if invite.lease_start is not None else (unit.lease_start if unit else None)
    effective_lease_end = invite.lease_end if invite.lease_end is not None else (unit.lease_end if unit else None)

    # Update existing profile if user already has one, or create new TenantProfile (maintaining unique user_id)
    user_profile_stmt = select(TenantProfile).where(TenantProfile.user_id == user.id)
    user_profile_res = await session.execute(user_profile_stmt)
    profile = user_profile_res.scalar_one_or_none()

    if profile:
        profile.unit_id = invite.unit_id
        profile.lease_start = effective_lease_start
        profile.lease_end = effective_lease_end
        profile.is_active = True
        profile.removed_at = None
        session.add(profile)
    else:
        profile = TenantProfile(
            user_id=user.id,
            unit_id=invite.unit_id,
            lease_start=effective_lease_start,
            lease_end=effective_lease_end,
            is_active=True
        )
        session.add(profile)

    await session.commit()

    return {"status": "success", "message": "Invite accepted. You are now a tenant."}
