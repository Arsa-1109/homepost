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
