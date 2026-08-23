"""
Maintenance Domain Services

Pure business logic, state-machine validation, and event-trail generation for maintenance workflows.
"""

import logging
import uuid
from datetime import datetime, timezone
from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.maintenance_request import MaintenanceRequest, VALID_TRANSITIONS
from app.models.maintenance_event import MaintenanceEvent
from app.models.tenant_profile import TenantProfile
from app.models.user import User
from app.schemas.maintenance import MaintenanceRequestUpdate
from app.services.email import send_status_update
from app.services.storage import generate_presigned_urls_batch

logger = logging.getLogger(__name__)


async def validate_maintenance_update(
    req_in: MaintenanceRequestUpdate,
    db_req: MaintenanceRequest,
):
    """
    Validate input state transitions against valid transition rules.
    """
    if db_req.status == "closed":
        raise HTTPException(status_code=400, detail="Cannot modify a closed maintenance request.")

    status_changed = False
    priority_changed = False
    notes_changed = False
    images_changed = False
    new_image_keys: list[str] = []

    if req_in.status and req_in.status != db_req.status:
        if req_in.status not in VALID_TRANSITIONS.get(db_req.status, []):
            valid_states = [s.value for s in VALID_TRANSITIONS.get(db_req.status, [])]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status transition from '{db_req.status}' to '{req_in.status}'. "
                       f"Valid transitions are: {valid_states}",
            )
        status_changed = True

    if req_in.priority and req_in.priority != db_req.priority:
        priority_changed = True

    if req_in.landlord_notes is not None and req_in.landlord_notes != db_req.landlord_notes:
        notes_changed = True

    keys_to_update = (
        req_in.landlord_image_keys
        if req_in.landlord_image_keys is not None
        else req_in.attachments
    )
    if keys_to_update is not None:
        existing_keys = db_req.landlord_image_keys or []
        new_image_keys = [k for k in keys_to_update if k not in existing_keys]
        if keys_to_update != existing_keys:
            images_changed = True

    old_status_val: str = db_req.status.value if hasattr(db_req.status, "value") else str(db_req.status)
    old_priority_val: str = db_req.priority.value if hasattr(db_req.priority, "value") else str(db_req.priority)
    new_status_val: str = (
        (req_in.status.value if hasattr(req_in.status, "value") else str(req_in.status))
        if req_in.status else old_status_val
    )
    new_priority_val: str = (
        (req_in.priority.value if hasattr(req_in.priority, "value") else str(req_in.priority))
        if req_in.priority else old_priority_val
    )

    return (
        status_changed, priority_changed, notes_changed, images_changed,
        new_image_keys, keys_to_update, old_status_val, old_priority_val,
        new_status_val, new_priority_val
    )


async def apply_maintenance_mutations(
    session: AsyncSession,
    db_req: MaintenanceRequest,
    req_in: MaintenanceRequestUpdate,
    status_changed: bool,
    priority_changed: bool,
    notes_changed: bool,
    keys_to_update: list[str] | None,
    background_tasks: BackgroundTasks,
):
    """
    Apply validated status/priority/notes changes to DB and schedule notification.
    """
    if status_changed:
        db_req.status = req_in.status
        if req_in.status != "open":
            tenant_profile = await session.get(TenantProfile, db_req.tenant_id)
            if tenant_profile:
                tenant_user = await session.get(User, tenant_profile.user_id)
                if tenant_user and tenant_user.email:
                    background_tasks.add_task(
                        send_status_update,
                        tenant_email=tenant_user.email,
                        request_title=db_req.title,
                        new_status=req_in.status,
                    )

    if priority_changed:
        db_req.priority = req_in.priority

    if notes_changed:
        db_req.landlord_notes = req_in.landlord_notes

    if keys_to_update is not None:
        db_req.landlord_image_keys = keys_to_update

    db_req.updated_at = datetime.now(timezone.utc)
    session.add(db_req)
    await session.commit()
    await session.refresh(db_req)


