from typing import List
from app.models.property import Property
from app.models.unit import Unit
from app.models.maintenance_request import MaintenanceRequest
from app.models.announcement import Announcement
from app.schemas.activity import ActivityItem

__all__ = [
    "Property",
    "Unit",
    "MaintenanceRequest",
    "Announcement",
    "ActivityItem"
]
