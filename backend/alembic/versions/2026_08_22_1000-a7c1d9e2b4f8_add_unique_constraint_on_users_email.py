"""
Add unique constraint on users.email

Revision ID: a7c1d9e2b4f8
Revises: f1b2c3d4e5f6
Create Date: 2026-08-22 10:00:00.000000

Fails fast with a clear report if duplicate emails exist so operators can run
scripts/deduplicate_user_emails.py before retrying.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c1d9e2b4f8'
down_revision: Union[str, None] = 'f1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CONSTRAINT_NAME = "uq_users_email"


def _find_duplicate_emails() -> list:
    bind = op.get_bind()
    return bind.execute(
        sa.text(
            "SELECT email, COUNT(*) AS occurrences FROM users "
            "WHERE email IS NOT NULL "
            "GROUP BY email HAVING COUNT(*) > 1"
        )
    ).fetchall()


def upgrade() -> None:
    duplicates = _find_duplicate_emails()
    if duplicates:
        listing = ", ".join(f"{row.email!r} (x{row.occurrences})" for row in duplicates)
        raise RuntimeError(
            "Cannot add unique constraint on users.email — duplicate emails found: "
            f"{listing}. Run scripts/deduplicate_user_emails.py to resolve them, then retry."
        )
    op.create_unique_constraint(CONSTRAINT_NAME, "users", ["email"])


def downgrade() -> None:
    op.drop_constraint(CONSTRAINT_NAME, "users", type_="unique")
