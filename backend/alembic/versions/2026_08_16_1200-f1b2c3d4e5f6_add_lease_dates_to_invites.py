"""
add_lease_dates_to_invites

Revision ID: f1b2c3d4e5f6
Revises: e1a2b3c4d5e6
Create Date: 2026-08-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1b2c3d4e5f6'
down_revision: Union[str, None] = 'e1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('invites', sa.Column('lease_start', sa.Date(), nullable=True))
    op.add_column('invites', sa.Column('lease_end', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('invites', 'lease_end')
    op.drop_column('invites', 'lease_start')
