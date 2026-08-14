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


async def test_presigned_download_url(client: AsyncClient, seed_data, mock_storage):
    """GET /uploads/download-url generates valid presigned URL for maintenance or documents."""
    user = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        # Valid key
        res = await client.get("/api/v1/uploads/download-url?file_key=maintenance/abc/test.jpg")
        assert res.status_code == 200
        assert "download_url" in res.json()
        assert res.json()["download_url"].startswith("http")

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
