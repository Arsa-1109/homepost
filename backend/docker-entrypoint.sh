#!/bin/sh
set -e

# Run database migrations
alembic upgrade head

# If arguments were passed (e.g. from Render startCommand or Docker CMD), execute them
if [ "$#" -gt 0 ]; then
    exec "$@"
fi

# Default to starting uvicorn with proxy headers enabled
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers --forwarded-allow-ips=*

