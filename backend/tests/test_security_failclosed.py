"""
Fail-closed JWT policy tests (C2).

Proves that unsigned (alg:"none") tokens are rejected by default and are
only ever accepted when ALL of the following hold:
  - ENABLE_DEMO_AUTH is explicitly true
  - environment != "production"
Any non-empty subject is then accepted (Issue #9: locally created "own"
accounts); read-only enforcement for designated demo accounts lives in
guard_demo_mutation, scoped to ALLOWED_DEMO_USER_IDS.

Also covers:
  - single source of truth for MOCK_AUTH (no raw os.getenv consult)
  - production startup guard refusing to boot with MOCK_AUTH set
  - signed tokens must carry either an `aud` or an `azp` claim
"""

import pytest

from jwt_helpers import clerk_claims, make_alg_none_token, make_rsa_jwks, sign_rs256

from app.core.config import get_settings, Settings
from app.core.security import (
    TokenVerificationError,
    validate_secure_environment,
    verify_clerk_token,
)

DEMO_LANDLORD = "user_demo_landlord_001"


@pytest.fixture(autouse=True)
def default_posture(monkeypatch):
    """Secure-by-default baseline for every test in this module."""
    settings = get_settings()
    monkeypatch.setattr(settings, "mock_auth", False)
    monkeypatch.setattr(settings, "enable_demo_auth", False)
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.delenv("MOCK_AUTH", raising=False)


@pytest.fixture
def rsa_setup(monkeypatch):
    private_pem, jwks = make_rsa_jwks()

    async def fake_get_jwks():
        return jwks

    monkeypatch.setattr("app.core.security._get_jwks", fake_get_jwks)
    return private_pem


async def test_alg_none_rejected_by_default():
    """
    THE C2 HOLE: with default settings (ENABLE_DEMO_AUTH=false) in development,
    a forged alg:'none' token for a demo user MUST be rejected.
    """
    with pytest.raises(TokenVerificationError):
        await verify_clerk_token(make_alg_none_token(DEMO_LANDLORD))


async def test_alg_none_accepted_with_explicit_demo_auth(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "enable_demo_auth", True)
    payload = await verify_clerk_token(make_alg_none_token(DEMO_LANDLORD))
    assert payload["sub"] == DEMO_LANDLORD


async def test_alg_none_accepted_for_own_account_sub_when_enabled(monkeypatch):
    """
    Issue #9: with ENABLE_DEMO_AUTH explicitly true in a non-production
    environment, unsigned tokens are accepted for ANY subject so locally
    created ("own") accounts can authenticate. Read-only enforcement for the
    designated demo accounts lives in guard_demo_mutation instead.
    """
    settings = get_settings()
    monkeypatch.setattr(settings, "enable_demo_auth", True)
    payload = await verify_clerk_token(make_alg_none_token("user_own_9f1c2a3e"))
    assert payload["sub"] == "user_own_9f1c2a3e"


async def test_alg_none_rejected_in_production_even_with_explicit_flag(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "enable_demo_auth", True)
    monkeypatch.setattr(settings, "environment", "production")
    with pytest.raises(TokenVerificationError):
        await verify_clerk_token(make_alg_none_token(DEMO_LANDLORD))


async def test_mock_auth_uses_settings_only(monkeypatch):
    """
    MOCK_AUTH must be read exclusively from settings.mock_auth.
    A raw MOCK_AUTH=true env var alone must NOT unlock mock auth.
    """
    monkeypatch.setenv("MOCK_AUTH", "true")
    with pytest.raises(TokenVerificationError):
        await verify_clerk_token(make_alg_none_token("any_user"))


def test_startup_guard_refuses_production_with_mock_auth(monkeypatch):
    """Booting in production with MOCK_AUTH truthy in the environment is fatal."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("MOCK_AUTH", "true")

    fresh = Settings()
    assert fresh.environment == "production"

    with pytest.raises(RuntimeError):
        validate_secure_environment(fresh)


def test_startup_guard_allows_clean_production(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("MOCK_AUTH", raising=False)

    fresh = Settings()
    assert fresh.environment == "production"
    validate_secure_environment(fresh)


async def test_signed_token_without_aud_and_azp_rejected(rsa_setup, monkeypatch):
    """Tokens missing both `aud` and `azp` claims are rejected (deliberate hardening)."""
    settings = get_settings()
    monkeypatch.setattr(settings, "clerk_issuer", "https://clerk.example.dev")
    claims = clerk_claims()
    claims.pop("aud", None)
    with pytest.raises(TokenVerificationError):
        await verify_clerk_token(sign_rs256(rsa_setup, claims))


async def test_signed_token_with_azp_only_accepted(rsa_setup, monkeypatch):
    """Clerk custom templates often carry azp instead of aud — those stay valid."""
    settings = get_settings()
    monkeypatch.setattr(settings, "clerk_issuer", "https://clerk.example.dev")
    claims = clerk_claims()
    claims.pop("aud", None)
    claims["azp"] = "https://homepost-rental.vercel.app"
    payload = await verify_clerk_token(sign_rs256(rsa_setup, claims))
    assert payload["azp"] == "https://homepost-rental.vercel.app"
