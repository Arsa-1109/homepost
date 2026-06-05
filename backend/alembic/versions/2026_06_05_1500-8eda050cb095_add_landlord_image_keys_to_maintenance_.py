"""
add landlord_image_keys to maintenance_requests

Revision ID: 8eda050cb095
Revises: 96cdc327a3c2
Create Date: 2026-06-05 15:00:40.670114

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '8eda050cb095'
down_revision: Union[str, None] = '96cdc327a3c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('maintenance_requests', sa.Column('landlord_image_keys', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('maintenance_requests', 'landlord_image_keys')
