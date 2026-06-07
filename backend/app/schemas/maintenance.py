import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.maintenance_request import RequestPriority, RequestStatus

class MaintenanceRequestCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str = Field(..., max_length=2000)
    priority: RequestPriority = Field(default=RequestPriority.MEDIUM)
    image_keys: Optional[List[str]] = Field(default=None, max_items=3)

class MaintenanceRequestUpdate(BaseModel):
    status: RequestStatus | None = None
    priority: RequestPriority | None = None
    landlord_notes: str | None = None
    landlord_image_keys: Optional[List[str]] = Field(default=None, max_items=3)

class MaintenanceRequestResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    unit_id: uuid.UUID
    property_name: Optional[str] = None
    unit_label: Optional[str] = None
    title: str
    description: str
    image_keys: Optional[List[str]] = None
    image_urls: List[str] = []
    priority: RequestPriority
    status: RequestStatus
    landlord_notes: Optional[str] = None
    landlord_image_keys: Optional[List[str]] = None
    landlord_image_urls: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
