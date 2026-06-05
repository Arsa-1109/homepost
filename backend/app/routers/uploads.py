from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.storage import generate_object_key, generate_presigned_upload_url, generate_presigned_download_url
from pydantic import BaseModel

router = APIRouter(prefix="/uploads", tags=["Uploads"])

class UploadURLResponse(BaseModel):
    upload_url: str
    file_key: str

class DownloadURLResponse(BaseModel):
    download_url: str

@router.get("/presigned-url", response_model=UploadURLResponse)
async def get_presigned_upload_url(
    filename: str = Query(..., description="Original name of the file to upload"),
    content_type: str = Query(..., description="MIME type of the file"),
    prefix: str = Query("maintenance", description="Folder prefix (e.g., 'maintenance' or 'documents')"),
    user: User = Depends(get_current_user)
):
    """
    Generate a presigned PUT URL for client-side direct upload to R2.
    """
    if prefix not in ["maintenance", "documents"]:
        raise HTTPException(status_code=400, detail="Invalid prefix.")
        
    object_key = generate_object_key(prefix, filename)
    
    # 1 hour expiration
    url = generate_presigned_upload_url(object_key, content_type, expires=3600)
    
    return UploadURLResponse(upload_url=url, file_key=object_key)


@router.get("/download-url", response_model=DownloadURLResponse)
async def get_presigned_download_url(
    file_key: str = Query(..., description="The R2 object key to download"),
    download: bool = Query(False, description="Whether to trigger download response headers"),
    user: User = Depends(get_current_user)
):
    """
    Generate a presigned GET URL to view or download a file from R2.
    """
    if not file_key.startswith("maintenance/") and not file_key.startswith("documents/"):
        raise HTTPException(status_code=400, detail="Invalid file key.")
        
    filename = file_key.split("/")[-1] if download else None
    
    # 1 hour expiration
    url = generate_presigned_download_url(file_key, expires=3600, filename=filename)
    
    return DownloadURLResponse(download_url=url)
