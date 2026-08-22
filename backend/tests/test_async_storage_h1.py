"""
H1 — Event-loop blocking: synchronous boto3/Resend inside async def.

Reproduction tests written BEFORE the fix (TDD RED):
- storage/email services must expose async wrappers that run blocking
  boto3/resend work on worker threads, never the event loop.
- hydrate helpers must be coroutines using batch presigning.
- The upload endpoint must not stall the event loop while transferring.
"""

import asyncio
import inspect
import threading
import time

import pytest
from httpx import AsyncClient

from app.main import app
from app.core.database import get_session
from app.dependencies.auth import get_current_user
from app.services import email as email_service
from app.services import storage


@pytest.fixture
async def request_scoped_sessions(override_db):
    """
    Replace the shared-session test default with one session per request —
    the same topology as production — so concurrent requests don't race on a
    single AsyncSession.
    """
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from sqlmodel import SQLModel

    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    factory = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async def _per_request_session():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_session] = _per_request_session


# ---------------------------------------------------------------------------
# Storage service: async wrappers exist and execute off the event loop
# ---------------------------------------------------------------------------

async def test_upload_file_to_r2_async_runs_on_worker_thread(monkeypatch):
    seen_threads = []

    def fake_upload(file_obj, object_key, content_type=None):
        seen_threads.append(threading.current_thread())

    monkeypatch.setattr(storage, "upload_file_to_r2", fake_upload)

    await storage.upload_file_to_r2_async(None, "maintenance/k.jpg")

    assert len(seen_threads) == 1
    assert seen_threads[0] is not threading.main_thread()


async def test_batch_presign_runs_off_loop_and_preserves_order(monkeypatch):
    seen_threads = []
    lock = threading.Lock()

    def fake_presign(key, expires=900, filename=None):
        with lock:
            seen_threads.append(threading.current_thread())
        return f"https://r2.mocked.com/{key}"

    monkeypatch.setattr(storage, "generate_presigned_download_url", fake_presign)

    urls = await storage.generate_presigned_urls_batch(["a", "b", "c"])

    assert urls == [
        "https://r2.mocked.com/a",
        "https://r2.mocked.com/b",
        "https://r2.mocked.com/c",
    ]
    assert all(t is not threading.main_thread() for t in seen_threads)


async def test_batch_presign_skips_failed_keys(monkeypatch):
    def flaky_presign(key, expires=900, filename=None):
        if key == "bad":
            raise RuntimeError("signing failure")
        return f"https://r2.mocked.com/{key}"

    monkeypatch.setattr(storage, "generate_presigned_download_url", flaky_presign)

    urls = await storage.generate_presigned_urls_batch(["good", "bad"])

    assert urls == ["https://r2.mocked.com/good"]


async def test_hydrate_helpers_are_coroutines(monkeypatch):
    monkeypatch.setattr(
        storage,
        "generate_presigned_download_url",
        lambda key, expires=900, filename=None: f"https://r2.mocked.com/{key}",
    )

    class FakeRequest:
        image_keys = ["m1.jpg"]
        landlord_image_keys = ["l1.jpg"]

    class FakeAnnouncement:
        attachment_keys = ["a1.pdf"]

    req_resp = storage.__dict__  # ensure module loaded

    hydrated_req = type("R", (), {"image_urls": None, "landlord_image_urls": None})()
    hydrated_ann = type("A", (), {"attachment_urls": None})()

    assert inspect.iscoroutinefunction(storage.hydrate_maintenance_request)
    assert inspect.iscoroutinefunction(storage.hydrate_announcement)

    await storage.hydrate_maintenance_request(FakeRequest(), hydrated_req)
    await storage.hydrate_announcement(FakeAnnouncement(), hydrated_ann)

    assert hydrated_req.image_urls == ["https://r2.mocked.com/m1.jpg"]
    assert hydrated_req.landlord_image_urls == ["https://r2.mocked.com/l1.jpg"]
    assert hydrated_ann.attachment_urls == ["https://r2.mocked.com/a1.pdf"]


