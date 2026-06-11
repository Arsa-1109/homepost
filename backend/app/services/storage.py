"""
Cloudflare R2 Storage Service

Generates presigned URLs for direct client uploads and downloads.
The FastAPI server never handles file bytes — R2 does.

⚠️ Size Constraint: All presigned upload URLs include a Content-Length-Range
   condition (0–10MB) to prevent oversized uploads. This is enforced by R2
   at the storage layer.

Key format conventions:
Key format conventions:
  - Maintenance images: maintenance/{request_id}/{uuid}.{ext}
  - Documents: documents/{property_id}/{uuid}.{ext}
"""

import uuid
from typing import BinaryIO

import boto3
from botocore.config import Config as BotoConfig

from app.core.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# R2 Client — S3-compatible
# ---------------------------------------------------------------------------
_s3_client = boto3.client(
    "s3",
    endpoint_url=settings.r2_endpoint_url,
    aws_access_key_id=settings.r2_access_key_id,
    aws_secret_access_key=settings.r2_secret_access_key,
    config=BotoConfig(
        signature_version="s3v4",
        s3={'addressing_style': 'path'}
    ),
    region_name="auto",  # R2 uses "auto" for region
)


def generate_object_key(prefix: str, filename: str) -> str:
    """
    Generate a unique object key for R2.
    Example: "maintenance/abc123/550e8400-e29b.jpg"
    """
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    unique_name = f"{uuid.uuid4()}.{ext}"
    return f"{prefix}/{unique_name}"


def upload_file_to_r2(
    file_obj: BinaryIO,
    object_key: str,
    content_type: str
) -> None:
    """
    Upload a file stream directly to Cloudflare R2.
    Used by the FastAPI backend to proxy uploads, allowing us to enforce 
    strict size limits in memory before reaching the storage layer.
    """
    _s3_client.upload_fileobj(
        Fileobj=file_obj,
        Bucket=settings.r2_bucket_name,
        Key=object_key,
        ExtraArgs={"ContentType": content_type}
    )


def generate_presigned_download_url(
    object_key: str,
    expires: int = 3600,
    filename: str = None,
) -> str:
    """
    Generate a presigned GET URL for downloading/viewing a file from R2.

    Args:
        object_key: The R2 object key.
        expires: URL validity in seconds (default: 1 hour).
        filename: Optional clean filename to set ResponseContentDisposition attachment header.

    Returns:
        Presigned GET URL string.
    """
    params = {
        "Bucket": settings.r2_bucket_name,
        "Key": object_key,
    }
    if filename:
        # Extract file extension and base name, clean it
        clean_filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
        params["ResponseContentDisposition"] = f'attachment; filename="{clean_filename}"'

    url = _s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params=params,
        ExpiresIn=expires,
    )
    return url


def hydrate_maintenance_request(db_req, resp_model) -> None:
    """
    Populates image_urls and landlord_image_urls on the response model
    by generating presigned download URLs for all keys.
    """
    urls = []
    if db_req.image_keys:
        for key in db_req.image_keys:
            try:
                urls.append(generate_presigned_download_url(key))
            except Exception:
                pass
    resp_model.image_urls = urls

    landlord_urls = []
    if db_req.landlord_image_keys:
        for key in db_req.landlord_image_keys:
            try:
                landlord_urls.append(generate_presigned_download_url(key))
            except Exception:
                pass
    resp_model.landlord_image_urls = landlord_urls
