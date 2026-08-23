"""
H4 — Server-side pagination on all list endpoints.

Every landlord/tenant list endpoint must accept shared PaginationParams
(limit ≤ 200, offset ≥ 0) and return the envelope
{ items, total, limit, offset }. These fail pre-fix (endpoints returned bare
arrays and ignored pagination params).
"""

import uuid

import pytest
from httpx import AsyncClient

PAGE_ENVELOPE_KEYS = {"items", "total", "limit", "offset"}


# ---------------------------------------------------------------------------
# Unit-level: the shared dependency itself
# ---------------------------------------------------------------------------

def test_pagination_params_defaults():
    from app.core.pagination import PaginationParams
    p = PaginationParams()
    assert p.limit == 50 and p.offset == 0


def test_pagination_params_caps_limit():
    """limit=10000 must clamp to the 200 maximum (DoS guard)."""
    from app.core.pagination import MAX_LIMIT, PaginationParams
    p = PaginationParams(limit=MAX_LIMIT + 1)
    assert p.limit == MAX_LIMIT


def test_pagination_params_rejects_negative_offset():
    from pydantic import ValidationError
    from app.core.pagination import PaginationParams
    with pytest.raises(ValidationError):
        PaginationParams(offset=-5)


def test_page_envelope_shape():
    from app.core.pagination import Page
    page = Page[int](items=[1, 2], total=10, limit=2, offset=4)
    dumped = page.model_dump()
    assert set(dumped) == PAGE_ENVELOPE_KEYS
    assert dumped["total"] == 10 and dumped["items"] == [1, 2]


# ---------------------------------------------------------------------------
# Integration: seeded dataset > default page size per resource
# ---------------------------------------------------------------------------

async def _seed_documents(db_session, prop_id, uploader_id, count):
    from app.models.document import Document
    for i in range(count):
        db_session.add(Document(
            id=uuid.uuid4(),
            property_id=prop_id,
            uploaded_by=uploader_id,
            title=f"Doc {i}",
            file_key=f"documents/{prop_id}/{i}.pdf",
            file_type="application/pdf",
        ))
    await db_session.commit()


async def test_landlord_property_documents_paginated(
    client: AsyncClient, seed_data, db_session, mock_storage,
):
    from app.dependencies.auth import get_current_user
    from app.main import app

    doc_count = 120  # > default limit of 50
    await _seed_documents(db_session, seed_data["property"].id,
                          seed_data["landlord"].id, doc_count)
    pid = str(seed_data["property"].id)

    app.dependency_overrides[get_current_user] = lambda: seed_data["landlord"]
    try:
        r = await client.get(f"/api/v1/landlord/properties/{pid}/documents")
    finally:
        app.dependency_overrides.pop(get_current_user, None)
    assert r.status_code == 200
    body = r.json()
    assert set(body) == PAGE_ENVELOPE_KEYS, (
        "list endpoint must return the pagination envelope"
    )
    assert body["total"] == doc_count
    assert len(body["items"]) == 50          # default page size
    assert body["limit"] == 50 and body["offset"] == 0

    # Second window is stable
    app.dependency_overrides[get_current_user] = lambda: seed_data["landlord"]
    try:
        r2 = await client.get(f"/api/v1/landlord/properties/{pid}/documents?limit=50&offset=50")
    finally:
        app.dependency_overrides.pop(get_current_user, None)
    assert r2.status_code == 200, r2.text
    b2 = r2.json()
    assert len(b2["items"]) == 50 and b2["total"] == doc_count
    first_ids = {d["id"] for d in body["items"]}
    second_ids = {d["id"] for d in b2["items"]}
    assert not (first_ids & second_ids), "offset windows must not overlap"


async def test_document_pagination_ownership_scoping_preserved(
    client: AsyncClient, seed_data, db_session,
):
    """Another landlord's property stays 403 even with valid paging params."""
    from app.models.user import User
    other = User(id=uuid.uuid4(), clerk_id="clerk_other", email="other@homepost.dev",
                 full_name="Other", role="landlord")
    db_session.add(other)
    await db_session.commit()

    # Override auth to the other landlord for this request
    from app.main import app
    from app.dependencies.auth import get_current_user

    async def _other():
        return other

    app.dependency_overrides[get_current_user] = _other
    try:
        r = await client.get(
            f"/api/v1/landlord/properties/{seed_data['property'].id}/documents?limit=10"
        )
        assert r.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_tenant_maintenance_requests_paginated(
    client: AsyncClient, seed_data, db_session,
):
    from app.models.maintenance_request import MaintenanceRequest
    from app.dependencies.auth import get_current_user
    from app.main import app

    for i in range(75):
        db_session.add(MaintenanceRequest(
            id=uuid.uuid4(), tenant_id=seed_data["profile"].id,
            unit_id=seed_data["unit"].id, title=f"Req {i}",
            description="d", status="open", priority="medium",
        ))
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: seed_data["tenant"]
    try:
        r = await client.get("/api/v1/tenant/maintenance?limit=25&offset=25")
    finally:
        app.dependency_overrides.pop(get_current_user, None)
    assert r.status_code == 200
    body = r.json()
    assert set(body) == PAGE_ENVELOPE_KEYS
    assert body["total"] == 75
    assert len(body["items"]) == 25
    assert body["limit"] == 25 and body["offset"] == 25


async def test_limit_cap_enforced_on_endpoint(client: AsyncClient, seed_data, db_session):
    """A client-supplied huge limit is clamped server-side."""
    await _seed_documents(db_session, seed_data["property"].id,
                          seed_data["landlord"].id, 3)
    from app.dependencies.auth import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: seed_data["landlord"]
    try:
        r = await client.get(
            f"/api/v1/landlord/properties/{seed_data['property'].id}/documents?limit=10000"
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)
    assert r.status_code in (200, 422)   # either clamped or rejected by validation
    if r.status_code == 200:
        assert r.json()["limit"] <= 200
