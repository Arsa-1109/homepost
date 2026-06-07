import uuid
from pydantic import BaseModel, Field

class AnnouncementCreate(BaseModel):
    property_id: uuid.UUID
    unit_id: uuid.UUID | None = None
    title: str = Field(..., max_length=255)
    body: str = Field(..., max_length=5000)

class AnnouncementUpdate(BaseModel):
    unit_id: uuid.UUID | None = None
    title: str | None = Field(None, max_length=255)
    body: str | None = Field(None, max_length=5000)
