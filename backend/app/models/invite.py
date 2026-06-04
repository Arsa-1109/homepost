"""
Invite Model

Token-based invite system for onboarding tenants.

Flow:
  1. Landlord generates an invite for a specific unit → UUID4 token created.
  2. Landlord shares the link (e.g., /join/<token>) via WhatsApp or email.
  3. Tenant clicks link, signs up via Clerk, token is validated.
  4. On success: tenant auto-assigned to the unit, token marked 'accepted'.

Tokens expire after 7 days by default.
"""

import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import String


class InviteStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"


def _default_expires_at() -> datetime:
    """Invite expires 7 days from creation."""
    return datetime.now(timezone.utc) + timedelta(days=7)


class Invite(SQLModel, table=True):
    __tablename__ = "invites"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    unit_id: uuid.UUID = Field(foreign_key="units.id", nullable=False)
    created_by: uuid.UUID = Field(foreign_key="users.id", nullable=False)  # landlord

    token: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        sa_column=Column(String, unique=True, index=True, nullable=False),
    )

    status: InviteStatus = Field(
        sa_column=Column(
            String,
            default=InviteStatus.PENDING,
            nullable=False,
        )
    )
    expires_at: datetime = Field(default_factory=_default_expires_at)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
