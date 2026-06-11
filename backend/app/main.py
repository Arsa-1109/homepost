"""
Micro-Landlord Tenant Portal — FastAPI Entry Point

This is the main application factory. It configures:
- CORS middleware for the Next.js frontend
- API router registration under /api/v1
- Lifespan events (DB, scheduler startup/shutdown)
"""

import logging
from contextlib import asynccontextmanager
from urllib.parse import urlparse, urlunparse

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.database import engine
from app.services.scheduler import start_scheduler, stop_scheduler

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Application lifespan manager.
    - Startup: start APScheduler.
    - Shutdown: stop APScheduler, dispose database engine.
    """
    # --- Startup ---
    raw_url = settings.database_url
    try:
        parsed = urlparse(raw_url)
        masked_netloc = f"{parsed.username}:****@{parsed.hostname}"
        if parsed.port:
            masked_netloc += f":{parsed.port}"
        masked_url = urlunparse(parsed._replace(netloc=masked_netloc))
    except Exception:
        masked_url = "***MASKED***"
        
    logger.info(f"[STARTUP] DATABASE_URL = {masked_url}")
    
    # Test DB connection and log status
    from sqlalchemy import text
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("[STARTUP] Database connection successful.")
        
        # Verify if tables exist (specifically the 'users' table)
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1 FROM users LIMIT 1"))
            logger.info("[STARTUP] Database tables verified (users table exists).")
        except Exception as table_err:
            logger.error(f"[STARTUP] Database tables check FAILED: {table_err}")
            logger.warning("[STARTUP] WARNING: Tables may not be created. Ensure migrations have run.")
    except Exception as db_err:
        logger.error(f"[STARTUP] Database connection FAILED: {db_err}", exc_info=True)

    start_scheduler()
    yield
    # --- Shutdown ---
    stop_scheduler()
    await engine.dispose()


settings = get_settings()

from app.core.limiter import limiter

app = FastAPI(
    title="Homepost API",
    description="Tenant portal for individual property owners managing 1–5 properties.",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow the Next.js frontend to make cross-origin requests
# FRONTEND_URL can be a single URL or comma-separated list of URLs
# Supports regex matching for local development and Vercel preview/branch deployments.
# ---------------------------------------------------------------------------
# Security Headers
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

_raw_origins = [o.strip() for o in settings.frontend_url.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_raw_origins,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://homepost-.*\.vercel\.app|https://homepost\.vercel\.app)$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
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
