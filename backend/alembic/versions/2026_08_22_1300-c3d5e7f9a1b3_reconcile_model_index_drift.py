"""
Reconcile model↔migration index drift (H11)

Revision ID: c3d5e7f9a1b3
Revises: b9e4f7a1c2d3
Create Date: 2026-08-22

Creates every index declared on the SQLModel models that no prior migration
created. On PostgreSQL each index is built with CREATE INDEX CONCURRENTLY
inside an autocommit block so table writes are never blocked (zero-downtime).
On SQLite (test runs) plain CREATE INDEX is used — CONCURRENTLY unsupported.

Idempotent via IF NOT EXISTS. Downgrade drops all created indexes safely.
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = 'c3d5e7f9a1b3'
down_revision: Union[str, None] = 'b9e4f7a1c2d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (index_name, table, columns, unique)
# users.email / tenant_profiles.user_id are plain indexes here: uniqueness is
# enforced by the named UniqueConstraints (uq_users_email, added by a7c1d9e2b4f8;
# tenant_profiles_user_id_key, created inline with the initial schema) —
# matching Field(index=True) + UniqueConstraint on the models exactly.
INDEXES = [
    ('ix_users_email', 'users', ['email'], False),
    ('ix_users_role', 'users', ['role'], False),
    ('ix_users_requested_landlord_id', 'users', ['requested_landlord_id'], False),
    ('ix_properties_owner_id', 'properties', ['owner_id'], False),
    ('ix_units_property_id', 'units', ['property_id'], False),
    ('ix_tenant_profiles_user_id', 'tenant_profiles', ['user_id'], False),
    ('ix_tenant_profiles_unit_id', 'tenant_profiles', ['unit_id'], False),
    ('ix_tenant_profiles_is_active', 'tenant_profiles', ['is_active'], False),
    ('ix_maintenance_requests_tenant_id', 'maintenance_requests', ['tenant_id'], False),
    ('ix_maintenance_requests_unit_id', 'maintenance_requests', ['unit_id'], False),
    ('ix_maintenance_requests_priority', 'maintenance_requests', ['priority'], False),
    ('ix_maintenance_requests_status', 'maintenance_requests', ['status'], False),
    ('ix_announcements_property_id', 'announcements', ['property_id'], False),
    ('ix_announcements_unit_id', 'announcements', ['unit_id'], False),
    ('ix_announcements_author_id', 'announcements', ['author_id'], False),
    ('ix_documents_property_id', 'documents', ['property_id'], False),
    ('ix_documents_unit_id', 'documents', ['unit_id'], False),
    ('ix_documents_uploaded_by', 'documents', ['uploaded_by'], False),
    ('ix_invites_unit_id', 'invites', ['unit_id'], False),
    ('ix_invites_created_by', 'invites', ['created_by'], False),
    ('ix_invites_status', 'invites', ['status'], False),
    ('ix_maintenance_events_actor_id', 'maintenance_events', ['actor_id'], False),
    ('ix_maintenance_events_maintenance_request_id', 'maintenance_events',
     ['maintenance_request_id'], False),
]


def _create_sql(name: str, table: str, columns: list[str], unique: bool,
                concurrently: bool) -> str:
    unique_sql = 'UNIQUE ' if unique else ''
    # Postgres grammar: CREATE [UNIQUE] INDEX [CONCURRENTLY] [IF NOT EXISTS] name
    concurrent_sql = 'CONCURRENTLY ' if concurrently else ''
    return (
        f'CREATE {unique_sql}INDEX {concurrent_sql}IF NOT EXISTS {name} '
        f'ON {table} ({", ".join(columns)})'
    )


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'

    if not is_postgres:
        for name, table, columns, unique in INDEXES:
            bind.execute(text(_create_sql(name, table, columns, unique, False)))
        return

    # CONCURRENTLY cannot run inside a transaction block.
    with op.get_context().autocommit_block():
        for name, table, columns, unique in INDEXES:
            bind.execute(text(_create_sql(name, table, columns, unique, True)))


def downgrade() -> None:
    for name, _, _, _ in reversed(INDEXES):
        op.drop_index(name)
