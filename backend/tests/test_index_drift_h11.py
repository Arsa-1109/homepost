"""
H11 — Model↔migration index drift reconciliation.

Tests assert that running `alembic upgrade head` produces every index declared
on the SQLModel models. These fail pre-fix because the initial migration never
created the model-declared indexes (only ix_users_clerk_id / ix_invites_token).
"""

import os
import uuid
from pathlib import Path

import pytest
from sqlalchemy import inspect
from alembic import command
from alembic.config import Config

from app.models import (  # noqa: F401 — registry load
    announcement, document, invite, maintenance_event, maintenance_request,
    property as property_model, tenant_profile, unit, upload_quota, user,
)

BACKEND_DIR = Path(__file__).resolve().parents[1]

# Indexes declared via Field(index=True)/sa_column(index=True) in app/models.
EXPECTED_INDEXES = {
    "users": ["ix_users_clerk_id", "ix_users_email", "ix_users_role",
              "ix_users_requested_landlord_id"],
    "properties": ["ix_properties_owner_id"],
    "units": ["ix_units_property_id"],
    "tenant_profiles": ["ix_tenant_profiles_user_id", "ix_tenant_profiles_unit_id",
                        "ix_tenant_profiles_is_active"],
    "maintenance_requests": [
        "ix_maintenance_requests_priority", "ix_maintenance_requests_status",
        "ix_maintenance_requests_tenant_id", "ix_maintenance_requests_unit_id",
    ],
    "maintenance_events": ["ix_maintenance_events_actor_id",
                           "ix_maintenance_events_maintenance_request_id"],
    "announcements": ["ix_announcements_property_id", "ix_announcements_unit_id",
                      "ix_announcements_author_id"],
    "documents": ["ix_documents_property_id", "ix_documents_unit_id",
                  "ix_documents_uploaded_by"],
    "invites": ["ix_invites_token", "ix_invites_unit_id", "ix_invites_created_by",
                "ix_invites_status"],
}


@pytest.fixture
def migrated_sqlite_db(tmp_path):
    """Run `alembic upgrade head` against a throwaway SQLite file DB."""
    db_path = tmp_path / f"alembic_h11_{uuid.uuid4().hex}.db"
    url = f"sqlite+aiosqlite:///{db_path.as_posix()}"
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    # Bypass env.py's get_settings() lookup — never touch the cached app
    # Settings singleton, other modules hold references to it.
    cfg.set_main_option("sqlalchemy.url", url)
    command.upgrade(cfg, "head")
    yield url
    db_path.unlink(missing_ok=True)


def _existing_indexes(conn, table: str) -> set[str]:
    return {ix["name"] for ix in inspect(conn).get_indexes(table)}


@pytest.mark.parametrize("table,expected", sorted(EXPECTED_INDEXES.items()))
def test_migration_produces_model_declared_indexes(migrated_sqlite_db, table, expected):
    """Every model-declared index must exist after `alembic upgrade head`."""
    from sqlalchemy.ext.asyncio import create_async_engine
    import asyncio

    async def _introspect():
        engine = create_async_engine(migrated_sqlite_db)
        try:
            async with engine.connect() as conn:
                return await conn.run_sync(lambda c: _existing_indexes(c, table))
        finally:
            await engine.dispose()

    existing = asyncio.run(_introspect())
    missing = set(expected) - existing
    assert not missing, (
        f"Index drift on {table}: migration chain never created "
        f"{sorted(missing)} though the models declare them."
    )


def test_migration_produces_model_declared_columns(migrated_sqlite_db):
    """Model columns added after the initial migration must exist post-upgrade."""
    from sqlalchemy.ext.asyncio import create_async_engine
    import asyncio

    async def _introspect():
        engine = create_async_engine(migrated_sqlite_db)
        try:
            async with engine.connect() as conn:
                def _columns(sync_conn):
                    inspector = inspect(sync_conn)
                    return {
                        col["name"]: col
                        for col in inspector.get_columns("units")
                    }
                return await conn.run_sync(_columns)
        finally:
            await engine.dispose()

    units_columns = asyncio.run(_introspect())
    missing = {"lease_start", "lease_end"} - set(units_columns)
    assert not missing, (
        f"Column drift on units: models declare {sorted(missing)} "
        "but the migration chain never creates them."
    )


def test_migration_matches_users_email_nullability(migrated_sqlite_db):
    """users.email is Optional[str] on the model; the DB must allow NULL too."""
    from sqlalchemy.ext.asyncio import create_async_engine
    import asyncio

    async def _introspect():
        engine = create_async_engine(migrated_sqlite_db)
        try:
            async with engine.connect() as conn:
                def _columns(sync_conn):
                    inspector = inspect(sync_conn)
                    return {c["name"]: c for c in inspector.get_columns("users")}
                return await conn.run_sync(_columns)
        finally:
            await engine.dispose()

    users_columns = asyncio.run(_introspect())
    assert users_columns["email"]["nullable"] is True, (
        "users.email is nullable on the model but NOT NULL in the migrated DB."
    )


@pytest.mark.parametrize("table", ["announcements", "documents"])
def test_migration_produces_unit_foreign_keys(migrated_sqlite_db, table):
    """unit_id columns carry an FK to units.id on every supported backend."""
    from sqlalchemy.ext.asyncio import create_async_engine
    import asyncio

    async def _introspect():
        engine = create_async_engine(migrated_sqlite_db)
        try:
            async with engine.connect() as conn:
                def _fks(sync_conn):
                    inspector = inspect(sync_conn)
                    return inspector.get_foreign_keys(table)
                return await conn.run_sync(_fks)
        finally:
            await engine.dispose()

    foreign_keys = asyncio.run(_introspect())
    matching = [
        fk for fk in foreign_keys
        if fk.get("referred_table") == "units"
        and "unit_id" in fk.get("constrained_columns", [])
    ]
    assert matching, (
        f"{table}.unit_id has no FK to units.id after `alembic upgrade head`."
    )


def test_migration_produces_named_tenant_user_constraint(migrated_sqlite_db):
    """The model names its single-occupancy guard tenant_profiles_user_id_key."""
    from sqlalchemy.ext.asyncio import create_async_engine
    import asyncio

    async def _introspect():
        engine = create_async_engine(migrated_sqlite_db)
        try:
            async with engine.connect() as conn:
                def _uniques(sync_conn):
                    return {
                        uq["name"]
                        for uq in inspect(sync_conn).get_unique_constraints("tenant_profiles")
                    }
                return await conn.run_sync(_uniques)
        finally:
            await engine.dispose()

    unique_names = asyncio.run(_introspect())
    assert "tenant_profiles_user_id_key" in unique_names, (
        f"Named unique constraint missing post-upgrade; found {sorted(n for n in unique_names if n)}"
    )


def test_expected_index_map_matches_models():
    """Guard against the test map itself drifting from the models."""
    from sqlmodel import SQLModel

    declared: dict[str, list[str]] = {}
    for table in SQLModel.metadata.sorted_tables:
        names = [ix.name for ix in table.indexes if ix.name]
        if names:
            declared[table.key] = sorted(names)
    for table, expected in EXPECTED_INDEXES.items():
        assert sorted(expected) == declared.get(table), (
            f"EXPECTED_INDEXES[{table!r}] out of sync with models: "
            f"models declare {declared.get(table)}"
        )
