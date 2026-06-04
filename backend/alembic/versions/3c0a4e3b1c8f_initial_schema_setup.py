"""Initial schema setup

Revision ID: 3c0a4e3b1c8f
Revises: 
Create Date: 2026-06-04 14:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '3c0a4e3b1c8f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('clerk_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('requested_landlord_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['requested_landlord_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_clerk_id'), 'users', ['clerk_id'], unique=True)

    # 2. properties table
    op.create_table(
        'properties',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. units table
    op.create_table(
        'units',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('property_id', sa.Uuid(), nullable=False),
        sa.Column('unit_label', sa.String(length=100), nullable=False),
        sa.Column('rent_due_day', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. tenant_profiles table
    op.create_table(
        'tenant_profiles',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('unit_id', sa.Uuid(), nullable=False),
        sa.Column('lease_start', sa.Date(), nullable=True),
        sa.Column('lease_end', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # 5. maintenance_requests table
    op.create_table(
        'maintenance_requests',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('unit_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=2000), nullable=False),
        sa.Column('image_keys', sa.JSON(), nullable=True),
        sa.Column('priority', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant_profiles.id'], ),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. announcements table
    op.create_table(
        'announcements',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('property_id', sa.Uuid(), nullable=False),
        sa.Column('author_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('body', sa.String(length=5000), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 7. documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('property_id', sa.Uuid(), nullable=False),
        sa.Column('uploaded_by', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('file_key', sa.String(length=500), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 8. invites table
    op.create_table(
        'invites',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('unit_id', sa.Uuid(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invites_token'), 'invites', ['token'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_invites_token'), table_name='invites')
    op.drop_table('invites')
    op.drop_table('documents')
    op.drop_table('announcements')
    op.drop_table('maintenance_requests')
    op.drop_table('tenant_profiles')
    op.drop_table('units')
    op.drop_table('properties')
    op.drop_index(op.f('ix_users_clerk_id'), table_name='users')
    op.drop_table('users')
