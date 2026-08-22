"""
Upload Quota Model

Tracks per-user daily upload counts to cap storage abuse (audit finding H2).
One row per (user, UTC day); the composite primary key makes the upsert
race-safe under concurrent uploads.
"""

import uuid
from datetime import date

from sqlmodel import Field, SQLModel


class UploadQuota(SQLModel, table=True):
    __tablename__ = "upload_quota"

    user_id: uuid.UUID = Field(primary_key=True, foreign_key="users.id")
    day_utc: date = Field(primary_key=True)
    count: int = Field(default=0, nullable=False)
