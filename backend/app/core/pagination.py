"""
Shared server-side pagination primitives (H4).

Every list endpoint takes PaginationParams as a dependency and returns a
Page[T] envelope so clients get { items, total, limit, offset } uniformly.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")

DEFAULT_LIMIT = 50
MAX_LIMIT = 200


class PaginationParams(BaseModel):
    """Query-string pagination contract shared by all list endpoints."""

    limit: int = Field(default=DEFAULT_LIMIT, ge=1)
    offset: int = Field(default=0, ge=0)

    @field_validator("limit", mode="before")
    @classmethod
    def _clamp_limit(cls, value):
        """Clamp oversized page sizes instead of erroring (DoS guard)."""
        try:
            return min(int(value), MAX_LIMIT)
        except (TypeError, ValueError):
            return value


class Page(BaseModel, Generic[T]):
    """Uniform paginated response envelope."""

    items: list[T]
    total: int
    limit: int
    offset: int
