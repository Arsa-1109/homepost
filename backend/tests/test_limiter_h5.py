"""
H5 — Rate-limit proxy-blind keying + missing proxy headers.

Reproduction tests written BEFORE the fix (TDD RED):
- Limiter keying must prefer the authenticated user id (request.state.user_id),
  then X-Forwarded-For (first hop), then the remote address.
- Two different forwarded IPs must produce independent buckets.
- The deployment launch line must enable uvicorn's trusted-proxy header
  handling so request.client.host reflects X-Forwarded-For.
"""

from pathlib import Path

from fastapi import Request

from app.core.limiter import get_user_or_ip, limiter


def _fake_request(headers: dict | None = None, client_ip: str = "10.0.0.9", user_id: str | None = None) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "query_string": b"",
        "headers": [
            (k.lower().encode(), v.encode()) for k, v in (headers or {}).items()
        ],
        "client": (client_ip, 12345),
    }
    req = Request(scope)
    if user_id is not None:
        req.state.user_id = user_id
    return req


def test_authenticated_user_id_takes_priority_over_forwarded_ip():
    req = _fake_request(
        headers={"X-Forwarded-For": "203.0.113.7"}, user_id="user-abc"
    )
    assert get_user_or_ip(req) == "user:user-abc"


def test_forwarded_for_used_when_unauthenticated():
    req = _fake_request(headers={"X-Forwarded-For": "203.0.113.7, 70.41.3.18"})
    assert get_user_or_ip(req) == "ip:203.0.113.7"


def test_falls_back_to_remote_address_without_headers():
    req = _fake_request(client_ip="198.51.100.4")
    assert get_user_or_ip(req) == "ip:198.51.100.4"


def test_distinct_forwarded_ips_get_distinct_buckets():
    """Pre-fix every caller behind the LB shared one bucket (LB host)."""
    key_a = get_user_or_ip(_fake_request(headers={"X-Forwarded-For": "203.0.113.7"}))
    key_b = get_user_or_ip(_fake_request(headers={"X-Forwarded-For": "203.0.113.8"}))
    assert key_a != key_b


def test_limiter_is_configured_with_proxy_aware_key_func():
    assert limiter._key_func is get_user_or_ip


def test_dockerfile_launches_uvicorn_with_proxy_headers():
    dockerfile = Path(__file__).resolve().parent.parent / "Dockerfile"
    content = dockerfile.read_text(encoding="utf-8")
    assert "--proxy-headers" in content, (
        "uvicorn must be launched with --proxy-headers so rate limiting "
        "keys on the real client IP behind Railway's LB"
    )
    assert "--forwarded-allow-ips" in content


def test_auth_dependency_records_user_id_on_request_state():
    import inspect
    from app.dependencies import auth

    source = inspect.getsource(auth.get_current_user)
    assert "state.user_id" in source, (
        "get_current_user must stamp request.state.user_id for limiter keying"
    )
