from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.storage import generate_object_key, upload_file_to_r2, generate_presigned_download_url
from pydantic import BaseModel
from app.core.limiter import limiter
from app.core.config import get_settings
import io
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/uploads", tags=["Uploads"])

class DirectUploadResponse(BaseModel):
    file_key: str

class DownloadURLResponse(BaseModel):
    download_url: str

@router.post("/", response_model=DirectUploadResponse)
@limiter.limit("10/minute")
async def upload_file_direct(
    request: Request,
    prefix: str = Form("maintenance", description="Folder prefix (e.g., 'maintenance' or 'documents')"),
    file: UploadFile = File(..., description="The file to upload"),
    user: User = Depends(get_current_user)
):
    settings = get_settings()

    # In mock mode, return a mock key without touching R2
    if settings.is_r2_mock:
        mock_key = generate_object_key(f"mock/{prefix}", file.filename)
        logger.warning("[MOCK R2] Returning mock file_key '%s' (dummy credentials)", mock_key)
        return DirectUploadResponse(file_key=mock_key)

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail="File too large (exceeds 10MB limit).")

    object_key = generate_object_key(prefix, file.filename)

    # Upload to R2 synchronously
    upload_file_to_r2(io.BytesIO(file_bytes), object_key, file.content_type)

    return DirectUploadResponse(file_key=object_key)


@router.get("/download-url", response_model=DownloadURLResponse)
@limiter.limit("30/minute")
async def get_presigned_download_url(
    request: Request,
    file_key: str = Query(..., description="The R2 object key to download"),
    download: bool = Query(False, description="Whether to trigger download response headers"),
    user: User = Depends(get_current_user)
):
    """
    Generate a presigned GET URL to view or download a file from R2.
    """
    if (
        not file_key.startswith("maintenance/")
        and not file_key.startswith("documents/")
        and not file_key.startswith("mock/")
    ):
        raise HTTPException(status_code=400, detail="Invalid file key.")
        
    filename = file_key.split("/")[-1] if download else None
    
    # 1 hour expiration
    url = generate_presigned_download_url(file_key, expires=3600, filename=filename)
    
    return DownloadURLResponse(download_url=url)
