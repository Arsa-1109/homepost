"""
Tenant Profile Model

Links a User (role=tenant) to a specific Unit. This is the data isolation
anchor — every tenant query filters by the profile's unit_id.

Single-occupancy guarantee:
- Supported by a PostgreSQL partial unique index (`unique_active_unit_tenant`) on (unit_id) WHERE is_active = TRUE.
- One active tenant per unit at any given time.

Contains lease dates used by APScheduler for lease expiry reminders.
"""

import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel


class TenantProfile(SQLModel, table=True):
    __tablename__ = "tenant_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", name="tenant_profiles_user_id_key"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="users.id", index=True, nullable=False
    )
    unit_id: uuid.UUID = Field(foreign_key="units.id", index=True, nullable=False)

    lease_start: Optional[date] = Field(default=None)
    lease_end: Optional[date] = Field(default=None)
    is_active: bool = Field(default=True, index=True)
    removed_at: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True))
