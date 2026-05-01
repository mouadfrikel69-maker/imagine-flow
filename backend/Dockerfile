FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install runtime deps from pyproject so adding a dep doesn't require touching
# the Dockerfile. The single `pip install -e .` resolves them all.
COPY pyproject.toml ./
COPY app ./app
COPY *.json* ./
RUN pip install --no-cache-dir -e .

EXPOSE 8000

# Render injects $PORT at runtime; default to 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
