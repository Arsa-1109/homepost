"""
add_unique_active_unit_tenant_index

Revision ID: e1a2b3c4d5e6
Revises: 8da4ca6c7c65
Create Date: 2026-08-15 21:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1a2b3c4d5e6'
down_revision: Union[str, None] = '8da4ca6c7c65'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create PostgreSQL partial unique index ensuring at most one active tenant profile per unit
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS unique_active_unit_tenant 
        ON tenant_profiles (unit_id) 
        WHERE is_active = TRUE;
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS unique_active_unit_tenant;")
