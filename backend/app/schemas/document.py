import uuid
from datetime import datetime
from pydantic import BaseModel, Field

class DocumentCreate(BaseModel):
    property_id: uuid.UUID
    unit_id: uuid.UUID | None = None
    title: str = Field(..., max_length=255)
    file_key: str = Field(..., max_length=500)
    file_type: str = Field(..., max_length=100)

class DocumentResponse(BaseModel):
    id: uuid.UUID
    property_id: uuid.UUID
    unit_id: uuid.UUID | None = None
    uploaded_by: uuid.UUID
    title: str
    file_key: str
    file_type: str
    created_at: datetime
    file_url: str = ""

    class Config:
        from_attributes = True
