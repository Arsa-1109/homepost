"""
Announcement Model

Property-wide announcements posted by the landlord.
Tenants see announcements scoped to their assigned property.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class Announcement(SQLModel, table=True):
    __tablename__ = "announcements"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    property_id: uuid.UUID = Field(foreign_key="properties.id", nullable=False)
    unit_id: uuid.UUID | None = Field(default=None, foreign_key="units.id", nullable=True)
    author_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    title: str = Field(max_length=255)
    body: str = Field(max_length=5000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc, sa_type=DateTime(timezone=True)))
