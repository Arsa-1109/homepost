"""
Authentication & Authorization Dependencies

These are FastAPI Depends() callables that form the "Invisible Firewall":
- get_current_user: Extracts and verifies the Clerk JWT, returns the User.
- get_current_landlord: Ensures the user is a landlord.
- get_current_tenant_profile: Ensures the user is an active tenant, returns their profile.

Data Isolation:
  A tenant can only access data for their assigned unit. This is enforced by
  returning the TenantProfile (which contains unit_id) — all downstream queries
  filter by this unit_id.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.core.security import verify_clerk_token
from app.models.user import User, UserRole
from app.models.tenant_profile import TenantProfile

# Bearer token extractor — looks for "Authorization: Bearer <token>"
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    """
    Verify the Clerk JWT and return the corresponding User from our DB.

    Auto-Sync Behavior:
      If the user exists in Clerk but not in our DB (first API call),
      auto-create a User record with role='unassigned'. The onboarding
      flow will assign the correct role.

    Raises:
        401: Invalid or missing JWT.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "We couldn't verify your identity. Please sign in again.",
                "suggestion": "If this keeps happening, try clearing your browser cache or signing out and back in.",
            },
        )

    try:
        payload = await verify_clerk_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "We couldn't verify your identity. Please sign in again.",
                "suggestion": "If this keeps happening, try clearing your browser cache or signing out and back in.",
            },
        )

    clerk_id: str = payload.get("sub", "")
    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid authentication token."},
        )

    # Look up user in our database
    statement = select(User).where(User.clerk_id == clerk_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()

    if user is None:
        # Auto-create on first API call (Clerk → PostgreSQL sync)
        user = User(
            clerk_id=clerk_id,
            email=payload.get("email", ""),
            full_name=payload.get("name", ""),
            role=UserRole.UNASSIGNED,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    return user


async def get_current_landlord(
    user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the current user is a landlord.

    Raises:
        403: User is not a landlord.
    """
    if user.role != UserRole.LANDLORD:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "This area is reserved for property owners.",
                "suggestion": "If you believe this is a mistake, please contact your property manager.",
            },
        )
    return user


async def get_current_tenant_profile(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> TenantProfile:
    """
    Ensure the current user is an active tenant and return their profile.

    The returned TenantProfile contains unit_id — this is the anchor for
    all data isolation. Every tenant query downstream should filter by
    profile.unit_id.

    Raises:
        403: User is not a tenant.
        404: Tenant has no active tenancy (deactivated or never assigned).
    """
    if user.role != UserRole.TENANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "This section is for tenants only.",
                "suggestion": "If you're a property owner, please use the landlord dashboard instead.",
            },
        )

    statement = select(TenantProfile).where(
        TenantProfile.user_id == user.id
    ).order_by(TenantProfile.created_at.desc())
    result = await session.execute(statement)
    profile = result.scalars().first()

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": "We couldn't find a tenancy linked to your account.",
                "suggestion": "If you've just been invited, try refreshing the page. Otherwise, please contact your landlord.",
            },
        )

    return profile

async def get_active_tenant_profile(
    profile: TenantProfile = Depends(get_current_tenant_profile)
) -> TenantProfile:
    """
    Ensure the tenant is currently active (not removed by landlord).
    Used for endpoints that create or modify data.
    """
    if not profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "You are no longer an active tenant for this property.",
                "suggestion": "You have read-only access to your historical records.",
            },
        )
    return profile


