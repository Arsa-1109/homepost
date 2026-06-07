import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict

class ActivityItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    type: Literal["maintenance_update", "document_upload"]
    id: uuid.UUID
    title: str
    timestamp: datetime
    meta: Optional[str] = None
