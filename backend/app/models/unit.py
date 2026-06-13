"""
Unit Model

A rentable unit within a property (e.g., "Flat 2A", "Room 101").
Each unit has a configurable rent_due_day used by the scheduler
for automated rent reminders.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class Unit(SQLModel, table=True):
    __tablename__ = "units"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    property_id: uuid.UUID = Field(foreign_key="properties.id", nullable=False)
    unit_label: str = Field(max_length=100)  # e.g., "Flat 2A", "PG Room 3"

    # Day of month rent is due (1–31). Used by APScheduler for reminders.
    rent_due_day: int = Field(default=1, ge=1, le=31)
    status: str = Field(default="Vacant")

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True))
