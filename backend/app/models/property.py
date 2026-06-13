"""
Property Model

A physical property owned by a landlord (e.g., "Koramangala 2BHK Building").
Each property contains one or more Units.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class Property(SQLModel, table=True):
    __tablename__ = "properties"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    name: str = Field(max_length=255)
    address: str = Field(max_length=500)
    city: str = Field(max_length=100)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True))
