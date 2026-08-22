FROM python:3.12-slim

WORKDIR /app

# Install dependencies first for Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Railway injects $PORT at runtime)
EXPOSE 8000

# --proxy-headers: honor X-Forwarded-For from Railway's LB so rate limiting
# and request.client reflect the real client IP (audit finding H5)
CMD sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips=*"
