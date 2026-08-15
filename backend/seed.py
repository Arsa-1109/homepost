#!/usr/bin/env python3
"""
HomePost Database Seeder CLI

Populates realistic sample data for demo presentations and testing:
- 1 Demo Landlord
- 2 Properties (Maplewood Heights, Sunset Vista Apartments)
- 4 Units (2 Occupied, 2 Vacant)
- 2 Mock Tenants with active TenantProfiles
- 3 Maintenance Tickets across (open, in_progress, resolved) with full MaintenanceEvents timeline
- 3 Announcements (property-wide and unit-specific)

Usage:
  python seed.py                  # Idempotent seed (skips if demo data exists)
  python seed.py --clean          # Cleans old demo data before seeding
  python seed.py --reset          # Alias for --clean
  python seed.py --help           # Display options
"""

import argparse
import asyncio
from datetime import date, datetime, timedelta, timezone
import sys
from typing import Optional
import uuid

# Ensure UTF-8 output across Windows, Linux, and macOS consoles
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

from app.core.database import async_session_maker, engine
from app.models.announcement import Announcement
from app.models.document import Document
from app.models.invite import Invite
from app.models.maintenance_event import MaintenanceEvent
from app.models.maintenance_request import (
    MaintenanceRequest,
    RequestPriority,
    RequestStatus,
)
from app.models.property import Property
from app.models.tenant_profile import TenantProfile
from app.models.unit import Unit
from app.models.user import User, UserRole


# Default identifiers for demo users to maintain idempotency
DEFAULT_LANDLORD_CLERK_ID = "user_demo_landlord_001"
DEFAULT_LANDLORD_EMAIL = "landlord@homepost.demo"

DEFAULT_TENANT_1_CLERK_ID = "user_demo_tenant_001"
DEFAULT_TENANT_1_EMAIL = "sarah.jenkins@demo.homepost.io"

DEFAULT_TENANT_2_CLERK_ID = "user_demo_tenant_002"
DEFAULT_TENANT_2_EMAIL = "alex.rivera@demo.homepost.io"


async def clean_database(session: AsyncSession) -> None:
    """
    Safely deletes all records across all tables in reverse dependency order.
    Ensures compatibility with both SQLite and PostgreSQL foreign key constraints.
    """
    print("[CLEAN] Cleaning existing database records...")
    # Delete children before parents
    await session.execute(delete(MaintenanceEvent))
    await session.execute(delete(MaintenanceRequest))
    await session.execute(delete(Announcement))
    await session.execute(delete(Document))
    await session.execute(delete(Invite))
    await session.execute(delete(TenantProfile))
    await session.execute(delete(Unit))
    await session.execute(delete(Property))
    await session.execute(delete(User))
    await session.commit()
    print("[CLEAN] Database tables cleaned successfully.")


