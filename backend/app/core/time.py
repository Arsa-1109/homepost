"""
Centralized timezone handling (M10).

All application timestamps flow through these helpers so every comparison
is aware-UTC against aware-UTC. SQLite stores naive datetimes; as_aware_utc()
normalizes reads so both database backends behave identically.
"""

from datetime import datetime, timezone


def utc_now() -> datetime:
    """Current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def as_aware_utc(value: datetime) -> datetime:
    """
    Normalize a datetime to aware UTC.

    Naive datetimes (as returned by SQLite) are interpreted as UTC.
    Aware datetimes are returned unchanged.
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def utc_now_naive() -> datetime:
    """
    Aware UTC with tzinfo stripped — for columns that must store naive UTC
    (legacy naive columns). New columns should use utc_now() instead.
    """
    return utc_now().replace(tzinfo=None)
