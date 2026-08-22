"""
Shared JWT test utilities.

Generates an RS256 keypair locally and presents its public half as a
synthetic JWKS so token-verification tests run without network access.
"""

import base64
import json
import time

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import generate_private_key
from jwt.api_jwt import PyJWT


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def make_rsa_jwks() -> tuple:
    """Return (private_pem, jwks_dict) for a freshly generated RSA key."""
    private_key = generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_numbers = private_key.public_key().public_numbers()
    modulus_bytes = public_numbers.n.to_bytes(
        (public_numbers.n.bit_length() + 7) // 8, "big"
    )
    exponent_bytes = public_numbers.e.to_bytes(
        (public_numbers.e.bit_length() + 7) // 8, "big"
    )
    jwks = {
        "keys": [
            {
                "kid": "test-key-1",
                "kty": "RSA",
                "alg": "RS256",
                "use": "sig",
                "n": b64url(modulus_bytes),
                "e": b64url(exponent_bytes),
            }
        ]
    }
    return private_pem, jwks


def sign_rs256(private_pem: bytes, payload: dict, kid: str = "test-key-1") -> str:
    return PyJWT().encode(payload, private_pem, algorithm="RS256", headers={"kid": kid})


def clerk_claims(**overrides) -> dict:
    now = int(time.time())
    claims = {
        "sub": "user_clerk_real_123",
        "email": "real.user@example.com",
        "name": "Real User",
        "iss": "https://clerk.example.dev",
        "iat": now - 10,
        "exp": now + 600,
        "aud": "homepost-api",
    }
    claims.update(overrides)
    return claims


def make_alg_none_token(sub: str, email: str = "demo@homepost.demo") -> str:
    header = b64url(json.dumps({"alg": "none", "typ": "JWT"}).encode())
    payload = b64url(json.dumps({"sub": sub, "email": email}).encode())
    return f"{header}.{payload}."
