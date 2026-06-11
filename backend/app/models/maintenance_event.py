"""
Maintenance Event Model

Tracks the history/timeline of actions taken on a maintenance request.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column
from sqlalchemy.types import JSON
from sqlmodel import Field, SQLModel, Relationship


class MaintenanceEvent(SQLModel, table=True):
    __tablename__ = "maintenance_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    maintenance_request_id: uuid.UUID = Field(foreign_key="maintenance_requests.id", nullable=False)
    
    # ID of the user (tenant or landlord) who triggered the event
    actor_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    
    # Type of event (e.g., "created", "status_changed", "note_added", "images_attached", "reopened")
    event_type: str = Field(nullable=False)
    
    # Human-readable summary of what happened
    description: str = Field(nullable=False)
    
    # Optional structured payload for UI to render specific elements (like before/after states)
    payload: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationship to the parent request
    # Note: We use string references to avoid circular imports.
    # The parent model MaintenanceRequest will also need to be updated.
