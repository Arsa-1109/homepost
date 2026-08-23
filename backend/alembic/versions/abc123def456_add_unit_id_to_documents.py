"""add unit_id to documents

Revision ID: abc123def456
Revises: 3c0a4e3b1c8f
Create Date: 2026-06-05 14:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision = 'abc123def456'
down_revision = '3c0a4e3b1c8f'
branch_labels = None
depends_on = None


def upgrade():
    # add column unit_id to documents
    op.add_column('documents', sa.Column('unit_id', sa.Uuid(), nullable=True))
    # batch mode handles SQLite's lack of ALTER TABLE ADD CONSTRAINT
    with op.batch_alter_table('documents') as batch_op:
        batch_op.create_foreign_key(
            'fk_documents_unit_id_units', 'units', ['unit_id'], ['id']
        )

def downgrade():
    with op.batch_alter_table('documents') as batch_op:
        batch_op.drop_constraint('fk_documents_unit_id_units', type_='foreignkey')
    op.drop_column('documents', 'unit_id')