async def log_maintenance_events(
    session: AsyncSession,
    db_req: MaintenanceRequest,
    user: User,
    req_in: MaintenanceRequestUpdate,
    status_changed: bool,
    priority_changed: bool,
    notes_changed: bool,
    images_changed: bool,
    new_image_keys: list[str],
    keys_to_update: list[str] | None,
    old_status_val: str,
    old_priority_val: str,
    new_status_val: str,
    new_priority_val: str,
):
    """
    Audit-log maintenance events into the timeline. Best effort.
    """
    events: list[MaintenanceEvent] = []

    if status_changed:
        payload: dict = {"old_status": old_status_val, "new_status": new_status_val}
        desc_parts = [f"Landlord changed status from {old_status_val.upper()} to {new_status_val.upper()}."]
        if notes_changed:
            payload["notes"] = req_in.landlord_notes
            desc_parts.append("Added notes.")
        if images_changed:
            payload["image_keys"] = keys_to_update
            payload["image_count"] = len(keys_to_update) if keys_to_update is not None else 0
            if new_image_keys:
                desc_parts.append(f"Attached {len(new_image_keys)} file(s).")
            else:
                desc_parts.append("Updated attached files.")
        events.append(MaintenanceEvent(
            maintenance_request_id=db_req.id,
            actor_id=user.id,
            event_type="status_changed",
            description=" ".join(desc_parts),
            payload=payload,
        ))
    else:
        if notes_changed:
            events.append(MaintenanceEvent(
                maintenance_request_id=db_req.id,
                actor_id=user.id,
                event_type="note_added",
                description="Landlord updated the resolution notes." if old_status_val else "Landlord added resolution notes.",
                payload={"notes": req_in.landlord_notes},
            ))
        if images_changed:
            events.append(MaintenanceEvent(
                maintenance_request_id=db_req.id,
                actor_id=user.id,
                event_type="images_attached",
                description=(
                    f"Landlord attached {len(new_image_keys)} resolution file(s)."
                    if new_image_keys
                    else f"Landlord updated resolution files ({len(keys_to_update) if keys_to_update else 0} attached)."
                ),
                payload={"image_count": len(keys_to_update) if keys_to_update else 0, "image_keys": keys_to_update},
            ))

    if priority_changed:
        events.append(MaintenanceEvent(
            maintenance_request_id=db_req.id,
            actor_id=user.id,
            event_type="priority_changed",
            description=f"Landlord changed priority from {old_priority_val.upper()} to {new_priority_val.upper()}.",
            payload={"old_priority": old_priority_val, "new_priority": new_priority_val},
        ))

    if events:
        for ev in events:
            session.add(ev)
        await session.commit()


async def process_maintenance_update(
    session: AsyncSession,
    db_req: MaintenanceRequest,
    user: User,
    req_in: MaintenanceRequestUpdate,
    background_tasks: BackgroundTasks,
) -> MaintenanceRequest:
    """
    Coordinate validation, mutation, and audit logging for a maintenance update.
    """
    (
        status_changed, priority_changed, notes_changed, images_changed,
        new_image_keys, keys_to_update, old_status_val, old_priority_val,
        new_status_val, new_priority_val
    ) = await validate_maintenance_update(req_in, db_req)

    try:
        await apply_maintenance_mutations(
            session, db_req, req_in, status_changed, priority_changed,
            notes_changed, keys_to_update, background_tasks
        )
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Error persisting maintenance update: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected database error occurred while updating the maintenance request. Please try again.",
        )

    try:
        await log_maintenance_events(
            session, db_req, user, req_in, status_changed, priority_changed,
            notes_changed, images_changed, new_image_keys, keys_to_update,
            old_status_val, old_priority_val, new_status_val, new_priority_val
        )
    except Exception:
        try:
            await session.rollback()
        except Exception:
            pass

    return db_req


async def fetch_maintenance_events_with_urls(
    session: AsyncSession,
    request_id: uuid.UUID,
) -> list[dict]:
    """
    Fetch maintenance events for a request and batch hydrate presigned URLs.
    """
    result = await session.execute(
        select(MaintenanceEvent, User.full_name)
        .join(User, MaintenanceEvent.actor_id == User.id)
        .where(MaintenanceEvent.maintenance_request_id == request_id)
        .order_by(MaintenanceEvent.created_at.asc())
    )

    events = []
    for event, user_name in result.all():
        data = event.model_dump()
        data["actor_name"] = user_name or "Unknown User"
        if data.get("payload") and "image_keys" in data["payload"]:
            data["payload"]["image_urls"] = await generate_presigned_urls_batch(
                data["payload"]["image_keys"]
            )
        events.append(data)

    return events
