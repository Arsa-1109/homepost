"""
Storage Cleanup Failure Model (M2)

Best-effort R2 deletions that failed are recorded here for an ops sweep.
The user-facing delete response never waits on or fails because of this.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlmodel import Field, SQLModel, Column


class StorageCleanupFailure(SQLModel, table=True):
    __tablename__ = "storage_cleanup_failures"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    object_key: str = Field(
        sa_column=Column(String(500), nullable=False, index=True),
    )
    reason: str = Field(default="unknown", max_length=2000)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )
