"""
Clerk JWT Verification

Fetches Clerk's JWKS (JSON Web Key Set) and uses it to verify
incoming JWTs from the Next.js frontend.

How it works:
1. On first call, fetches the public keys from Clerk's JWKS endpoint.
2. Caches the keys in memory (refreshed every 60 minutes).
3. Decodes and validates the JWT: checks issuer, expiration, and signature.
4. Returns the decoded payload (contains 'sub' = Clerk user ID).

Why python-jose?
- Lightweight, supports RS256 (Clerk's signing algorithm).
- No heavy dependencies (unlike PyJWT + cryptography).
"""

import os
import time
from typing import Any

import httpx
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# JWKS Cache — avoids fetching keys on every request
# ---------------------------------------------------------------------------
_jwks_cache: dict[str, Any] | None = None
_jwks_cache_timestamp: float = 0
_JWKS_CACHE_TTL: int = 3600  # 60 minutes


async def _get_jwks() -> dict[str, Any]:
    """
    Fetch and cache Clerk's JWKS (public keys used to verify JWTs).
    Keys are refreshed after the TTL expires.
    """
    global _jwks_cache, _jwks_cache_timestamp

    now = time.time()
    if _jwks_cache is not None and (now - _jwks_cache_timestamp) < _JWKS_CACHE_TTL:
        return _jwks_cache

    async with httpx.AsyncClient() as client:
        response = await client.get(settings.clerk_jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_timestamp = now
        return _jwks_cache


def _find_signing_key(jwks: dict[str, Any], kid: str) -> dict[str, Any]:
    """Find the specific key matching the JWT's key ID (kid) header."""
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    raise JWTError(f"No matching key found for kid: {kid}")


async def verify_clerk_token(token: str) -> dict[str, Any]:
    """
    Verify a Clerk JWT and return the decoded payload.

    Args:
        token: The raw JWT string from the Authorization header.

    Returns:
        Decoded JWT payload dict containing:
        - sub: Clerk user ID (e.g., "user_2abc123")
        - iss: Issuer URL
        - exp: Expiration timestamp
        - iat: Issued-at timestamp

    Raises:
        JWTError: If the token is invalid, expired, or tampered with.
    """
    if settings.mock_auth:
        try:
            payload = jwt.get_unverified_claims(token)
            if not payload.get("sub"):
                payload["sub"] = "user_mock"
            return payload
        except Exception:
            return {
                "sub": "user_mock",
                "email": "mock@example.com",
                "name": "Mock User"
            }

    # Step 1: Extract the key ID from the JWT header (without verifying yet)
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    if not kid:
        raise JWTError("JWT header missing 'kid' field")

    # Step 2: Fetch the matching public key from Clerk's JWKS
    jwks = await _get_jwks()
    signing_key = _find_signing_key(jwks, kid)

    # Step 3: Verify and decode the JWT
    payload = jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        issuer=settings.clerk_issuer,
        options={
            "verify_aud": False,  # Clerk doesn't always set 'aud'
            "verify_exp": True,
            "verify_iss": True,
        },
    )

    return payload
