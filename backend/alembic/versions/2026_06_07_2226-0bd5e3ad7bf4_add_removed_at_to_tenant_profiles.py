"""
Add removed_at to tenant_profiles

Revision ID: 0bd5e3ad7bf4
Revises: aa710ef4e35f
Create Date: 2026-06-07 22:26:40.152796

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '0bd5e3ad7bf4'
down_revision: Union[str, None] = 'aa710ef4e35f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tenant_profiles', sa.Column('removed_at', sa.DateTime(), nullable=True))
    op.add_column('units', sa.Column('status', sa.String(), server_default=sa.text("'Vacant'"), nullable=False))


def downgrade() -> None:
    op.drop_column('units', 'status')
    op.drop_column('tenant_profiles', 'removed_at')
