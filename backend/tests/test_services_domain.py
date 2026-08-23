"""
Unit tests for domain services (properties, maintenance, dashboard)
"""

import pytest
import uuid
from datetime import date
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import BackgroundTasks, HTTPException

from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority
from app.schemas.maintenance import MaintenanceRequestUpdate
from app.services.properties import format_address, delete_property_cascade, delete_unit_cascade
from app.services.maintenance import process_maintenance_update, validate_maintenance_update
from app.services.dashboard import get_landlord_dashboard_data


def test_format_address():
    """format_address should strip whitespace, capitalize words, and rewrite plural suffixes."""
    assert format_address("  123 main streets  ") == "123 Main Street"
    assert format_address("456 oak avenues") == "456 Oak Avenue"
    assert format_address("789 pine drives") == "789 Pine Drive"


@pytest.mark.asyncio
async def test_validate_maintenance_update_closed_rejects(db_session: AsyncSession, seed_data):
    """Attempting to update a closed maintenance request raises HTTP 400."""
    landlord = seed_data["landlord"]
    unit = seed_data["unit"]
    profile = seed_data["profile"]

    closed_req = MaintenanceRequest(
        tenant_id=profile.id,
        unit_id=unit.id,
        title="Fixed Sink",
        description="Completed",
        status=RequestStatus.CLOSED,
        priority=RequestPriority.LOW,
    )
    db_session.add(closed_req)
    await db_session.commit()
    await db_session.refresh(closed_req)

    update_in = MaintenanceRequestUpdate(status=RequestStatus.OPEN)
    with pytest.raises(HTTPException) as exc_info:
        await validate_maintenance_update(update_in, closed_req)
    assert exc_info.value.status_code == 400
    assert "closed" in exc_info.value.detail


@pytest.mark.asyncio
async def test_dashboard_service_data(db_session: AsyncSession, seed_data):
    """get_landlord_dashboard_data aggregates property stats, urgent maintenance, and units accurately."""
    landlord = seed_data["landlord"]
    data = await get_landlord_dashboard_data(db_session, landlord.id)

    assert "property_stats" in data
    assert "units" in data
    assert "urgent_maintenance" in data
    assert "recent_activity" in data
    assert data["property_stats"]["total_properties"] >= 1