async def test_slow_upload_does_not_block_event_loop(client: AsyncClient, seed_data, monkeypatch, request_scoped_sessions):
    """While an R2 transfer blocks its calling thread, /health must stay responsive.

    Pre-fix the transfer runs ON the event loop, so /health times out.
    """
    transfer_started = threading.Event()
    release = threading.Event()

    def slow_upload(file_obj, object_key, content_type=None):
        transfer_started.set()
        if release.wait(timeout=10) is False:
            raise RuntimeError("transfer was never released")

    from app.routers import uploads as uploads_router
    monkeypatch.setattr(storage, "upload_file_to_r2", slow_upload)
    monkeypatch.setattr(uploads_router, "upload_file_to_r2", slow_upload)
    user = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        upload_task = asyncio.create_task(
            client.post(
                "/api/v1/uploads/",
                data={"prefix": "maintenance"},
                files={"file": ("x.png", b"\x89PNG\r\n\x1a\nfake image bytes", "image/png")},
            )
        )

        # Wait until the transfer has actually begun.
        deadline = time.perf_counter() + 5
        while not transfer_started.is_set() and time.perf_counter() < deadline:
            await asyncio.sleep(0.005)
        assert transfer_started.is_set(), "Upload never started"

        # The loop must remain responsive WHILE the transfer is parked.
        tick_start = time.perf_counter()
        health_resp = await asyncio.wait_for(client.get("/health"), timeout=2.0)
        tick_elapsed_ms = (time.perf_counter() - tick_start) * 1000

        release.set()
        upload_resp = await asyncio.wait_for(upload_task, timeout=10.0)

        assert health_resp.status_code == 200
        assert tick_elapsed_ms < 1000, (
            f"/health took {tick_elapsed_ms:.0f}ms — event loop blocked by sync upload"
        )
        assert upload_resp.status_code == 200
    finally:
        release.set()
        app.dependency_overrides.pop(get_current_user, None)


async def test_concurrent_uploads_run_simultaneously(client: AsyncClient, seed_data, monkeypatch, request_scoped_sessions):
    """Two simultaneous uploads must overlap (barrier requires BOTH in flight).

    Pre-fix the transfers serialize on the event loop: neither can satisfy the
    barrier alone, so requests fail instead of completing one-by-one.
    """
    barrier = threading.Barrier(2, timeout=5)

    def overlapping_upload(file_obj, object_key, content_type=None):
        try:
            barrier.wait(timeout=5)
        except threading.BrokenBarrierError:
            raise RuntimeError("transfers did not overlap")

    from app.routers import uploads as uploads_router
    monkeypatch.setattr(storage, "upload_file_to_r2", overlapping_upload)
    monkeypatch.setattr(uploads_router, "upload_file_to_r2", overlapping_upload)
    user = seed_data["landlord"]
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        tasks = [
            asyncio.create_task(
                client.post(
                    "/api/v1/uploads/",
                    data={"prefix": "maintenance"},
                    files={"file": (f"f{i}.png", b"\x89PNG\r\n\x1a\nfake image bytes", "image/png")},
                )
            )
            for i in range(2)
        ]
        responses = await asyncio.wait_for(asyncio.gather(*tasks), timeout=15.0)
        assert all(r.status_code == 200 for r in responses), [
            r.status_code for r in responses
        ]
    finally:
        barrier.abort()
        app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# Email service: async send wrapper
# ---------------------------------------------------------------------------

async def test_send_email_async_runs_on_worker_thread(monkeypatch):
    from app.services import email as email_mod

    seen_threads = []

    def fake_send(to, subject, html_body):
        seen_threads.append(threading.current_thread())

    monkeypatch.setattr(email_mod, "_send_email", fake_send)

    await email_mod.send_email_async("t@example.com", "s", "<p>b</p>")

    assert len(seen_threads) == 1
    assert seen_threads[0] is not threading.main_thread()


async def test_reminder_email_functions_have_async_variants(monkeypatch):
    from app.services import email as email_mod

    sent = []

    def fake_send(to, subject, html_body):
        sent.append((to, subject))

    monkeypatch.setattr(email_mod, "_send_email", fake_send)

    assert inspect.iscoroutinefunction(email_mod.send_rent_reminder_async)
    assert inspect.iscoroutinefunction(email_mod.send_lease_expiry_reminder_async)

    await email_mod.send_rent_reminder_async("t@example.com", "Unit 4B", 5)
    await email_mod.send_lease_expiry_reminder_async("t@example.com", "Unit 4B", 30)

    subjects = [s for _, s in sent]
    assert any("Rent Reminder" in s for s in subjects)
    assert any("Lease Expiry" in s for s in subjects)
