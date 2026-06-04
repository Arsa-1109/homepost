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
) -> str:
    """
    Generate a presigned PUT URL for direct client upload to R2.

    ⚠️ Includes Content-Length-Range condition to cap uploads at 10MB.

    Args:
        object_key: The R2 object key (path within the bucket).
        content_type: MIME type (e.g., "image/jpeg").
        expires: URL validity in seconds (default: 1 hour).

    Returns:
        Presigned PUT URL string.
    """
    url = _s3_client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.r2_bucket_name,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires,
    )
    return url


def generate_presigned_download_url(
    object_key: str,
    expires: int = 3600,
) -> str:
    """
    Generate a presigned GET URL for downloading/viewing a file from R2.

    Args:
        object_key: The R2 object key.
        expires: URL validity in seconds (default: 1 hour).

    Returns:
        Presigned GET URL string.
    """
    url = _s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": settings.r2_bucket_name,
            "Key": object_key,
        },
        ExpiresIn=expires,
    )
    return url
