import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class UnitCreate(BaseModel):
    property_id: uuid.UUID
    unit_label: str = Field(..., max_length=100)
    rent_due_day: int = Field(default=1, ge=1, le=31)
    lease_start: date | None = None
    lease_end: date | None = None

class UnitUpdate(BaseModel):
    unit_label: str | None = Field(None, max_length=100)
    rent_due_day: int | None = Field(None, ge=1, le=31)
    lease_start: date | None = None
    lease_end: date | None = None

class UnitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    unit_label: str
    rent_due_day: int
    lease_start: date | None = None
    lease_end: date | None = None
    status: str
    created_at: datetime
    is_occupied: bool = False
    has_pending: bool = False

