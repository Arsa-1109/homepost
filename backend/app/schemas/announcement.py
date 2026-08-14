import uuid
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class AnnouncementCreate(BaseModel):
    property_id: uuid.UUID
    unit_id: uuid.UUID | None = None
    title: str = Field(..., max_length=255)
    body: str = Field(..., max_length=5000)
    attachment_keys: list[str] | None = None

class AnnouncementUpdate(BaseModel):
    unit_id: uuid.UUID | None = None
    title: str | None = Field(None, max_length=255)
    body: str | None = Field(None, max_length=5000)
    attachment_keys: list[str] | None = None

class AnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    unit_id: uuid.UUID | None = None
    author_id: uuid.UUID
    title: str
    body: str
    attachment_keys: list[str] | None = None
    attachment_urls: list[str] = Field(default_factory=list)
    created_at: datetime
