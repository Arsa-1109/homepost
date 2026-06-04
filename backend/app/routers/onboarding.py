"""
Onboarding Router

Handles the three onboarding paths:
1. Landlord self-registration (POST /register-landlord)
2. Tenant pending request without token (POST /request-access)
3. Tenant accept invite token (POST /accept-invite)

All endpoints require a valid Clerk JWT (get_current_user dependency).
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.tenant_profile import TenantProfile
from app.models.invite import Invite, InviteStatus

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


class RequestAccessPayload(BaseModel):
    landlord_email: str


class AcceptInvitePayload(BaseModel):
    token: str


@router.post("/register-landlord")
async def register_landlord(
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


@router.post("/request-access")
async def request_access(
    payload: RequestAccessPayload,
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
    
    return {"status": "success", "message": "Access requested. Waiting for landlord approval."}


@router.post("/accept-invite")
async def accept_invite(
    payload: AcceptInvitePayload,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if user.role not in [UserRole.UNASSIGNED, UserRole.TENANT_PENDING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User cannot accept an invite in their current state."
        )

    # Find the invite
    statement = select(Invite).where(Invite.token == payload.token)
    result = await session.execute(statement)
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite token not found."
        )

    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite token has already been used or is invalid."
        )

    # Note: timezone-aware comparison
    if invite.expires_at < datetime.now(timezone.utc):
        invite.status = InviteStatus.EXPIRED
        session.add(invite)
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite token has expired."
        )

    # Valid invite. Accept it!
    invite.status = InviteStatus.ACCEPTED
    session.add(invite)

    # Update user role to tenant
    user.role = UserRole.TENANT
    user.requested_landlord_id = None
    session.add(user)

    # Create tenant profile
    profile = TenantProfile(
        user_id=user.id,
        unit_id=invite.unit_id,
        is_active=True
    )
    session.add(profile)
    await session.commit()

    return {"status": "success", "message": "Invite accepted. You are now a tenant."}
