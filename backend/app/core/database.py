"""
Async Database Engine & Session Management

Provides:
- create_async_engine: connection pool to PostgreSQL via asyncpg
- async_session_maker: factory for async ORM sessions
- get_session: FastAPI Depends() generator that yields a session per request

Why async?
- FastAPI is async-native. Using sync DB calls would block the event loop.
- asyncpg is the fastest PostgreSQL driver for Python.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.core.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Engine — manages the connection pool
# ---------------------------------------------------------------------------
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Set to True for SQL query logging during development
    future=True,
)

# ---------------------------------------------------------------------------
# Session Factory — creates new sessions from the pool
# ---------------------------------------------------------------------------
async_session_maker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent lazy-load errors after commit
)


# ---------------------------------------------------------------------------
# Dependency — inject a session into FastAPI route handlers
# ---------------------------------------------------------------------------
async def get_session():
    """
    Yields an async database session for the duration of a single request.
    Automatically closes the session when the request is done.

    Usage in a route:
        @app.get("/example")
        async def example(session: AsyncSession = Depends(get_session)):
            ...
    """
    async with async_session_maker() as session:
        yield session


# ---------------------------------------------------------------------------
# Table Creation Utility (development only — use Alembic in production)
# ---------------------------------------------------------------------------
async def create_all_tables():
    """Create all SQLModel tables. For initial dev only; Alembic handles prod."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
