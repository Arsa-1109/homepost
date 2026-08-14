import pytest
from httpx import AsyncClient
from app.main import app
from app.dependencies.auth import get_current_user


async def test_direct_upload_success(client: AsyncClient, seed_data, mock_storage):
    """POST /uploads/ successfully accepts file and returns generated object key."""
    user = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        files = {"file": ("receipt.png", b"fake image bytes content", "image/png")}
        data = {"prefix": "maintenance"}
        response = await client.post("/api/v1/uploads/", data=data, files=files)
        assert response.status_code == 200
        result = response.json()
        assert "file_key" in result
        assert result["file_key"].startswith("maintenance/")
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_direct_upload_file_too_large(client: AsyncClient, seed_data, monkeypatch):
    """POST /uploads/ returns 413 when uploaded payload exceeds size limit."""
    from app.core import config

    user = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: user

    # Temporarily set max_upload_size_bytes to 5 bytes
    settings = config.get_settings()
    monkeypatch.setattr(settings, "max_upload_size_bytes", 5)

    try:
        files = {"file": ("large_file.png", b"more than 5 bytes of data", "image/png")}
        response = await client.post("/api/v1/uploads/", files=files)
        assert response.status_code == 413
        assert "File too large" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_presigned_download_url(client: AsyncClient, seed_data, db_session, mock_storage):
    """GET /uploads/download-url generates valid presigned URL for authorized files and rejects unauthorized files."""
    import uuid
    from app.models.document import Document
    from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority

    landlord = seed_data["landlord"]
    prop = seed_data["property"]
    unit = seed_data["unit"]
    profile = seed_data["profile"]

    # Seed a document belonging to landlord's property
    doc = Document(
        id=uuid.uuid4(),
        property_id=prop.id,
        uploaded_by=landlord.id,
        title="House Rules",
        file_key="documents/prop1/rules.pdf",
        file_type="application/pdf",
    )
    db_session.add(doc)

    # Seed a maintenance request with image key
    req = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=profile.id,
        unit_id=unit.id,
        title="Broken Window",
        description="Window cracked in bedroom.",
        priority=RequestPriority.MEDIUM,
        status=RequestStatus.OPEN,
        image_keys=["maintenance/abc/test.jpg"],
    )
    db_session.add(req)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: landlord

    try:
        # Valid authorized document key
        res_doc = await client.get("/api/v1/uploads/download-url?file_key=documents/prop1/rules.pdf")
        assert res_doc.status_code == 200
        assert "download_url" in res_doc.json()
        assert res_doc.json()["download_url"].startswith("http")

        # Valid authorized maintenance key
        res_maint = await client.get("/api/v1/uploads/download-url?file_key=maintenance/abc/test.jpg")
        assert res_maint.status_code == 200
        assert "download_url" in res_maint.json()

        # Unauthorized key (not in DB)
        unauth_res = await client.get("/api/v1/uploads/download-url?file_key=documents/other/secret.pdf")
        assert unauth_res.status_code == 403
        assert "permission" in unauth_res.json()["detail"]

        # Invalid key path
        invalid_res = await client.get("/api/v1/uploads/download-url?file_key=system/secret.env")
        assert invalid_res.status_code == 400
        assert "Invalid file key" in invalid_res.json()["detail"]

        # Traversal attempt
        traversal_res = await client.get("/api/v1/uploads/download-url?file_key=maintenance/../etc/passwd")
        assert traversal_res.status_code == 400
    finally:
        app.dependency_overrides.pop(get_current_user, None)


async def test_direct_upload_document_prefix(client: AsyncClient, seed_data, mock_storage):
    """POST /uploads/ with prefix='documents' generates document file_key."""
    user = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        files = {"file": ("lease.pdf", b"%PDF-1.4 fake pdf content", "application/pdf")}
        data = {"prefix": "documents"}
        response = await client.post("/api/v1/uploads/", data=data, files=files)
        assert response.status_code == 200
        result = response.json()
        assert "file_key" in result
        assert result["file_key"].startswith("documents/")
    finally:
        app.dependency_overrides.pop(get_current_user, None)
