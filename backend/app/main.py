"""
Micro-Landlord Tenant Portal — FastAPI Entry Point

This is the main application factory. It configures:
- CORS middleware for the Next.js frontend
- API router registration under /api/v1
- Lifespan events (DB, scheduler startup/shutdown)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import engine
from app.services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Application lifespan manager.
    - Startup: start APScheduler.
    - Shutdown: stop APScheduler, dispose database engine.
    """
    # --- Startup ---
    start_scheduler()
    yield
    # --- Shutdown ---
    stop_scheduler()
    await engine.dispose()


settings = get_settings()

app = FastAPI(
    title="Homepost API",
    description="Tenant portal for individual property owners managing 1–5 properties.",
    version="0.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js frontend to make cross-origin requests
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health Check — used by Railway healthcheck and CI smoke tests
# ---------------------------------------------------------------------------
@app.get("/health", tags=["System"])
async def health_check():
    """Simple liveness probe. Returns 200 if the server is running."""
    return {"status": "ok", "service": "homepost-api"}


# ---------------------------------------------------------------------------
# Router Registration (Phase 4+)
# ---------------------------------------------------------------------------
from app.routers.onboarding import router as onboarding_router
from app.routers.landlord import router as landlord_router
from app.routers.tenant import router as tenant_router
from app.routers.uploads import router as uploads_router

app.include_router(onboarding_router, prefix="/api/v1")
app.include_router(landlord_router, prefix="/api/v1")
app.include_router(tenant_router, prefix="/api/v1")
app.include_router(uploads_router, prefix="/api/v1")
