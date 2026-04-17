# LAW.OS FastAPI backend — Railway-ready container.
# Railway sets $PORT at runtime; do not hard-code the port.
FROM python:3.11-slim

# Keep image small and reproducible.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install runtime dependencies only (no build toolchain in final image).
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy application code after deps for better layer caching.
COPY app/ ./app/
COPY scripts/ ./scripts/

# Railway injects PORT. Fall back to 8010 for local `docker run`.
# Shell form so $PORT is expanded by /bin/sh at container start.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8010} --proxy-headers --forwarded-allow-ips '*'"]
