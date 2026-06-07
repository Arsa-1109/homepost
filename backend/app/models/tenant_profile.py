"""
Tenant Profile Model

Links a User (role=tenant) to a specific Unit. This is the data isolation
anchor — every tenant query filters by the profile's unit_id.

Contains lease dates used by APScheduler for lease expiry reminders.
"""

import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class TenantProfile(SQLModel, table=True):
    __tablename__ = "tenant_profiles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="users.id", unique=True, nullable=False
    )
    unit_id: uuid.UUID = Field(foreign_key="units.id", nullable=False)

    lease_start: Optional[date] = Field(default=None)
    lease_end: Optional[date] = Field(default=None)
    is_active: bool = Field(default=True)
    removed_at: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
