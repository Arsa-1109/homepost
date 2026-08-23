"""
M10 — Centralized timezone-aware UTC handling.

app/core/time.py exposes utc_now() (aware) and as_aware_utc() (normalizes
naive reads from SQLite). All expiry comparisons compare aware-to-aware.
The grep guard fails while naive utcnow()/replace(tzinfo=None) sites remain
outside core/time.py.
"""

from datetime import datetime, timedelta, timezone

import pytest


def test_utc_now_returns_aware_utc():
    from app.core.time import utc_now

    now = utc_now()
    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_as_aware_utc_normalizes_naive_datetime():
    """SQLite returns naive datetimes; reads must be normalized to aware UTC."""
    from app.core.time import as_aware_utc

    naive = datetime(2026, 8, 22, 12, 0, 0)
    aware = as_aware_utc(naive)
    assert aware.tzinfo is not None
    assert aware.utcoffset() == timedelta(0)
    assert aware.replace(tzinfo=None) == naive


def test_as_aware_utc_passes_through_already_aware():
    from app.core.time import as_aware_utc

    aware = datetime(2026, 8, 22, 12, 0, 0, tzinfo=timezone.utc)
    assert as_aware_utc(aware) is aware


def test_invite_expiry_comparison_mixed_awareness():
    """
    Regression for M10: an invite written with a naive expires_at (legacy rows
    / SQLite round-trip) must still compare correctly against utc_now().
    """
    from app.core.time import as_aware_utc, utc_now

    # Expired one hour ago, stored naive
    expired_naive = (utc_now() - timedelta(hours=1)).replace(tzinfo=None)
    assert as_aware_utc(expired_naive) < utc_now()

    # Expires in one hour, stored naive
    valid_naive = (utc_now() + timedelta(hours=1)).replace(tzinfo=None)
    assert as_aware_utc(valid_naive) > utc_now()


def test_no_naive_utcnow_or_tzinfo_none_outside_core_time():
    """grep guard: naive-UTC idioms may exist only inside app/core/time.py."""
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parents[1]
    offenders = []
    for path in sorted((backend_dir / "app").rglob("*.py")):
        if path.as_posix().endswith("app/core/time.py"):
            continue
        for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if "utcnow()" in line or "tzinfo=None" in line:
                rel = path.relative_to(backend_dir).as_posix()
                offenders.append(f"{rel}:{i}: {line.strip()}")

    assert not offenders, (
        f"Naive datetime sites remain outside app/core/time.py:\n"
        + "\n".join(offenders)
    )
