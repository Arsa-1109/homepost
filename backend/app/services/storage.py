"""
Cloudflare R2 Storage Service

Generates presigned URLs for direct client uploads and downloads.
The FastAPI server never handles file bytes — R2 does.

⚠️ Size Constraint: All presigned upload URLs include a Content-Length-Range
   condition (0–10MB) to prevent oversized uploads. This is enforced by R2
   at the storage layer.

Key format conventions:
  - Maintenance images: maintenance/{request_id}/{uuid}.{ext}
  - Documents: documents/{property_id}/{uuid}.{ext}
"""

import uuid

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
    config=BotoConfig(signature_version="s3v4"),
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


def generate_presigned_upload_url(
    object_key: str,
    content_type: str,
    expires: int = 3600,
) -> dict:
    """
    Generate a presigned POST payload for direct client upload to R2.

    ⚠️ Includes Content-Length-Range condition to cap uploads at 10MB.

    Args:
        object_key: The R2 object key (path within the bucket).
        content_type: MIME type (e.g., "image/jpeg").
        expires: URL validity in seconds (default: 1 hour).

    Returns:
        Presigned POST dictionary containing 'url' and 'fields'.
    """
    post_data = _s3_client.generate_presigned_post(
        Bucket=settings.r2_bucket_name,
        Key=object_key,
        Fields={"Content-Type": content_type},
        Conditions=[
            {"Content-Type": content_type},
            ["content-length-range", 0, 10485760]  # Max 10MB
        ],
        ExpiresIn=expires,
    )
    return post_data


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
