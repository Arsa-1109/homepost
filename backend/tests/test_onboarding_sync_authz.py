"""
Privilege escalation tests for POST /onboarding/sync (C1).

The old implementation inherited the role of ANY existing user whose email
matched a client-supplied payload — letting an unassigned attacker claim a
landlord role by posting someone else's email. These specs pin the fix:

- Syncing with an email that does NOT match the JWT-bound identity → 403,
  attacker's role untouched, victim untouched.
- Syncing with the JWT-bound email succeeds and updates profile fields only.
- users.email carries a unique constraint.
"""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole


async def test_sync_with_foreign_email_is_forbidden_and_changes_nothing(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """
    THE C1 EXPLOIT: an UNASSIGNED attacker posts a LANDLORD's email to /sync.
    Must be 403; attacker stays UNASSIGNED; victim keeps their role/email.
    """
    attacker = seed_data["unassigned"]          # role=UNASSIGNED
    victim = seed_data["landlord"]              # role=LANDLORD

    app.dependency_overrides[get_current_user] = lambda: attacker
    try:
        response = await client.post(
            "/api/v1/onboarding/sync",
            json={"email": victim.email, "full_name": "Attacker Impersonator"},
        )
        assert response.status_code == 403

        await db_session.refresh(attacker)
        assert attacker.role == UserRole.UNASSIGNED
        assert attacker.email != victim.email
        assert attacker.full_name == "Charlie Unassigned"

        await db_session.refresh(victim)
        assert victim.role == UserRole.LANDLORD
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_sync_with_jwt_bound_email_updates_profile_only(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Syncing with the identity-bound email updates full_name; role never changes."""
    user = seed_data["tenant"]
    original_role = user.role

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        response = await client.post(
            "/api/v1/onboarding/sync",
            json={"email": user.email, "full_name": "Updated Name"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["user"]["email"] == user.email
        assert data["user"]["full_name"] == "Updated Name"
        assert data["user"]["role"] == original_role.value

        await db_session.refresh(user)
        assert user.full_name == "Updated Name"
        assert user.role == original_role
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_sync_cannot_inject_requested_landlord(
    client: AsyncClient, seed_data, db_session: AsyncSession
):
    """Role/requested_landlord_id inheritance via email matching is deleted entirely."""
    attacker = seed_data["unassigned"]
    landlord = seed_data["landlord"]

    app.dependency_overrides[get_current_user] = lambda: attacker
    try:
        response = await client.post(
            "/api/v1/onboarding/sync",
            json={"email": landlord.email, "full_name": "Sneaky"},
        )
        assert response.status_code == 403

        await db_session.refresh(attacker)
        assert attacker.requested_landlord_id is None
        assert attacker.role == UserRole.UNASSIGNED
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_duplicate_emails_rejected_by_unique_constraint(db_session: AsyncSession):
    """Data-integrity layer: users.email is unique at the database level."""
    first = User(clerk_id="clerk_dup_a", email="dupe@example.com", full_name="First")
    second = User(clerk_id="clerk_dup_b", email="dupe@example.com", full_name="Second")
    db_session.add(first)
    await db_session.commit()

    db_session.add(second)
    with pytest.raises(Exception):
        await db_session.commit()
