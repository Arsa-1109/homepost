"""
add_attachment_keys_to_announcements

Revision ID: 8da4ca6c7c65
Revises: de6863f2c755
Create Date: 2026-08-12 00:09:40.751666

The ALTER COLUMN ... TYPE statements are PostgreSQL-only (naive TIMESTAMP →
TIMESTAMPTZ). SQLite has no column-type ALTER; its dynamic typing makes the
conversion a no-op, so those statements are skipped there.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8da4ca6c7c65'
down_revision: Union[str, None] = 'de6863f2c755'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TZ_COLUMNS = [
    ('announcements', 'created_at'),
    ('documents', 'created_at'),
    ('invites', 'created_at'),
    ('maintenance_events', 'created_at'),
    ('maintenance_requests', 'created_at'),
    ('maintenance_requests', 'updated_at'),
    ('properties', 'created_at'),
    ('tenant_profiles', 'created_at'),
    ('units', 'created_at'),
    ('users', 'created_at'),
    ('users', 'updated_at'),
]


def upgrade() -> None:
    op.add_column('announcements', sa.Column('attachment_keys', sa.JSON(), nullable=True))
    if op.get_bind().dialect.name == 'sqlite':
        return
    for table, column in _TZ_COLUMNS:
        op.alter_column(table, column,
                        existing_type=postgresql.TIMESTAMP(),
                        type_=sa.DateTime(timezone=True),
                        existing_nullable=False)


def downgrade() -> None:
    if op.get_bind().dialect.name != 'sqlite':
        for table, column in _TZ_COLUMNS:
            op.alter_column(table, column,
                            existing_type=sa.DateTime(timezone=True),
                            type_=postgresql.TIMESTAMP(),
                            existing_nullable=False)
    op.drop_column('announcements', 'attachment_keys')
