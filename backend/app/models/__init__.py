"""
Model Registry

Import all SQLModel table classes here so that:
1. Alembic can discover them for auto-generating migrations.
2. Other modules can import from a single location.
"""

from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.maintenance_request import (
    MaintenanceRequest,
    RequestStatus,
    RequestPriority,
    VALID_TRANSITIONS,
)
from app.models.maintenance_event import MaintenanceEvent
from app.models.announcement import Announcement
from app.models.document import Document
from app.models.invite import Invite, InviteStatus

__all__ = [
    "User",
    "UserRole",
    "Property",
    "Unit",
    "TenantProfile",
    "MaintenanceRequest",
    "RequestStatus",
    "RequestPriority",
    "VALID_TRANSITIONS",
    "Announcement",
    "Document",
    "Invite",
    "InviteStatus",
    "MaintenanceEvent",
]
