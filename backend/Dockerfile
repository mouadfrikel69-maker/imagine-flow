FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install runtime deps
COPY pyproject.toml ./
RUN pip install --no-cache-dir "fastapi[standard]>=0.115.0" "uvicorn[standard]>=0.32.0" "httpx>=0.27.0" "pydantic>=2.9.0"

COPY app ./app
COPY *.json* ./

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
