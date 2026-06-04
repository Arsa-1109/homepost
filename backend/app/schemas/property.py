import uuid
from pydantic import BaseModel, Field

class PropertyCreate(BaseModel):
    name: str = Field(..., max_length=255)
    address: str = Field(..., max_length=500)
    city: str = Field(..., max_length=100)

class PropertyUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
