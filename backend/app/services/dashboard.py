"""
Dashboard Domain Services

Aggregation, metrics computation, and recent activity feeds for landlord dashboard.
"""

import logging
import uuid
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.invite import Invite
from app.models.maintenance_request import MaintenanceRequest
from app.models.maintenance_event import MaintenanceEvent
from app.models.document import Document
from app.models.announcement import Announcement
from app.models.user import User, UserRole
from app.schemas.activity import ActivityItem
from app.core.time import utc_now

logger = logging.getLogger(__name__)


async def fetch_dashboard_properties_and_units(session: AsyncSession, user_id: uuid.UUID):
    """
    Fetch all properties and units owned by landlord with tenant mappings.
    """
    prop_result = await session.execute(select(Property).where(Property.owner_id == user_id))
    properties = prop_result.scalars().all()
    prop_ids = [p.id for p in properties]

    if prop_ids:
        unit_result = await session.execute(select(Unit).where(Unit.property_id.in_(prop_ids)))
        all_units = unit_result.scalars().all()
    else:
        all_units = []

    unit_ids = [u.id for u in all_units]

    unit_tenant_map = {}
    if unit_ids:
        tenant_profile_result = await session.execute(
            select(TenantProfile.unit_id, User.full_name, User.email)
            .join(User, TenantProfile.user_id == User.id)
            .where(
                TenantProfile.unit_id.in_(unit_ids),
                TenantProfile.is_active == True,
            )
            .order_by(TenantProfile.created_at.desc())
        )
        for uid, full_name, email in tenant_profile_result.all():
            uid_str = str(uid)
            if uid_str not in unit_tenant_map:
                unit_tenant_map[uid_str] = full_name or email
        occupied_unit_ids = set(unit_tenant_map.keys())
    else:
        occupied_unit_ids = set()

    if unit_ids:
        invite_result = await session.execute(
            select(Invite.unit_id).where(
                Invite.unit_id.in_(unit_ids),
                Invite.status == "pending"
            )
        )
        pending_unit_ids = {str(uid) for uid in invite_result.scalars().all()}
    else:
        pending_unit_ids = set()

    return properties, prop_ids, all_units, unit_ids, unit_tenant_map, occupied_unit_ids, pending_unit_ids


async def fetch_dashboard_maintenance(session: AsyncSession, unit_ids: list[uuid.UUID]):
    """
    Fetch prioritized urgent/high open maintenance requests across landlord units.
    """
    if not unit_ids:
        return [], set()

    from sqlalchemy import case, literal
    priority_order = case(
        (MaintenanceRequest.priority == "urgent", literal(1)),
        (MaintenanceRequest.priority == "high", literal(2)),
        (MaintenanceRequest.priority == "medium", literal(3)),
        (MaintenanceRequest.priority == "low", literal(4)),
        else_=literal(5)
    )
    urgent_result = await session.execute(
        select(MaintenanceRequest)
        .where(
            MaintenanceRequest.unit_id.in_(unit_ids),
            MaintenanceRequest.status.in_(["open", "in_progress"]),
        )
        .order_by(priority_order, MaintenanceRequest.updated_at.desc(), MaintenanceRequest.created_at.desc())
    )
    urgent_requests = urgent_result.scalars().all()
    units_with_pending_maint = {str(r.unit_id) for r in urgent_requests}
    return urgent_requests, units_with_pending_maint


async def fetch_dashboard_pending_tenants(session: AsyncSession, user_id: uuid.UUID):
    """
    Fetch tenants pending approval by this landlord.
    """
    pending_result = await session.execute(
        select(User).where(
            User.requested_landlord_id == user_id,
            User.role == UserRole.TENANT_PENDING,
        )
    )
    pending_tenants = pending_result.scalars().all()
    return [
        {
            "id": str(t.id),
            "name": t.full_name or t.email,
            "email": t.email,
            "unit_label": "—",
        }
        for t in pending_tenants
    ]


