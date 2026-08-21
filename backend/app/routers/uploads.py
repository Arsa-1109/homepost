from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form
from app.dependencies.auth import get_current_user, guard_demo_mutation
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.document import Document
from app.models.maintenance_request import MaintenanceRequest
from app.models.announcement import Announcement
from app.core.database import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import String
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
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-m4v",
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
    ".mp4",
    ".mov",
    ".webm",
    ".m4v",
}

router = APIRouter(prefix="/uploads", tags=["Uploads"])

class DirectUploadResponse(BaseModel):
    file_key: str

class DownloadURLResponse(BaseModel):
    download_url: str


# Magic byte signatures for file type validation
_MAGIC_SIGNATURES: dict[str, list[tuple[bytes, int, str]]] = {
    ".jpg":  [(b"\xff\xd8\xff", 3, "Invalid JPEG image")],
    ".jpeg": [(b"\xff\xd8\xff", 3, "Invalid JPEG image")],
    ".png":  [(b"\x89PNG", 4, "Invalid PNG image")],
    ".pdf":  [(b"%PDF", 4, "Invalid PDF document")],
    ".docx": [(b"PK\x03\x04", 4, "Invalid DOCX document")],
    ".doc":  [(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1", 8, "Invalid DOC document")],
    ".webm": [(b"\x1a\x45\xdf\xa3", 4, "Invalid WEBM video")],
}


def validate_file_magic_bytes(file_bytes: bytes, ext: str) -> None:
    """
    Validate binary file headers against expected magic byte signatures.
    Rejects spoofed extensions / polyglot payloads with HTTP 400.
    """
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Simple prefix-match types
    if ext in _MAGIC_SIGNATURES:
        for magic, min_len, error_msg in _MAGIC_SIGNATURES[ext]:
            if len(file_bytes) < min_len or not file_bytes.startswith(magic):
                raise HTTPException(status_code=400, detail=f"{error_msg} content or corrupted file.")
        return

    # WEBP: RIFF....WEBP (requires offset check)
    if ext == ".webp":
        if len(file_bytes) < 12 or not (file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP"):
            raise HTTPException(status_code=400, detail="Invalid WEBP image content or corrupted file.")

    # HEIC / HEIF: ftypheic / ftypmif1 / ftypmsf1 / ftyphevc
    elif ext in [".heic", ".heif"]:
        if len(file_bytes) < 12 or b"ftyp" not in file_bytes[4:12]:
            raise HTTPException(status_code=400, detail="Invalid HEIC/HEIF image content or corrupted file.")

    # MP4 / MOV / M4V: ISO Base Media File Format (ftyp, moov, mdat, wide)
    elif ext in [".mp4", ".mov", ".m4v"]:
        if len(file_bytes) < 8:
            raise HTTPException(status_code=400, detail="Invalid video content or file too small.")
        box_type = file_bytes[4:8]
        if box_type not in [b"ftyp", b"moov", b"mdat", b"wide"] and b"ftyp" not in file_bytes[:32]:
            raise HTTPException(status_code=400, detail="Invalid MP4/MOV video content or corrupted file.")


@router.post("/", response_model=DirectUploadResponse)
@limiter.limit("10/minute")
async def upload_file_direct(
    request: Request,
    prefix: str = Form("maintenance", description="Folder prefix (e.g., 'maintenance', 'documents', or 'announcements')"),
    file: UploadFile = File(..., description="The file to upload"),
    user: User = Depends(get_current_user)
):
    guard_demo_mutation(user, "upload files directly")

    settings = get_settings()
    
    if prefix not in ["maintenance", "documents", "announcements"]:
        raise HTTPException(status_code=400, detail="Invalid upload prefix.")

    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    content_type = (file.content_type or "").lower()

    if ext not in ALLOWED_EXTENSIONS or content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type ({ext or 'unknown'}). Allowed formats: Images (JPEG, PNG, WEBP, HEIC), Documents (PDF, DOC, DOCX), Videos (MP4, MOV, WEBM)."
        )
    
    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail="File too large (exceeds 10MB limit).")

    # Security validation: Validate binary magic bytes
    validate_file_magic_bytes(file_bytes, ext)
        
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
            from sqlalchemy import or_, literal
            from sqlalchemy.sql import func
            maint_res = await session.execute(
                select(MaintenanceRequest.id)
                .join(Unit, MaintenanceRequest.unit_id == Unit.id)
                .join(Property, Unit.property_id == Property.id)
                .where(
                    Property.owner_id == user.id,
                    or_(
                        func.cast(MaintenanceRequest.image_keys, String).contains(file_key),
                        func.cast(MaintenanceRequest.landlord_image_keys, String).contains(file_key),
                    )
                )
                .limit(1)
            )
            authorized = maint_res.scalars().first() is not None
        elif file_key.startswith("announcements/"):
            from sqlalchemy import or_
            from sqlalchemy.sql import func
            ann_res = await session.execute(
                select(Announcement.id)
                .join(Property, Announcement.property_id == Property.id)
                .where(
                    Property.owner_id == user.id,
                    func.cast(Announcement.attachment_keys, String).contains(file_key),
                )
                .limit(1)
            )
            authorized = ann_res.scalars().first() is not None
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
                    from sqlalchemy import or_
                    from sqlalchemy.sql import func
                    maint_res = await session.execute(
                        select(MaintenanceRequest.id)
                        .where(
                            MaintenanceRequest.tenant_id == profile.id,
                            or_(
                                func.cast(MaintenanceRequest.image_keys, String).contains(file_key),
                                func.cast(MaintenanceRequest.landlord_image_keys, String).contains(file_key),
                            )
                        )
                        .limit(1)
                    )
                    authorized = maint_res.scalars().first() is not None
                elif file_key.startswith("announcements/"):
                    from sqlalchemy.sql import func
                    ann_res = await session.execute(
                        select(Announcement.id)
                        .where(
                            Announcement.property_id == unit.property_id,
                            (Announcement.unit_id == None) | (Announcement.unit_id == profile.unit_id),
                            func.cast(Announcement.attachment_keys, String).contains(file_key),
                        )
                        .limit(1)
                    )
                    authorized = ann_res.scalars().first() is not None

    if not authorized:
        raise HTTPException(status_code=403, detail="You do not have permission to access this file.")

    filename = file_key.split("/")[-1] if download else None
    url = generate_presigned_download_url(file_key, expires=900, filename=filename)
    return DownloadURLResponse(download_url=url)
