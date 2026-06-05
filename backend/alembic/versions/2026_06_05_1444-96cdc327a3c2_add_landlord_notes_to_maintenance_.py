"""
add landlord_notes to maintenance_requests

Revision ID: 96cdc327a3c2
Revises: abc123def456
Create Date: 2026-06-05 14:44:32.367493

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '96cdc327a3c2'
down_revision: Union[str, None] = 'abc123def456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('maintenance_requests', sa.Column('landlord_notes', sa.String(length=2000), nullable=True))

def downgrade() -> None:
    op.drop_column('maintenance_requests', 'landlord_notes')