async def fetch_dashboard_recent_activity(
    session: AsyncSession,
    user_id: uuid.UUID,
    unit_ids: list[uuid.UUID],
    prop_ids: list[uuid.UUID],
    unit_property_name_map: dict,
    unit_label_map: dict,
    prop_name_map: dict,
    unit_property_id_map: dict | None = None,
) -> list[ActivityItem]:
    """
    Build cross-domain activity timeline across maintenance, documents, and announcements.
    """
    activity_list = []
    if not (unit_ids and prop_ids):
        return activity_list

    if unit_property_id_map is None:
        unit_property_id_map = {}

    thirty_days_ago = utc_now() - timedelta(days=30)

    maint_events_result = await session.execute(
        select(MaintenanceEvent, MaintenanceRequest)
        .join(MaintenanceRequest, MaintenanceEvent.maintenance_request_id == MaintenanceRequest.id)
        .where(
            MaintenanceRequest.unit_id.in_(unit_ids),
            MaintenanceEvent.created_at >= thirty_days_ago,
            (MaintenanceEvent.actor_id == user_id) | (MaintenanceEvent.event_type.in_(["reopened", "status_changed"]))
        )
        .order_by(MaintenanceEvent.created_at.desc())
        .limit(10)
    )

    for event, r in maint_events_result.all():
        event_meta = r.status.value if hasattr(r.status, 'value') else str(r.status)
        if event.event_type == "reopened":
            event_meta = "reopened"

        actor = "landlord" if event.actor_id == user_id else "tenant"
        if event_meta == "closed" and actor == "landlord":
            continue

        activity_list.append(ActivityItem(
            type="maintenance_update",
            id=r.id,
            title=r.title,
            timestamp=event.created_at,
            meta=event_meta,
            actor=actor,
            property_id=unit_property_id_map.get(str(r.unit_id)),
            property_name=unit_property_name_map.get(str(r.unit_id), "Unknown Property"),
            unit_label=unit_label_map.get(str(r.unit_id), "—")
        ))

    recent_docs_result = await session.execute(
        select(Document)
        .where(Document.property_id.in_(prop_ids))
        .order_by(Document.created_at.desc())
        .limit(10)
    )

    for d in recent_docs_result.scalars().all():
        activity_list.append(ActivityItem(
            type="document_upload",
            id=d.id,
            title=d.title,
            timestamp=d.created_at,
            meta=d.file_type,
            actor="landlord",
            property_id=d.property_id,
            property_name=prop_name_map.get(str(d.property_id), "Unknown Property"),
            unit_label=unit_label_map.get(str(d.unit_id)) if d.unit_id else "All units"
        ))

    recent_anns_result = await session.execute(
        select(Announcement)
        .where(Announcement.property_id.in_(prop_ids))
        .order_by(Announcement.created_at.desc())
        .limit(10)
    )

    for a in recent_anns_result.scalars().all():
        activity_list.append(ActivityItem(
            type="announcement_posted",
            id=a.id,
            title=a.title,
            timestamp=a.created_at,
            meta="",
            actor="landlord",
            property_id=a.property_id,
            property_name=prop_name_map.get(str(a.property_id), "Unknown Property"),
            unit_label=unit_label_map.get(str(a.unit_id)) if a.unit_id else "All units"
        ))

    activity_list.sort(key=lambda x: x.timestamp, reverse=True)
    return activity_list[:5]


async def get_landlord_dashboard_data(session: AsyncSession, user_id: uuid.UUID) -> dict:
    """
    Returns unified data structure for landlord dashboard bento grid.
    """
    (
        properties, prop_ids, all_units, unit_ids,
        unit_tenant_map, occupied_unit_ids, pending_unit_ids
    ) = await fetch_dashboard_properties_and_units(session, user_id)

    urgent_requests, units_with_pending_maint = await fetch_dashboard_maintenance(session, unit_ids)
    pending_list = await fetch_dashboard_pending_tenants(session, user_id)

    unit_label_map = {str(u.id): u.unit_label for u in all_units}
    unit_property_id_map = {str(u.id): u.property_id for u in all_units}
    prop_name_map = {str(p.id): p.name for p in properties}
    unit_property_name_map = {
        str(u.id): prop_name_map.get(str(u.property_id), "Unknown Property")
        for u in all_units
    }

    activity_list = await fetch_dashboard_recent_activity(
        session, user_id, unit_ids, prop_ids,
        unit_property_name_map, unit_label_map, prop_name_map,
        unit_property_id_map
    )

    return {
        "property_stats": {
            "total_properties": len(properties),
            "total_units": len(all_units),
            "occupied_units": len(occupied_unit_ids),
            "vacant_units": len(all_units) - len(occupied_unit_ids),
        },
        "units": [
            {
                "id": str(u.id),
                "property_id": str(u.property_id),
                "property_name": prop_name_map.get(str(u.property_id), "Unknown Property"),
                "unit_label": u.unit_label,
                "is_occupied": str(u.id) in occupied_unit_ids,
                "tenant_name": unit_tenant_map.get(str(u.id)),
                "has_pending_maintenance": str(u.id) in units_with_pending_maint,
                "has_pending_invite": str(u.id) in pending_unit_ids,
                "has_pending": str(u.id) in units_with_pending_maint,
            }
            for u in all_units
        ],
        "urgent_maintenance": [
            {
                "id": str(r.id),
                "title": r.title,
                "priority": r.priority.value if hasattr(r.priority, 'value') else str(r.priority),
                "status": r.status.value if hasattr(r.status, 'value') else str(r.status),
                "property_id": str(unit_property_id_map.get(str(r.unit_id))) if unit_property_id_map.get(str(r.unit_id)) else None,
                "unit_label": unit_label_map.get(str(r.unit_id), "—"),
                "property_name": unit_property_name_map.get(str(r.unit_id), "—"),
                "created_at": r.created_at.isoformat(),
            }
            for r in urgent_requests
        ],
        "pending_approvals": pending_list,
        "recent_activity": activity_list,
    }
