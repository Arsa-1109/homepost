"""
Unit tests for Clerk JWT verification (C3 — PyJWT migration).

These specs exercise verify_clerk_token against a locally generated RS256
keypair presented as a synthetic JWKS, so no network access is required.

Covered behaviors:
- Valid Clerk-shaped RS256 token verifies and returns its claims.
- Expired token rejected.
- Wrong issuer rejected.
- Tampered signature rejected.
- Malformed header rejected.
- Unknown kid rejected.
"""

import base64
import json
import time

import pytest

from jwt_helpers import clerk_claims, make_rsa_jwks, sign_rs256

from app.core.config import get_settings
from app.core.security import TokenVerificationError, verify_clerk_token

CLERK_ISSUER = "https://clerk.example.dev"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


@pytest.fixture(autouse=True)
def jwt_environment(monkeypatch):
    """Deterministic auth settings for every test in this module."""
    settings = get_settings()
    monkeypatch.setattr(settings, "mock_auth", False)
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "clerk_issuer", CLERK_ISSUER)


@pytest.fixture
def rsa_setup(monkeypatch):
    private_pem, jwks = make_rsa_jwks()

    async def fake_get_jwks():
        return jwks

    monkeypatch.setattr("app.core.security._get_jwks", fake_get_jwks)
    return private_pem


async def test_valid_rs256_token_verifies(rsa_setup):
    token = sign_rs256(rsa_setup, clerk_claims(iss=CLERK_ISSUER))
    payload = await verify_clerk_token(token)
    assert payload["sub"] == "user_clerk_real_123"
    assert payload["email"] == "real.user@example.com"


async def test_expired_token_rejected(rsa_setup):
    expired = clerk_claims(
        iss=CLERK_ISSUER, iat=int(time.time()) - 7200,
        exp=int(time.time()) - 3600,
    )
    with pytest.raises(TokenVerificationError):
        await verify_clerk_token(sign_rs256(rsa_setup, expired))


async def test_wrong_issuer_rejected(rsa_setup):
    forged_issuer = clerk_claims(iss="https://evil.example.dev")
    with pytest.raises(TokenVerificationError):
        await verify_clerk_token(sign_rs256(rsa_setup, forged_issuer))


async def test_tampered_signature_rejected(rsa_setup):
    token = sign_rs256(rsa_setup, clerk_claims(iss=CLERK_ISSUER))
    header_b64, payload_b64, sig_b64 = token.split(".")
    tampered_payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "=="))
    tampered_payload["sub"] = "user_attacker_666"
    tampered_token = f"{header_b64}.{_b64url(json.dumps(tampered_payload).encode())}.{sig_b64}"
    with pytest.raises(TokenVerificationError):
        await verify_clerk_token(tampered_token)


async def test_malformed_header_rejected():
    with pytest.raises(TokenVerificationError):
        await verify_clerk_token("not-a-jwt-at-all")


async def test_unknown_kid_rejected(rsa_setup):
    token = sign_rs256(rsa_setup, clerk_claims(iss=CLERK_ISSUER), kid="unknown-kid")
    with pytest.raises(TokenVerificationError):
        await verify_clerk_token(token)


def test_no_jose_import_remains():
    """The retired JWT library must be fully gone from the security module."""
    import inspect
    import app.core.security as security_module

    source = inspect.getsource(security_module)
    assert "jose" not in source
