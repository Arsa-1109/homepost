import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.main import app
from app.core.database import get_session
from app.dependencies.auth import (
    get_current_user,
    get_current_landlord,
    get_current_tenant_profile,
    get_active_tenant_profile,
)
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.tenant_profile import TenantProfile
from app.models.invite import Invite, InviteStatus
from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority
from app.models.announcement import Announcement
from app.models.document import Document

# In-memory async SQLite engine for lightning-fast, isolated tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestSessionLocal = sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test and drop them after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yields an isolated database session per test."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture(autouse=True)
def override_db(db_session: AsyncSession):
    """Overrides the FastAPI get_session dependency with the test db_session."""
    async def _get_test_session():
        yield db_session

    app.dependency_overrides[get_session] = _get_test_session
    yield
    app.dependency_overrides.pop(get_session, None)


@pytest.fixture(autouse=True)
def disable_rate_limiter():
    """Disables slowapi rate limiting during test executions."""
    from app.core.limiter import limiter
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture
def mock_storage(monkeypatch):
    """Mocks R2 storage uploads and downloads."""
    from app.services import storage
    from app.routers import uploads

    fake_download = lambda key, expires=900, filename=None: f"https://r2.mocked.com/{key}"
    monkeypatch.setattr(storage, "upload_file_to_r2", lambda *args, **kwargs: None)
    monkeypatch.setattr(storage, "generate_presigned_download_url", fake_download)
    monkeypatch.setattr(uploads, "upload_file_to_r2", lambda *args, **kwargs: None)
    monkeypatch.setattr(uploads, "generate_presigned_download_url", fake_download)


@pytest.fixture
def mock_emails(monkeypatch):
    """Mocks Resend transactional email calls and tracks dispatches."""
    from app.services import email

    sent_emails = []

    def fake_send(to, subject, html):
        sent_emails.append({"to": to, "subject": subject, "html": html})

    monkeypatch.setattr(email, "_send_email", fake_send)
    return sent_emails


@pytest.fixture
async def seed_data(db_session: AsyncSession):
    """Seeds standard test entities for landlord, tenant, property, and unit."""
    # Landlord user
    landlord = User(
        id=uuid.uuid4(),
        clerk_id="clerk_landlord_123",
        email="landlord@homepost.dev",
        full_name="Alice Landlord",
        role=UserRole.LANDLORD,
    )
    # Tenant user
    tenant = User(
        id=uuid.uuid4(),
        clerk_id="clerk_tenant_456",
        email="tenant@homepost.dev",
        full_name="Bob Tenant",
        role=UserRole.TENANT,
    )
    # Unassigned user
    unassigned = User(
        id=uuid.uuid4(),
        clerk_id="clerk_unassigned_789",
        email="newuser@homepost.dev",
        full_name="Charlie Unassigned",
        role=UserRole.UNASSIGNED,
    )

    db_session.add(landlord)
    db_session.add(tenant)
    db_session.add(unassigned)
    await db_session.commit()

    # Property
    prop = Property(
        id=uuid.uuid4(),
        owner_id=landlord.id,
        name="Oakview Residency",
        address="123 Oak St",
        city="Varanasi",
    )
    db_session.add(prop)
    await db_session.commit()

    # Unit
    unit = Unit(
        id=uuid.uuid4(),
        property_id=prop.id,
        unit_label="Unit 4B",
        rent_due_day=5,
    )
    db_session.add(unit)
    await db_session.commit()

    # Tenant Profile
    profile = TenantProfile(
        id=uuid.uuid4(),
        user_id=tenant.id,
        unit_id=unit.id,
        is_active=True,
    )
    db_session.add(profile)
    await db_session.commit()

    return {
        "landlord": landlord,
        "tenant": tenant,
        "unassigned": unassigned,
        "property": prop,
        "unit": unit,
        "unit_101": unit,
        "profile": profile,
    }


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
