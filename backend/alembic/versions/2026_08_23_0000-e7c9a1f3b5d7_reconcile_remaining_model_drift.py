"""
Reconcile remaining model↔migration drift (H11 companion)

Revision ID: e7c9a1f3b5d7
Revises: d4e6f8a0b2c4
Create Date: 2026-08-23

- units.lease_start / units.lease_end: declared on the Unit model but never
  added by any prior migration.
- users.email: Optional[str] on the model (nullable) but NOT NULL since the
  initial schema. Nullable via batch mode so SQLite can rebuild safely.
- tenant_profiles_user_id_key: Postgres auto-named the initial schema's
  unnamed inline UNIQUE exactly this way; SQLite reflection cannot, so the
  named constraint is created there via batch mode.

Additive only — no data mutation, trivially reversible.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7c9a1f3b5d7'
down_revision: Union[str, None] = 'd4e6f8a0b2c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('units', sa.Column('lease_start', sa.Date(), nullable=True))
    op.add_column('units', sa.Column('lease_end', sa.Date(), nullable=True))
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('email', existing_type=sa.String(length=320), nullable=True)
    if op.get_bind().dialect.name == 'sqlite':
        with op.batch_alter_table('tenant_profiles') as batch_op:
            batch_op.create_unique_constraint(
                'tenant_profiles_user_id_key', ['user_id']
            )


def downgrade() -> None:
    if op.get_bind().dialect.name == 'sqlite':
        with op.batch_alter_table('tenant_profiles') as batch_op:
            batch_op.drop_constraint('tenant_profiles_user_id_key', type_='unique')
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('email', existing_type=sa.String(length=320), nullable=False)
    op.drop_column('units', 'lease_end')
    op.drop_column('units', 'lease_start')
