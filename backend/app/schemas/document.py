import uuid
from pydantic import BaseModel, Field

class DocumentCreate(BaseModel):
    property_id: uuid.UUID
    unit_id: uuid.UUID | None = None
    title: str = Field(..., max_length=255)
    file_key: str = Field(..., max_length=500)
    file_type: str = Field(..., max_length=100)
