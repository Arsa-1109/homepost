"""
Document Model

Shared documents uploaded by the landlord (lease PDFs, house rules, etc.).
The actual file is stored in Cloudflare R2; this model stores metadata
and the R2 object key.
"""

import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    property_id: uuid.UUID = Field(foreign_key="properties.id", nullable=False)
    unit_id: uuid.UUID | None = Field(default=None, foreign_key="units.id", nullable=True)
    uploaded_by: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    title: str = Field(max_length=255)
    file_key: str = Field(max_length=500)  # R2 object key
    file_type: str = Field(max_length=100)  # MIME type, e.g., "application/pdf"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