async def _run_seed(
    session: AsyncSession,
    landlord_clerk_id: str,
    landlord_email: str,
    clean_first: bool,
) -> None:
    if clean_first:
        await clean_database(session)
    else:
        # Check if demo landlord already exists for idempotency
        existing_user = (
            await session.execute(
                select(User).where(User.clerk_id == landlord_clerk_id)
            )
        ).scalars().first()

        if existing_user:
            print(
                f"[INFO] Demo landlord '{landlord_clerk_id}' already exists. "
                "Use '--clean' or '--reset' to wipe and re-seed."
            )
            return

    now = datetime.now(timezone.utc)
    print("[SEED] Seeding HomePost demo database...")

    # -------------------------------------------------------------------
    # 1. Create Users (1 Landlord, 2 Mock Tenants)
    # -------------------------------------------------------------------
    landlord = User(
        id=uuid.uuid4(),
        clerk_id=landlord_clerk_id,
        email=landlord_email,
        full_name="Marcus Vance (Demo Landlord)",
        role=UserRole.LANDLORD,
        created_at=now - timedelta(days=90),
        updated_at=now - timedelta(days=90),
    )
    session.add(landlord)

    tenant1 = User(
        id=uuid.uuid4(),
        clerk_id=DEFAULT_TENANT_1_CLERK_ID,
        email=DEFAULT_TENANT_1_EMAIL,
        full_name="Sarah Jenkins",
        role=UserRole.TENANT,
        created_at=now - timedelta(days=60),
        updated_at=now - timedelta(days=60),
    )
    session.add(tenant1)

    tenant2 = User(
        id=uuid.uuid4(),
        clerk_id=DEFAULT_TENANT_2_CLERK_ID,
        email=DEFAULT_TENANT_2_EMAIL,
        full_name="Alex Rivera",
        role=UserRole.TENANT,
        created_at=now - timedelta(days=45),
        updated_at=now - timedelta(days=45),
    )
    session.add(tenant2)
    await session.flush()

    # -------------------------------------------------------------------
    # 2. Create 2 Properties
    # -------------------------------------------------------------------
    prop1 = Property(
        id=uuid.uuid4(),
        owner_id=landlord.id,
        name="Maplewood Heights",
        address="742 Evergreen Terrace",
        city="Austin",
        created_at=now - timedelta(days=90),
    )
    session.add(prop1)

    prop2 = Property(
        id=uuid.uuid4(),
        owner_id=landlord.id,
        name="Sunset Vista Apartments",
        address="1200 Pacific Coast Hwy",
        city="San Diego",
        created_at=now - timedelta(days=75),
    )
    session.add(prop2)
    await session.flush()

    # -------------------------------------------------------------------
    # 3. Create 4 Units (2 per property)
    # -------------------------------------------------------------------
    # Maplewood Heights Units
    unit101 = Unit(
        id=uuid.uuid4(),
        property_id=prop1.id,
        unit_label="Unit 101",
        rent_due_day=1,
        lease_start=date(2026, 1, 1),
        lease_end=date(2027, 1, 1),
        status="Occupied",
        created_at=now - timedelta(days=90),
    )
    unit102 = Unit(
        id=uuid.uuid4(),
        property_id=prop1.id,
        unit_label="Unit 102",
        rent_due_day=5,
        lease_start=None,
        lease_end=None,
        status="Vacant",
        created_at=now - timedelta(days=90),
    )

    # Sunset Vista Units
    unit2a = Unit(
        id=uuid.uuid4(),
        property_id=prop2.id,
        unit_label="Unit 2A",
        rent_due_day=1,
        lease_start=date(2026, 3, 1),
        lease_end=date(2027, 3, 1),
        status="Occupied",
        created_at=now - timedelta(days=75),
    )
    unit2b = Unit(
        id=uuid.uuid4(),
        property_id=prop2.id,
        unit_label="Unit 2B",
        rent_due_day=15,
        lease_start=None,
        lease_end=None,
        status="Vacant",
        created_at=now - timedelta(days=75),
    )
    session.add_all([unit101, unit102, unit2a, unit2b])
    await session.flush()

    # -------------------------------------------------------------------
    # 4. Create Tenant Profiles
    # -------------------------------------------------------------------
    t1_profile = TenantProfile(
        id=uuid.uuid4(),
        user_id=tenant1.id,
        unit_id=unit101.id,
        lease_start=date(2026, 1, 1),
        lease_end=date(2027, 1, 1),
        is_active=True,
        created_at=now - timedelta(days=60),
    )
    t2_profile = TenantProfile(
        id=uuid.uuid4(),
        user_id=tenant2.id,
        unit_id=unit2a.id,
        lease_start=date(2026, 3, 1),
        lease_end=date(2027, 3, 1),
        is_active=True,
        created_at=now - timedelta(days=45),
    )
    session.add_all([t1_profile, t2_profile])
    await session.flush()

    # -------------------------------------------------------------------
    # 5. Create 3 Maintenance Requests across open / in_progress / resolved
    # -------------------------------------------------------------------
    # Request 1: Open state (Unit 101)
    req_open = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=t1_profile.id,
        unit_id=unit101.id,
        title="Leaking kitchen sink pipe",
        description="Noticeable water pooling under the kitchen sink cabinet after running the faucet for more than a minute. P-trap joint appears loose.",
        image_keys=["maintenance/demo/sink_leak_1.jpg"],
        priority=RequestPriority.HIGH,
        status=RequestStatus.OPEN,
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(days=2),
    )
    session.add(req_open)
    await session.flush()

    event1_created = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req_open.id,
        actor_id=tenant1.id,
        event_type="created",
        description="Maintenance ticket submitted by tenant.",
        payload={"initial_status": "open", "priority": "high"},
        created_at=now - timedelta(days=2),
    )
    session.add(event1_created)

    # Request 2: In-Progress state (Unit 2A)
    req_progress = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=t2_profile.id,
        unit_id=unit2a.id,
        title="HVAC blowing warm air",
        description="Thermostat is set to 70°F but central vents are only blowing ambient/warm air. Indoor temperature is currently 82°F.",
        image_keys=["maintenance/demo/thermostat.jpg"],
        landlord_notes="Apex Heating & Air dispatched. Technician scheduled for Monday at 10:00 AM.",
        priority=RequestPriority.URGENT,
        status=RequestStatus.IN_PROGRESS,
        created_at=now - timedelta(days=4),
        updated_at=now - timedelta(days=1),
    )
    session.add(req_progress)
    await session.flush()

    event2_created = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req_progress.id,
        actor_id=tenant2.id,
        event_type="created",
        description="Maintenance ticket submitted by tenant.",
        payload={"initial_status": "open", "priority": "urgent"},
        created_at=now - timedelta(days=4),
    )
    event2_status = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req_progress.id,
        actor_id=landlord.id,
        event_type="status_changed",
        description="Status changed from open to in_progress.",
        payload={"old_status": "open", "new_status": "in_progress"},
        created_at=now - timedelta(days=1, hours=4),
    )
    event2_note = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req_progress.id,
        actor_id=landlord.id,
        event_type="note_added",
        description="Landlord note added: Apex Heating & Air dispatched. Technician scheduled for Monday at 10:00 AM.",
        created_at=now - timedelta(days=1),
    )
    session.add_all([event2_created, event2_status, event2_note])

    # Request 3: Resolved state (Unit 101)
    req_resolved = MaintenanceRequest(
        id=uuid.uuid4(),
        tenant_id=t1_profile.id,
        unit_id=unit101.id,
        title="Broken balcony door latch",
        description="The sliding glass door latch does not catch securely when locked.",
        image_keys=["maintenance/demo/door_latch.jpg"],
        landlord_notes="Replaced the strike plate and lubricated tracks. Tested lock mechanism successfully.",
        landlord_image_keys=["maintenance/demo/door_latch_fixed.jpg"],
        priority=RequestPriority.LOW,
        status=RequestStatus.RESOLVED,
        created_at=now - timedelta(days=10),
        updated_at=now - timedelta(days=3),
    )
    session.add(req_resolved)
    await session.flush()

    event3_created = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req_resolved.id,
        actor_id=tenant1.id,
        event_type="created",
        description="Maintenance ticket submitted by tenant.",
        payload={"initial_status": "open", "priority": "low"},
        created_at=now - timedelta(days=10),
    )
    event3_progress = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req_resolved.id,
        actor_id=landlord.id,
        event_type="status_changed",
        description="Status changed from open to in_progress.",
        payload={"old_status": "open", "new_status": "in_progress"},
        created_at=now - timedelta(days=7),
    )
    event3_resolved = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req_resolved.id,
        actor_id=landlord.id,
        event_type="status_changed",
        description="Status changed from in_progress to resolved.",
        payload={"old_status": "in_progress", "new_status": "resolved"},
        created_at=now - timedelta(days=3),
    )
    event3_note = MaintenanceEvent(
        id=uuid.uuid4(),
        maintenance_request_id=req_resolved.id,
        actor_id=landlord.id,
        event_type="note_added",
        description="Landlord note added: Replaced the strike plate and lubricated tracks. Tested lock mechanism successfully.",
        created_at=now - timedelta(days=3),
    )
    session.add_all([event3_created, event3_progress, event3_resolved, event3_note])

    # -------------------------------------------------------------------
    # 6. Create Announcements (Property-wide & Unit-specific)
    # -------------------------------------------------------------------
    announcement1 = Announcement(
        id=uuid.uuid4(),
        property_id=prop1.id,
        unit_id=None,
        author_id=landlord.id,
        title="Annual Fire Alarm & Sprinkler Testing",
        body="Dear residents, the city fire department will be conducting annual audible alarm testing this Thursday between 10:00 AM and 2:00 PM. No action is required on your part.",
        attachment_keys=None,
        created_at=now - timedelta(days=5),
    )
    announcement2 = Announcement(
        id=uuid.uuid4(),
        property_id=prop2.id,
        unit_id=None,
        author_id=landlord.id,
        title="Community Courtyard Deep Cleaning & Landscaping",
        body="The community courtyard and pool deck will be power-washed on Friday morning. Please keep personal items inside balconies.",
        attachment_keys=None,
        created_at=now - timedelta(days=3),
    )
    announcement3 = Announcement(
        id=uuid.uuid4(),
        property_id=prop1.id,
        unit_id=unit101.id,
        author_id=landlord.id,
        title="Scheduled Plumbing Riser Inspection (Unit 101)",
        body="Plumbing inspection for Unit 101 is scheduled for tomorrow at 2:00 PM to verify line pressure following building maintenance.",
        attachment_keys=None,
        created_at=now - timedelta(days=1),
    )
    session.add_all([announcement1, announcement2, announcement3])

    # -------------------------------------------------------------------
    # Commit transaction
    # -------------------------------------------------------------------
    await session.commit()

    print("----------------------------------------------------------------")
    print("[SUCCESS] HomePost Database Seeded Successfully!")
    print("----------------------------------------------------------------")
    print(f"  Landlord:       {landlord.full_name} ({landlord.email})")
    print(f"  Properties:     2 ([1] {prop1.name}, [2] {prop2.name})")
    print(f"  Units:          4 (2 Occupied: Unit 101, Unit 2A | 2 Vacant: Unit 102, Unit 2B)")
    print(f"  Tenants:        2 ({tenant1.full_name}, {tenant2.full_name})")
    print(f"  Maintenance:    3 Tickets (1 Open, 1 In-Progress, 1 Resolved) with 8 events")
    print(f"  Announcements:  3 (2 Property-wide, 1 Unit-specific)")
    print("----------------------------------------------------------------")


