#!/bin/sh
set -e

# Apply pending migrations, then start the API (H5: honor proxy headers).
alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers --forwarded-allow-ips=*
