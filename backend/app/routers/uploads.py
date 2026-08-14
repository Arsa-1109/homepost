from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.document import Document
from app.models.maintenance_request import MaintenanceRequest
from app.models.announcement import Announcement
from app.core.database import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.services.storage import generate_object_key, upload_file_to_r2, generate_presigned_download_url
from pydantic import BaseModel
from app.core.limiter import limiter
from app.core.config import get_settings
import io

import os

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".heic",
    ".heif",
    ".pdf",
    ".doc",
    ".docx",
}

router = APIRouter(prefix="/uploads", tags=["Uploads"])

class DirectUploadResponse(BaseModel):
    file_key: str

class DownloadURLResponse(BaseModel):
    download_url: str

@router.post("/", response_model=DirectUploadResponse)
@limiter.limit("10/minute")
async def upload_file_direct(
    request: Request,
    prefix: str = Form("maintenance", description="Folder prefix (e.g., 'maintenance', 'documents', or 'announcements')"),
    file: UploadFile = File(..., description="The file to upload"),
    user: User = Depends(get_current_user)
):
    settings = get_settings()
    
    if prefix not in ["maintenance", "documents", "announcements"]:
        raise HTTPException(status_code=400, detail="Invalid upload prefix.")

    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    content_type = (file.content_type or "").lower()

    if ext not in ALLOWED_EXTENSIONS or content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed formats: JPEG, PNG, WEBP, HEIC, PDF, DOC, DOCX."
        )
    
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
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Generate an authorized presigned GET URL to view or download a file from R2.
    """
    if ".." in file_key or not any(file_key.startswith(p) for p in ["maintenance/", "documents/", "announcements/"]):
        raise HTTPException(status_code=400, detail="Invalid file key.")

    authorized = False

    if user.role == UserRole.LANDLORD:
        if file_key.startswith("documents/"):
            doc_res = await session.execute(
                select(Document)
                .join(Property, Document.property_id == Property.id)
                .where(Document.file_key == file_key, Property.owner_id == user.id)
            )
            authorized = doc_res.scalars().first() is not None
        elif file_key.startswith("maintenance/"):
            maint_res = await session.execute(
                select(MaintenanceRequest)
                .join(Unit, MaintenanceRequest.unit_id == Unit.id)
                .join(Property, Unit.property_id == Property.id)
                .where(Property.owner_id == user.id)
            )
            for req_obj in maint_res.scalars().all():
                if (req_obj.image_keys and file_key in req_obj.image_keys) or \
                   (req_obj.landlord_image_keys and file_key in req_obj.landlord_image_keys):
                    authorized = True
                    break
        elif file_key.startswith("announcements/"):
            ann_res = await session.execute(
                select(Announcement)
                .join(Property, Announcement.property_id == Property.id)
                .where(Property.owner_id == user.id)
            )
            for ann_obj in ann_res.scalars().all():
                if ann_obj.attachment_keys and file_key in ann_obj.attachment_keys:
                    authorized = True
                    break
    elif user.role == UserRole.TENANT:
        prof_res = await session.execute(
            select(TenantProfile).where(TenantProfile.user_id == user.id, TenantProfile.is_active == True)
        )
        profile = prof_res.scalars().first()
        if profile:
            unit = await session.get(Unit, profile.unit_id)
            if unit:
                if file_key.startswith("documents/"):
                    doc_res = await session.execute(
                        select(Document).where(
                            Document.file_key == file_key,
                            Document.property_id == unit.property_id,
                            (Document.unit_id == None) | (Document.unit_id == unit.id),
                        )
                    )
                    authorized = doc_res.scalars().first() is not None
                elif file_key.startswith("maintenance/"):
                    maint_res = await session.execute(
                        select(MaintenanceRequest).where(MaintenanceRequest.tenant_id == profile.id)
                    )
                    for req_obj in maint_res.scalars().all():
                        if (req_obj.image_keys and file_key in req_obj.image_keys) or \
                           (req_obj.landlord_image_keys and file_key in req_obj.landlord_image_keys):
                            authorized = True
                            break
                elif file_key.startswith("announcements/"):
                    ann_res = await session.execute(
                        select(Announcement).where(
                            Announcement.property_id == unit.property_id,
                            (Announcement.unit_id == None) | (Announcement.unit_id == profile.unit_id),
                        )
                    )
                    for ann_obj in ann_res.scalars().all():
                        if ann_obj.attachment_keys and file_key in ann_obj.attachment_keys:
                            authorized = True
                            break

    if not authorized:
        raise HTTPException(status_code=403, detail="You do not have permission to access this file.")

    filename = file_key.split("/")[-1] if download else None
    url = generate_presigned_download_url(file_key, expires=3600, filename=filename)
    return DownloadURLResponse(download_url=url)
