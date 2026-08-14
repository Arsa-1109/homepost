import uuid
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.invite import Invite, InviteStatus
from app.models.property import Property


async def test_get_me(client: AsyncClient, seed_data):
    """GET /onboarding/me returns the authenticated user."""
    user = seed_data["unassigned"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.get("/api/v1/onboarding/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@homepost.dev"
        assert data["role"] == "unassigned"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_sync_user(client: AsyncClient, seed_data):
    """POST /onboarding/sync updates user profile attributes."""
    user = seed_data["unassigned"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.post(
            "/api/v1/onboarding/sync",
            json={"email": "synced@homepost.dev", "full_name": "Synced User"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["user"]["email"] == "synced@homepost.dev"
        assert data["user"]["full_name"] == "Synced User"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_register_landlord_success(client: AsyncClient, seed_data):
    """POST /onboarding/register-landlord succeeds for unassigned user."""
    user = seed_data["unassigned"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.post("/api/v1/onboarding/register-landlord")
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert user.role == UserRole.LANDLORD
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_register_landlord_already_assigned(client: AsyncClient, seed_data):
    """POST /onboarding/register-landlord fails with 400 if user already has a role."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        response = await client.post("/api/v1/onboarding/register-landlord")
        assert response.status_code == 400
        assert "already selected a role" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_request_access_success_and_email_dispatched(client: AsyncClient, seed_data, mock_emails):
    """POST /onboarding/request-access transitions role to TENANT_PENDING and sends email to landlord."""
    user = seed_data["unassigned"]
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.post(
            "/api/v1/onboarding/request-access",
            json={"landlord_email": landlord.email},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert user.role == UserRole.TENANT_PENDING
        assert user.requested_landlord_id == landlord.id

        # Verify email notification was scheduled and sent
        assert len(mock_emails) == 1
        assert mock_emails[0]["to"] == landlord.email
        assert "New Tenant Request" in mock_emails[0]["subject"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_request_access_landlord_not_found(client: AsyncClient, seed_data):
    """POST /onboarding/request-access returns 404 when landlord email is unknown."""
    user = seed_data["unassigned"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = await client.post(
            "/api/v1/onboarding/request-access",
            json={"landlord_email": "nonexistent@homepost.dev"},
        )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_accept_invite_lifecycle(client: AsyncClient, seed_data, db_session: AsyncSession):
    """Test full invite acceptance lifecycle (success, already used, and expired)."""
    unit = seed_data["unit"]
    landlord = seed_data["landlord"]

    # 1. Create valid pending invite
    invite = Invite(
        id=uuid.uuid4(),
        token="valid-token-123",
        unit_id=unit.id,
        created_by=landlord.id,
        status=InviteStatus.PENDING,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db_session.add(invite)
    await db_session.commit()

    # User accepts invite
    new_user = User(
        clerk_id="clerk_invitee",
        email="invitee@homepost.dev",
        role=UserRole.UNASSIGNED,
    )
    db_session.add(new_user)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: new_user

    try:
        # Happy Path
        res = await client.post("/api/v1/onboarding/accept-invite", json={"token": "valid-token-123"})
        assert res.status_code == 200
        assert res.json()["status"] == "success"
        assert new_user.role == UserRole.TENANT

        # Duplicate Attempt by another unassigned user -> 409 Conflict
        second_user = User(
            clerk_id="clerk_invitee_2",
            email="invitee2@homepost.dev",
            role=UserRole.UNASSIGNED,
        )
        db_session.add(second_user)
        await db_session.commit()
        app.dependency_overrides[get_current_user] = lambda: second_user

        res_dup = await client.post("/api/v1/onboarding/accept-invite", json={"token": "valid-token-123"})
        assert res_dup.status_code == 409
        assert res_dup.json()["detail"] == "invite_already_used"

        # Expired Invite -> 410 Gone
        expired_invite = Invite(
            id=uuid.uuid4(),
            token="expired-token-456",
            unit_id=unit.id,
            created_by=landlord.id,
            status=InviteStatus.PENDING,
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1),
        )
        db_session.add(expired_invite)
        await db_session.commit()

        res_exp = await client.post("/api/v1/onboarding/accept-invite", json={"token": "expired-token-456"})
        assert res_exp.status_code == 410
        assert res_exp.json()["detail"] == "invite_expired"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_reset_role(client: AsyncClient, seed_data, db_session: AsyncSession):
    """POST /onboarding/reset-role handles role resets and enforces property cleanup guard."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # Landlord with existing property should get 400
        res = await client.post("/api/v1/onboarding/reset-role")
        assert res.status_code == 400
        assert "active properties" in res.json()["detail"]

        # User in TENANT_PENDING can reset to UNASSIGNED
        pending_user = User(
            clerk_id="clerk_pending_reset",
            email="pending@homepost.dev",
            role=UserRole.TENANT_PENDING,
            requested_landlord_id=landlord.id,
        )
        db_session.add(pending_user)
        await db_session.commit()

        app.dependency_overrides[get_current_user] = lambda: pending_user
        res_pending = await client.post("/api/v1/onboarding/reset-role")
        assert res_pending.status_code == 200
        assert pending_user.role == UserRole.UNASSIGNED
        assert pending_user.requested_landlord_id is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)
