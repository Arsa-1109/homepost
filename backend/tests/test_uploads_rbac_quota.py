"""
H2 — Uploads endpoint open to all roles with no quota.

Reproduction tests written BEFORE the fix (TDD RED):

RBAC matrix (enforced in-handler):
  - documents / announcements prefixes → LANDLORD only
  - maintenance prefix → active TENANT or LANDLORD
  - everyone else (UNASSIGNED, TENANT_PENDING, inactive tenants) → 403

Per-user daily quota:
  - MAX_UPLOADS_PER_USER_PER_DAY exceeded → 429 with Retry-After
  - only the current UTC day's count matters (resets daily)
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient

from app.main import app
from app.core.config import get_settings
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole


PNG_FILE = {"file": ("receipt.png", b"\x89PNG\r\n\x1a\nfake image bytes content", "image/png")}


def _override_current_user(user: User):
    app.dependency_overrides[get_current_user] = lambda: user


def _clear_override():
    app.dependency_overrides.pop(get_current_user, None)


async def _make_user(
    db_session,
    role: UserRole,
    *,
    clerk_id_suffix: str = "",
    email: str | None = None,
    unit_id=None,
    is_active=True,
):
    user = User(
        id=uuid.uuid4(),
        clerk_id=f"clerk_{role.value}_{uuid.uuid4().hex[:8]}_{clerk_id_suffix}",
        email=email or f"{role.value}_{uuid.uuid4().hex[:8]}@homepost.dev",
        full_name=f"Test {role.value}",
        role=role,
    )
    db_session.add(user)

    if role == UserRole.TENANT:
        from app.models.tenant_profile import TenantProfile

        profile = TenantProfile(
            id=uuid.uuid4(),
            user_id=user.id,
            unit_id=unit_id,
            is_active=is_active,
        )
        db_session.add(profile)

    await db_session.commit()
    return user


# ---------------------------------------------------------------------------
# RBAC
# ---------------------------------------------------------------------------

async def test_unassigned_rejected_for_every_prefix(client: AsyncClient, seed_data, mock_storage, db_session):
    user = await _make_user(db_session, UserRole.UNASSIGNED)
    _override_current_user(user)
    try:
        for prefix in ["maintenance", "documents", "announcements"]:
            resp = await client.post("/api/v1/uploads/", data={"prefix": prefix}, files=dict(PNG_FILE))
            assert resp.status_code == 403, f"{prefix} should be forbidden for UNASSIGNED"
    finally:
        _clear_override()


async def test_tenant_pending_rejected_for_every_prefix(client: AsyncClient, seed_data, mock_storage, db_session):
    user = await _make_user(db_session, UserRole.TENANT_PENDING)
    _override_current_user(user)
    try:
        for prefix in ["maintenance", "documents", "announcements"]:
            resp = await client.post("/api/v1/uploads/", data={"prefix": prefix}, files=dict(PNG_FILE))
            assert resp.status_code == 403, f"{prefix} should be forbidden for TENANT_PENDING"
    finally:
        _clear_override()


async def test_active_tenant_can_upload_maintenance(client: AsyncClient, seed_data, mock_storage):
    user = seed_data["tenant"]
    _override_current_user(user)
    try:
        resp = await client.post("/api/v1/uploads/", data={"prefix": "maintenance"}, files=dict(PNG_FILE))
        assert resp.status_code == 200
        assert resp.json()["file_key"].startswith("maintenance/")
    finally:
        _clear_override()


async def test_tenant_forbidden_on_documents_and_announcements(client: AsyncClient, seed_data, mock_storage):
    user = seed_data["tenant"]
    _override_current_user(user)
    try:
        for prefix in ["documents", "announcements"]:
            resp = await client.post("/api/v1/uploads/", data={"prefix": prefix}, files=dict(PNG_FILE))
            assert resp.status_code == 403, f"{prefix} must be LANDLORD-only"
    finally:
        _clear_override()


async def test_landlord_allowed_on_all_three_prefixes(client: AsyncClient, seed_data, mock_storage):
    user = seed_data["landlord"]
    _override_current_user(user)
    try:
        for prefix in ["documents", "announcements", "maintenance"]:
            resp = await client.post("/api/v1/uploads/", data={"prefix": prefix}, files=dict(PNG_FILE))
            assert resp.status_code == 200, f"landlord should be allowed on {prefix}"
            assert resp.json()["file_key"].startswith(prefix + "/")
    finally:
        _clear_override()


async def test_inactive_tenant_rejected_on_maintenance(client: AsyncClient, seed_data, mock_storage, db_session):
    unit = seed_data["unit"]
    user = await _make_user(db_session, UserRole.TENANT, unit_id=unit.id, is_active=False)
    _override_current_user(user)
    try:
        resp = await client.post("/api/v1/uploads/", data={"prefix": "maintenance"}, files=dict(PNG_FILE))
        assert resp.status_code == 403, "inactive tenants must be rejected"
    finally:
        _clear_override()


# ---------------------------------------------------------------------------
# Per-user daily quota
# ---------------------------------------------------------------------------

async def test_quota_exhaustion_returns_429_with_retry_after(
    client: AsyncClient, seed_data, mock_storage, monkeypatch
):
    settings = get_settings()
    monkeypatch.setattr(settings, "max_uploads_per_user_per_day", 2)

    user = seed_data["landlord"]
    _override_current_user(user)
    try:
        ok1 = await client.post("/api/v1/uploads/", data={"prefix": "documents"}, files=dict(PNG_FILE))
        ok2 = await client.post("/api/v1/uploads/", data={"prefix": "documents"}, files=dict(PNG_FILE))
        assert ok1.status_code == 200
        assert ok2.status_code == 200

        exhausted = await client.post("/api/v1/uploads/", data={"prefix": "documents"}, files=dict(PNG_FILE))
        assert exhausted.status_code == 429
        assert "retry-after" in {k.lower() for k in exhausted.headers}
    finally:
        _clear_override()


async def test_quota_is_per_user(client: AsyncClient, seed_data, mock_storage, db_session, monkeypatch):
    """Exhausting one user's quota must not affect another user's allowance."""
    settings = get_settings()
    monkeypatch.setattr(settings, "max_uploads_per_user_per_day", 1)

    landlord_a = seed_data["landlord"]
    landlord_b = await _make_user(db_session, UserRole.LANDLORD)

    # Landlord A burns their quota.
    _override_current_user(landlord_a)
    try:
        first = await client.post("/api/v1/uploads/", data={"prefix": "documents"}, files=dict(PNG_FILE))
        blocked = await client.post("/api/v1/uploads/", data={"prefix": "documents"}, files=dict(PNG_FILE))
        assert first.status_code == 200
        assert blocked.status_code == 429
    finally:
        _clear_override()

    # Landlord B still has their own fresh bucket.
    _override_current_user(landlord_b)
    try:
        other = await client.post("/api/v1/uploads/", data={"prefix": "documents"}, files=dict(PNG_FILE))
        assert other.status_code == 200
    finally:
        _clear_override()


async def test_quota_only_counts_today_utc(client: AsyncClient, seed_data, mock_storage, db_session, monkeypatch):
    """A stale row from yesterday must not consume today's allowance."""
    from sqlmodel import text

    settings = get_settings()
    monkeypatch.setattr(settings, "max_uploads_per_user_per_day", 1)

    user = seed_data["landlord"]
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    # Seed yesterday's exhausted counter directly (raw SQL: table created by metadata).
    await db_session.execute(
        text(
            "INSERT INTO upload_quota (user_id, day_utc, count) VALUES (:uid, :day, :cnt)"
        ),
        params={"uid": str(user.id), "day": yesterday, "cnt": 999},
    )
    await db_session.commit()

    _override_current_user(user)
    try:
        resp = await client.post("/api/v1/uploads/", data={"prefix": "documents"}, files=dict(PNG_FILE))
        assert resp.status_code == 200, "yesterday's usage must not block today's uploads"
    finally:
        _clear_override()
