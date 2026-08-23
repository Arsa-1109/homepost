"""
Issue #9 — self-created ("own") accounts in local hosted/mock mode.

Policy under test:
1. When ENABLE_DEMO_AUTH is explicitly true (non-production), unsigned
   alg:"none" tokens are accepted for ANY subject — not just the three
   designated demo personas — so locally created accounts
   (id prefix `user_own_`) can reach the API.
2. The demo mutation guard stays scoped strictly to ALLOWED_DEMO_USER_IDS:
   designated demo accounts remain read-only while own accounts get full
   write access.
3. Unsigned tokens are still rejected when ENABLE_DEMO_AUTH is off.
"""

import uuid

import pytest
from httpx import AsyncClient

from jwt_helpers import make_alg_none_token

OWN_USER_ID = f"user_own_{uuid.uuid4()}"
DEMO_LANDLORD_ID = "user_demo_landlord_001"


def _demo_auth_enabled(monkeypatch):
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "mock_auth", False)
    monkeypatch.setattr(settings, "enable_demo_auth", True)
    monkeypatch.setattr(settings, "environment", "development")


async def _seed_landlord(db_session, clerk_id: str, email: str, name: str):
    from app.models.user import User, UserRole

    user = User(
        id=uuid.uuid4(),
        clerk_id=clerk_id,
        email=email,
        full_name=name,
        role=UserRole.LANDLORD,
    )
    db_session.add(user)
    await db_session.commit()
    return user


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def test_unsigned_token_for_own_account_sub_accepted_when_demo_auth_enabled(
    client: AsyncClient, monkeypatch
):
    """An unsigned token carrying a NON-demo sub must authenticate successfully."""
    _demo_auth_enabled(monkeypatch)

    token = make_alg_none_token(OWN_USER_ID, email="owner@example.test")
    response = await client.get("/api/v1/onboarding/me", headers=_bearer(token))

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "owner@example.test"


async def test_own_account_user_has_full_write_access(
    client: AsyncClient, db_session, monkeypatch
):
    """Own accounts must NOT be blocked by the demo mutation guard."""
    _demo_auth_enabled(monkeypatch)
    await _seed_landlord(
        db_session, OWN_USER_ID, "owner@example.test", "Own Account Landlord"
    )

    token = make_alg_none_token(OWN_USER_ID, email="owner@example.test")
    response = await client.post(
        "/api/v1/landlord/properties",
        headers=_bearer(token),
        json={"name": "Pine Court", "address": "9 Pine St", "city": "Pune"},
    )

    assert response.status_code == 200


async def test_designated_demo_account_still_mutation_blocked(
    client: AsyncClient, db_session, monkeypatch
):
    """The read-only restriction survives for the three designated demo ids."""
    _demo_auth_enabled(monkeypatch)
    await _seed_landlord(
        db_session, DEMO_LANDLORD_ID, "landlord@homepost.demo", "Marcus Vance"
    )

    token = make_alg_none_token(DEMO_LANDLORD_ID, email="landlord@homepost.demo")
    response = await client.post(
        "/api/v1/landlord/properties",
        headers=_bearer(token),
        json={"name": "Pine Court", "address": "9 Pine St", "city": "Pune"},
    )

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "DEMO_MUTATION_RESTRICTED"


async def test_unsigned_token_rejected_without_demo_auth(client: AsyncClient, monkeypatch):
    """Fail-closed regression: no ENABLE_DEMO_AUTH, no unsigned-token acceptance."""
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "mock_auth", False)
    monkeypatch.setattr(settings, "enable_demo_auth", False)
    monkeypatch.setattr(settings, "environment", "development")

    token = make_alg_none_token(OWN_USER_ID, email="owner@example.test")
    response = await client.get("/api/v1/onboarding/me", headers=_bearer(token))

    assert response.status_code == 401
