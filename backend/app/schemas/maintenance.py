import uuid
from typing import Optional, List
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
