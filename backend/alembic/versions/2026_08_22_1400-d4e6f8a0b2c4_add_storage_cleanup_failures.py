"""
Add storage_cleanup_failures table (M2)

Revision ID: d4e6f8a0b2c4
Revises: c3d5e7f9a1b3
Create Date: 2026-08-22

Additive table for best-effort R2 cleanup failure records (ops sweep).
Downgrade drops it — no existing data is touched.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e6f8a0b2c4'
down_revision: Union[str, None] = 'c3d5e7f9a1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = 'storage_cleanup_failures'


def upgrade() -> None:
    op.create_table(
        TABLE,
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('object_key', sa.String(length=500), nullable=False),
        sa.Column('reason', sa.String(length=2000), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_storage_cleanup_failures_object_key', TABLE, ['object_key']
    )


def downgrade() -> None:
    op.drop_index('ix_storage_cleanup_failures_object_key', table_name=TABLE)
    op.drop_table(TABLE)
