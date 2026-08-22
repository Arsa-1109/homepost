"""
Rate Limiting — SlowAPI configuration

Keying strategy (audit finding H5):
  1. Authenticated requests are keyed by user id (stamped onto request.state
     by the auth dependency), so NAT'd clients behind one IP still get
     independent buckets.
  2. Unauthenticated requests fall back to X-Forwarded-For's first hop —
     uvicorn runs with --proxy-headers so request.client.host already
     reflects the trusted LB header; we read it defensively as well.
  3. Final fallback is the socket remote address.
"""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_user_or_ip(request: Request) -> str:
    """Proxy-aware, identity-aware rate-limit bucket key."""
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"

    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        first_hop = forwarded_for.split(",")[0].strip()
        if first_hop:
            return f"ip:{first_hop}"

    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=get_user_or_ip)
