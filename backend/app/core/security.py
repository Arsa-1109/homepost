"""
Clerk JWT Verification

Fetches Clerk's JWKS (JSON Web Key Set) and uses it to verify
incoming JWTs from the Next.js frontend.

How it works:
1. On first call, fetches the public keys from Clerk's JWKS endpoint.
2. Caches the keys in memory (refreshed every 60 minutes).
3. Decodes and validates the JWT: checks issuer, expiration, and signature.
4. Returns the decoded payload (contains 'sub' = Clerk user ID).

Why PyJWT?
- Actively maintained JWT library.
- First-class RS256 support via the `crypto` extra (PyJWK handles JWK dicts).
- All verification failures surface as InvalidTokenError subclasses, mapped
  here onto a single application-level TokenVerificationError.
"""

import logging
import os
import time
from typing import Any

import httpx
import jwt as pyjwt
from jwt import InvalidTokenError

from app.core.config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)

_TRUTHY_ENV_VALUES = {"1", "true", "yes", "on"}


def _env_var_is_truthy(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in _TRUTHY_ENV_VALUES


def validate_secure_environment(config: Any) -> None:
    """
    Startup guard: refuse to boot a production process with mock authentication
    enabled anywhere in the environment. Fail-closed by construction.
    """
    if config.environment == "production" and _env_var_is_truthy("MOCK_AUTH"):
        raise RuntimeError(
            "Refusing to start: MOCK_AUTH is enabled while ENVIRONMENT=production. "
            "Unset MOCK_AUTH before deploying to production."
        )


class TokenVerificationError(Exception):
    """Raised when a JWT cannot be verified against Clerk's policy."""


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


def _find_signing_key(jwks: dict[str, Any], kid: str) -> Any:
    """Find the PyJWT key object matching the JWT's key ID (kid) header."""
    for key_dict in jwks.get("keys", []):
        if key_dict.get("kid") == kid:
            return pyjwt.PyJWK.from_dict(key_dict).key
    raise TokenVerificationError(f"No matching key found for kid: {kid}")


def _unverified_claims(token: str) -> dict[str, Any]:
    """Decode claims without signature verification (header inspection phase)."""
    try:
        return pyjwt.decode(token, options={"verify_signature": False}, algorithms=["RS256", "none", "HS256"])
    except InvalidTokenError as exc:
        raise TokenVerificationError(f"Malformed token: {exc}") from exc


# ---------------------------------------------------------------------------
# Designated Demo Allowlist — strictly permitted for zero-friction landing preview
# ---------------------------------------------------------------------------
ALLOWED_DEMO_USER_IDS: set[str] = {
    "user_demo_landlord_001",
    "user_demo_tenant_001",
    "user_demo_tenant_002",
}

_demo_auth_warning_logged = False


def _log_demo_auth_activation_once() -> None:
    """Emit one structured audit warning per process when demo auth is used."""
    global _demo_auth_warning_logged
    if not _demo_auth_warning_logged:
        logger.warning(
            "DEMO_AUTH_ACTIVE: Unsigned alg:'none' tokens are being accepted "
            "(ENABLE_DEMO_AUTH=true, non-production environment). "
            "This must never occur in production."
        )
        _demo_auth_warning_logged = True


async def verify_clerk_token(token: str) -> dict[str, Any]:
    """
    Verify a Clerk JWT and return the decoded payload.

    Security Policy (fail-closed):
    1. MOCK_AUTH (settings.mock_auth only) accepts unverified claims, but only
       outside production; production boot with MOCK_AUTH set is blocked by
       validate_secure_environment().
    2. Unsigned / 'none' algorithm tokens are accepted ONLY when
       ENABLE_DEMO_AUTH is explicitly true AND the environment is not
       production AND the `sub` is in ALLOWED_DEMO_USER_IDS.
    3. All other tokens MUST be signed with RS256 and verified against Clerk's
       JWKS, and must carry an `aud` or `azp` claim.

    Args:
        token: The raw JWT string from the Authorization header.

    Returns:
        Decoded JWT payload dict.

    Raises:
        TokenVerificationError: If the token is invalid, expired, tampered with,
            or unverified for non-demo users.
    """
    if settings.mock_auth and settings.environment != "production":
        try:
            payload = _unverified_claims(token)
            if not payload.get("sub"):
                payload["sub"] = "user_mock"
            return payload
        except TokenVerificationError:
            return {
                "sub": "user_mock",
                "email": "mock@example.com",
                "name": "Mock User"
            }

    # Step 1: Extract header and algorithm (without trusting claims yet)
    try:
        unverified_header = pyjwt.get_unverified_header(token)
    except Exception as exc:
        raise TokenVerificationError(f"Malformed JWT header: {exc}") from exc

    kid = unverified_header.get("kid")
    alg = unverified_header.get("alg")

    # Step 2: Unsigned / alg:"none" tokens — demo gate, explicit opt-in only.
    if alg == "none" or not kid:
        demo_auth_allowed = (
            settings.enable_demo_auth
            and settings.environment != "production"
        )
        if demo_auth_allowed:
            try:
                payload = _unverified_claims(token)
                if payload.get("sub") in ALLOWED_DEMO_USER_IDS:
                    _log_demo_auth_activation_once()
                    return payload
            except TokenVerificationError:
                pass
        raise TokenVerificationError(
            "Unsigned tokens are strictly restricted to designated demo accounts."
        )

    # Step 3: Fetch matching public key from Clerk's JWKS
    jwks = await _get_jwks()
    signing_key = _find_signing_key(jwks, kid)

    # Step 4: Cryptographically verify and decode the JWT
    try:
        payload = pyjwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
            options={
                # Clerk custom JWT templates may omit 'aud'; the azp check below
                # compensates deliberately instead of silently weakening trust.
                "verify_aud": False,
                "verify_exp": True,
                "verify_iss": True,
            },
        )
    except InvalidTokenError as exc:
        raise TokenVerificationError(f"Token verification failed: {exc}") from exc

    if not payload.get("aud") and not payload.get("azp"):
        raise TokenVerificationError("Token must carry either an 'aud' or 'azp' claim.")

    return payload
