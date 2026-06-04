import uuid
from pydantic import BaseModel, Field

class UnitCreate(BaseModel):
    property_id: uuid.UUID
    unit_label: str = Field(..., max_length=100)
    rent_due_day: int = Field(default=1, ge=1, le=31)

class UnitUpdate(BaseModel):
    unit_label: str | None = Field(None, max_length=100)
    rent_due_day: int | None = Field(None, ge=1, le=31)
