"""
Application Configuration — Pydantic Settings

Loads all environment variables from .env with type validation.
Uses @lru_cache to ensure a single Settings instance (singleton pattern).

Why pydantic-settings?
- Type-safe: catches missing/invalid env vars at startup, not at runtime.
- Auto-loads from .env files.
- Plays nicely with FastAPI's Depends() system.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration. Every env var maps to a field here.
    Field names are case-insensitive when matched against env vars.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Don't crash on extra env vars
    )

    # --- Database ---
    database_url: str

    # --- Clerk Auth ---
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""

    # --- Cloudflare R2 ---
    r2_endpoint_url: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""

    # --- Resend ---
    resend_api_key: str = ""

    # --- App ---
    frontend_url: str = "http://localhost:3000"

    # --- Upload Constraints ---
    max_upload_size_bytes: int = 10_485_760  # 10 MB


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings singleton.
    Called once at startup; subsequent calls return the same instance.
    """
    return Settings()
