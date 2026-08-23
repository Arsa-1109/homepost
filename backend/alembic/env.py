import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# IMPORT SQLMODEL AND ALL YOUR MODELS HERE
from sqlmodel import SQLModel
# Ensure the model registry is loaded so Alembic detects all tables
import app.models  # noqa: F401 — triggers model registry for Alembic table discovery
from app.core.config import get_settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    # disable_existing_loggers=False: this module is also imported by the test
    # suite; killing pre-existing loggers would silence app logging mid-run.
    fileConfig(config.config_file_name, disable_existing_loggers=False)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = SQLModel.metadata

# Set sqlalchemy.url from our settings if not overridden
settings = get_settings()
if not config.get_main_option("sqlalchemy.url"):
    config.set_main_option("sqlalchemy.url", settings.database_url)
else:
    # alembic.ini ships a placeholder; the app Settings value always wins
    # unless a caller (e.g. tests) explicitly overrode it via set_main_option.
    ini_url = config.get_main_option("sqlalchemy.url")
    if "localhost" in ini_url:
        config.set_main_option("sqlalchemy.url", settings.database_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=_include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


# Schema objects that exist in Postgres but are intentionally absent from the
# SQLModel metadata — autogenerate/`alembic check` must not flag them as drift.
_INTENTIONAL_DB_ONLY = {
    # PG-only partial unique index (e1a2b3c4d5e6): single-active-tenant guard.
    ("index", "unique_active_unit_tenant"),
}


def _include_object(obj, name, type_, reflected, compare_to):
    # For "removed in DB" comparisons the object is reflected from the DB.
    if reflected and (type_, name) in _INTENTIONAL_DB_ONLY:
        return False
    return True


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
