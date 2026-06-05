"""
Maintenance Request Model

5-state lifecycle: open → in_progress → resolved → closed
With tenant reopen: resolved → open

Priority levels set by tenant, changeable by landlord.
Image keys stored as a JSON array of up to 3 R2 object keys.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, String
from sqlalchemy.types import JSON
from sqlmodel import Field, SQLModel


class RequestStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class RequestPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ---------------------------------------------------------------------------
# Valid state transitions — enforced in the router layer
# ---------------------------------------------------------------------------
VALID_TRANSITIONS: dict[RequestStatus, list[RequestStatus]] = {
    RequestStatus.OPEN: [RequestStatus.IN_PROGRESS],
    RequestStatus.IN_PROGRESS: [RequestStatus.RESOLVED],
    RequestStatus.RESOLVED: [RequestStatus.CLOSED, RequestStatus.OPEN],  # reopen
    RequestStatus.CLOSED: [],  # terminal state
}


class MaintenanceRequest(SQLModel, table=True):
    __tablename__ = "maintenance_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenant_profiles.id", nullable=False)
    unit_id: uuid.UUID = Field(foreign_key="units.id", nullable=False)

    title: str = Field(max_length=255)
    description: str = Field(max_length=2000)

    # Up to 3 R2 object keys, stored as JSON array
    # Example: ["maintenance/abc/img1.jpg", "maintenance/abc/img2.jpg"]
    image_keys: Optional[list[str]] = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )

    landlord_notes: Optional[str] = Field(default=None, max_length=2000)

    priority: RequestPriority = Field(
        sa_column=Column(
            String,
            default=RequestPriority.MEDIUM,
            nullable=False,
        )
    )
    status: RequestStatus = Field(
        sa_column=Column(
            String,
            default=RequestStatus.OPEN,
            nullable=False,
        )
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
