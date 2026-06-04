"""
User Model

Represents any authenticated user in the system. Users are auto-created
on their first API call via Clerk JWT sync (see dependencies/auth.py).

Roles:
  - landlord: Full property management access
  - tenant: Access scoped to their assigned unit
  - tenant_pending: Awaiting landlord approval (no data access)
  - unassigned: Fresh signup, hasn't completed onboarding yet
"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import String


class UserRole(str, Enum):
    LANDLORD = "landlord"
    TENANT = "tenant"
    TENANT_PENDING = "tenant_pending"
    UNASSIGNED = "unassigned"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    clerk_id: str = Field(
        sa_column=Column(String, unique=True, index=True, nullable=False),
    )
    email: str = Field(max_length=320)
    full_name: str = Field(default="", max_length=255)
    role: UserRole = Field(default=UserRole.UNASSIGNED)

    # For tenant_pending: which landlord they requested to join
    requested_landlord_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="users.id",
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
