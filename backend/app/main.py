"""FastAPI proxy for Pollinations.ai vision endpoints.

Keeps the API key server-side. Frontend talks to /api/caption.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path

from urllib.parse import quote

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

logger = logging.getLogger("imagine-flow")
logging.basicConfig(level=logging.INFO)


def _load_api_key() -> str:
    """Read the Pollinations API key from env, or a runtime config file.

    The runtime config file lets us bundle a key into a deployed Docker image
    without committing it to git. Path is overridable via
    ``POLLINATIONS_KEY_FILE``.
    """
    key = os.getenv("POLLINATIONS_API_KEY", "").strip()
    if key:
        return key

    config_path = Path(
        os.getenv("POLLINATIONS_KEY_FILE")
        or Path(__file__).parent / "_runtime_config.json"
    )
    if config_path.is_file():
        try:
            data = json.loads(config_path.read_text())
            return str(data.get("POLLINATIONS_API_KEY", "")).strip()
        except (OSError, ValueError) as exc:
            logger.warning("Failed to load %s: %s", config_path, exc)
    return ""


POLLINATIONS_BASE_URL = os.getenv(
    "POLLINATIONS_BASE_URL", "https://gen.pollinations.ai"
)
POLLINATIONS_VISION_MODEL = os.getenv("POLLINATIONS_VISION_MODEL", "openai")
POLLINATIONS_IMAGE_MODEL = os.getenv("POLLINATIONS_IMAGE_MODEL", "flux")
POLLINATIONS_API_KEY = _load_api_key()

DEFAULT_INSTRUCTION = (
    "Describe this image in 2-3 vivid, accurate sentences. "
    "Mention subject, setting, mood, and style."
)

app = FastAPI(title="ImagineFlow API", version="0.1.0")

# CORS: when frontend is deployed separately we still want it to reach us.
allow_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allow_origins if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CaptionRequest(BaseModel):
    image_data_url: str = Field(
        ...,
        description="Base64 data URL of the image (e.g. data:image/png;base64,...).",
    )
    instruction: str | None = Field(
        default=None, description="Custom instruction to send to the model."
    )
    model: str | None = Field(
        default=None, description="Override Pollinations vision model name."
    )


class CaptionResponse(BaseModel):
    caption: str
    model: str


@app.get("/healthz")
def healthz() -> dict[str, object]:
    return {
        "ok": True,
        "has_api_key": bool(POLLINATIONS_API_KEY),
        "model": POLLINATIONS_VISION_MODEL,
    }


@app.post("/api/caption", response_model=CaptionResponse)
async def caption(req: CaptionRequest) -> CaptionResponse:
    if not POLLINATIONS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail=(
                "Server is missing POLLINATIONS_API_KEY. Set it as an environment "
                "variable. Get a free key at https://enter.pollinations.ai"
            ),
        )

    if not req.image_data_url.startswith("data:image/"):
        raise HTTPException(
            status_code=400,
            detail="image_data_url must be a base64 data URL (data:image/...).",
        )

    instruction = (req.instruction or DEFAULT_INSTRUCTION).strip()
    model = (req.model or POLLINATIONS_VISION_MODEL).strip() or "openai"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": instruction},
                    {"type": "image_url", "image_url": {"url": req.image_data_url}},
                ],
            }
        ],
        "max_tokens": 400,
    }

    headers = {
        "Authorization": f"Bearer {POLLINATIONS_API_KEY}",
        "Content-Type": "application/json",
    }

    url = f"{POLLINATIONS_BASE_URL.rstrip('/')}/v1/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as e:
        logger.exception("Pollinations request failed")
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {e}") from e

    if resp.status_code >= 400:
        logger.warning("Pollinations error %s: %s", resp.status_code, resp.text[:500])
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Pollinations error: {resp.text[:500]}",
        )

    try:
        data = resp.json()
        choice = data["choices"][0]
        message = choice.get("message") or {}
        content = message.get("content")
        if isinstance(content, list):
            # Some models return content_blocks; pick text parts.
            text = "".join(
                block.get("text", "")
                for block in content
                if isinstance(block, dict) and block.get("type") == "text"
            )
        else:
            text = content or ""
    except (KeyError, IndexError, ValueError) as e:
        logger.exception("Unexpected Pollinations response: %s", resp.text[:500])
        raise HTTPException(
            status_code=502,
            detail="Unexpected response from Pollinations vision API.",
        ) from e

    return CaptionResponse(caption=text.strip(), model=model)


@app.get("/api/image")
async def generate_image(
    prompt: str = Query(..., min_length=1, max_length=2000),
    width: int = Query(1024, ge=64, le=2048),
    height: int = Query(1024, ge=64, le=2048),
    seed: int = Query(0, ge=0, le=2_147_483_647),
    model: str | None = Query(None),
) -> Response:
    """Proxy text→image generation through the authenticated Pollinations gateway.

    Routing through the backend lets us attach the API key without exposing it
    to the browser, and bypasses the per-IP queue limits of the anonymous tier.
    """
    if not POLLINATIONS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Server is missing POLLINATIONS_API_KEY.",
        )

    chosen_model = (model or POLLINATIONS_IMAGE_MODEL).strip() or "flux"
    base = POLLINATIONS_BASE_URL.rstrip("/")
    url = f"{base}/image/{quote(prompt, safe='')}"
    params = {
        "model": chosen_model,
        "width": width,
        "height": height,
        "seed": seed,
        "nologo": "true",
    }
    headers = {"Authorization": f"Bearer {POLLINATIONS_API_KEY}"}

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.get(url, params=params, headers=headers)
    except httpx.HTTPError as e:
        logger.exception("Pollinations image request failed")
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {e}") from e

    if resp.status_code >= 400:
        logger.warning(
            "Pollinations image error %s: %s", resp.status_code, resp.text[:300]
        )
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Pollinations error: {resp.text[:300]}",
        )

    return Response(
        content=resp.content,
        media_type=resp.headers.get("content-type", "image/jpeg"),
        headers={"Cache-Control": "public, max-age=3600"},
    )
