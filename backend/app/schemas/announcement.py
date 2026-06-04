import uuid
from pydantic import BaseModel, Field

class AnnouncementCreate(BaseModel):
    property_id: uuid.UUID
    title: str = Field(..., max_length=255)
    body: str = Field(..., max_length=5000)

class AnnouncementUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    body: str | None = Field(None, max_length=5000)
