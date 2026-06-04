"""
Health Check Router

Provides system-level endpoints for monitoring and diagnostics.
Used by Railway healthcheck, CI pipelines, and frontend connectivity tests.
"""

from fastapi import APIRouter

router = APIRouter(tags=["System"])


@router.get("/health")
async def health_check():
    """Simple liveness probe. Returns 200 if the server is running."""
    return {"status": "ok", "service": "homepost-api"}
