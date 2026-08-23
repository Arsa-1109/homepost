"""
Add unit_id to announcements and is_archived to documents

Revision ID: aa710ef4e35f
Revises: 8eda050cb095
Create Date: 2026-06-07 22:24:12.463611

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'aa710ef4e35f'
down_revision: Union[str, None] = '8eda050cb095'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('announcements', sa.Column('unit_id', sa.Uuid(), nullable=True))
    # batch mode handles SQLite's lack of ALTER TABLE ADD CONSTRAINT
    with op.batch_alter_table('announcements') as batch_op:
        batch_op.create_foreign_key(
            'fk_announcements_units', 'units', ['unit_id'], ['id']
        )
    op.add_column('documents', sa.Column('is_archived', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade():
    op.drop_column('documents', 'is_archived')
    with op.batch_alter_table('announcements') as batch_op:
        batch_op.drop_constraint('fk_announcements_units', type_='foreignkey')
    op.drop_column('announcements', 'unit_id')
