"""Add upload_quota table (H2: per-user daily upload quota)

Revision ID: b9e4f7a1c2d3
Revises: a7c1d9e2b4f8
Create Date: 2026-08-22 12:00:00.000000

Additive migration — no existing data touched.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9e4f7a1c2d3'
down_revision: Union[str, None] = 'a7c1d9e2b4f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'upload_quota',
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('day_utc', sa.Date(), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'day_utc')
    )


def downgrade() -> None:
    op.drop_table('upload_quota')
