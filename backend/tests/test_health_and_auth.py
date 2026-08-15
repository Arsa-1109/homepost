import pytest
from httpx import AsyncClient
from app.main import app
from app.dependencies.auth import get_current_user, get_current_landlord, get_current_tenant_profile
from app.models.user import User, UserRole


async def test_health_check(client: AsyncClient):
    """Smoke test: Checks that the FastAPI application starts up and responds to the health probe."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "homepost-api"}


async def test_unauthorized_without_token(client: AsyncClient):
    """Endpoints requiring authentication should return 401 when no token is supplied."""
    response = await client.get("/api/v1/onboarding/me")
    assert response.status_code == 401


async def test_landlord_guard_rejects_tenant(client: AsyncClient, seed_data):
    """get_current_landlord should return 403 if the user is a tenant."""
    tenant = seed_data["tenant"]
    app.dependency_overrides[get_current_user] = lambda: tenant

    try:
        response = await client.get("/api/v1/landlord/properties")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_tenant_guard_rejects_landlord(client: AsyncClient, seed_data):
    """get_current_tenant_profile should return 403 if the user is a landlord."""
    landlord = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        response = await client.get("/api/v1/tenant/profile")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_tenant_guard_missing_profile(client: AsyncClient, seed_data):
    """get_current_tenant_profile should return 404 if a tenant has no active profile in DB."""
    # Create tenant user with no tenant profile
    tenant_no_profile = User(
        clerk_id="clerk_no_profile",
        email="noprofile@homepost.dev",
        full_name="No Profile Tenant",
        role=UserRole.TENANT,
    )
    app.dependency_overrides[get_current_user] = lambda: tenant_no_profile

    try:
        response = await client.get("/api/v1/tenant/profile")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_forged_alg_none_token_rejected(client: AsyncClient, monkeypatch):
    """In production (MOCK_AUTH=false), unsigned alg: none tokens for non-demo users MUST be rejected with 401."""
    import base64
    import json
    from app.core.config import get_settings

    # Simulate production mode
    settings = get_settings()
    monkeypatch.setattr(settings, "mock_auth", False)
    monkeypatch.setenv("MOCK_AUTH", "false")

    header = base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({
        "sub": "user_victim_real_account_999",
        "email": "victim@example.com",
        "name": "Victim User"
    }).encode()).decode().rstrip("=")
    forged_token = f"{header}.{payload}."

    response = await client.get(
        "/api/v1/onboarding/me",
        headers={"Authorization": f"Bearer {forged_token}"}
    )
    assert response.status_code == 401


async def test_demo_allowlisted_token_accepted(client: AsyncClient, db_session, monkeypatch):
    """In production (MOCK_AUTH=false), unsigned tokens for allowlisted demo accounts should be permitted."""
    import base64
    import json
    import uuid
    from app.core.config import get_settings

    # Simulate production mode
    settings = get_settings()
    monkeypatch.setattr(settings, "mock_auth", False)
    monkeypatch.setenv("MOCK_AUTH", "false")

    # Seed demo landlord user in test DB
    demo_landlord = User(
        id=uuid.uuid4(),
        clerk_id="user_demo_landlord_001",
        email="landlord@homepost.demo",
        full_name="Marcus Vance",
        role=UserRole.LANDLORD,
    )
    db_session.add(demo_landlord)
    await db_session.commit()

    header = base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({
        "sub": "user_demo_landlord_001",
        "email": "landlord@homepost.demo",
        "name": "Marcus Vance"
    }).encode()).decode().rstrip("=")
    demo_token = f"{header}.{payload}."

    response = await client.get(
        "/api/v1/onboarding/me",
        headers={"Authorization": f"Bearer {demo_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "landlord@homepost.demo"
    assert data["role"] == "landlord"