async def seed_data(
    landlord_clerk_id: str = DEFAULT_LANDLORD_CLERK_ID,
    landlord_email: str = DEFAULT_LANDLORD_EMAIL,
    clean_first: bool = False,
    session: Optional[AsyncSession] = None,
) -> None:
    """
    Seeds demo data into the configured database.
    If session is passed, uses that session directly (ideal for unit testing).
    Otherwise, creates tables if needed and manages its own session from the engine.
    """
    if session is not None:
        await _run_seed(
            session=session,
            landlord_clerk_id=landlord_clerk_id,
            landlord_email=landlord_email,
            clean_first=clean_first,
        )
    else:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)

        async with async_session_maker() as new_session:
            await _run_seed(
                session=new_session,
                landlord_clerk_id=landlord_clerk_id,
                landlord_email=landlord_email,
                clean_first=clean_first,
            )


def parse_args():
    parser = argparse.ArgumentParser(
        description="HomePost Turnkey Database Seeder CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--clean",
        "--reset",
        dest="clean",
        action="store_true",
        help="Wipe existing records before seeding fresh demo data.",
    )
    parser.add_argument(
        "--landlord-clerk-id",
        type=str,
        default=DEFAULT_LANDLORD_CLERK_ID,
        help="Clerk User ID for the primary demo landlord.",
    )
    parser.add_argument(
        "--landlord-email",
        type=str,
        default=DEFAULT_LANDLORD_EMAIL,
        help="Email address for the primary demo landlord.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    try:
        asyncio.run(
            seed_data(
                landlord_clerk_id=args.landlord_clerk_id,
                landlord_email=args.landlord_email,
                clean_first=args.clean,
            )
        )
    except KeyboardInterrupt:
        print("\n[ABORT] Seeding cancelled by user.")
        sys.exit(1)
    except Exception as exc:
        print(f"\n[ERROR] Seeding failed with error: {exc}", file=sys.stderr)
        raise exc


if __name__ == "__main__":
    main()
