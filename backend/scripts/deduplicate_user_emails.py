"""
Manual remediation script: deduplicate user emails before the unique
constraint migration (a7c1d9e2b4f8) can be applied.

Keeps the OLDEST row per email untouched; suffixes every newer duplicate as
`local+dup{n}@domain` so it no longer collides and is visibly flagged.

Usage:
    cd backend && python scripts/deduplicate_user_emails.py [--apply]
"""

import asyncio
import sys
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.models.user import User


def deduplicated_email(email: str, occurrence: int) -> str:
    local, _, domain = email.partition("@")
    return f"{local}+dup{occurrence}@{domain or 'invalid.local'}"


async def deduplicate_emails(apply_changes: bool) -> int:
    changed = 0
    async with async_session_maker() as session:
        result = await session.execute(select(User).order_by(User.created_at))
        users = result.scalars().all()

        occurrences: dict[str, int] = defaultdict(int)
        for user in users:
            if not user.email:
                continue
            occurrences[user.email] += 1
            if occurrences[user.email] == 1:
                continue

            new_email = deduplicated_email(user.email, occurrences[user.email])
            print(f"Renaming {user.email!r} (user {user.id}) -> {new_email!r}")
            if apply_changes:
                user.email = new_email
                session.add(user)
            changed += 1

        if apply_changes and changed:
            await session.commit()

    return changed


async def main() -> int:
    apply_changes = "--apply" in sys.argv
    changed = await deduplicate_emails(apply_changes)

    mode = "APPLIED" if apply_changes else "DRY RUN"
    suffix = "" if apply_changes else " would be"
    print(f"{mode}: {changed} duplicate email(s){suffix} renamed.")
    if not apply_changes and changed:
        print("Re-run with --apply to write changes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
