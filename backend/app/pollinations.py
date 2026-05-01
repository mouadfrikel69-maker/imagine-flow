"""Helpers for calling Pollinations.ai with a chosen API key."""
from __future__ import annotations

import os
from urllib.parse import quote

import httpx

POLLINATIONS_BASE_URL = os.getenv(
    "POLLINATIONS_BASE_URL", "https://gen.pollinations.ai"
)
POLLINATIONS_IMAGE_BASE_URL = os.getenv(
    "POLLINATIONS_IMAGE_BASE_URL", "https://image.pollinations.ai"
)
POLLINATIONS_VISION_MODEL = os.getenv("POLLINATIONS_VISION_MODEL", "openai")
POLLINATIONS_IMAGE_MODEL = os.getenv("POLLINATIONS_IMAGE_MODEL", "flux")


async def validate_key(api_key: str) -> bool:
    """Return True iff the given Pollinations key returns 200 from a tiny test."""
    if not api_key:
        return False
    url = f"{POLLINATIONS_BASE_URL.rstrip('/')}/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": POLLINATIONS_VISION_MODEL,
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
        # 429 = key is good but we're rate-limited; still treat as valid.
        return resp.status_code in (200, 429)
    except httpx.HTTPError:
        return False


async def caption_image(
    *,
    api_key: str,
    image_data_url: str,
    instruction: str,
    model: str | None = None,
) -> str:
    """Send a multimodal chat completion to Pollinations and return the text."""
    chosen = (model or POLLINATIONS_VISION_MODEL).strip() or "openai"
    url = f"{POLLINATIONS_BASE_URL.rstrip('/')}/v1/chat/completions"
    payload = {
        "model": chosen,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": instruction},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ],
            }
        ],
        "max_tokens": 400,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
    resp.raise_for_status()
    data = resp.json()
    choice = data["choices"][0]
    message = choice.get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        return "".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ).strip()
    return (content or "").strip()


async def fetch_generated_image(
    *,
    api_key: str,
    prompt: str,
    width: int = 1024,
    height: int = 1024,
    seed: int = 0,
    model: str | None = None,
) -> tuple[bytes, str]:
    """Fetch a generated image from Pollinations and return (bytes, content_type)."""
    chosen = (model or POLLINATIONS_IMAGE_MODEL).strip() or "flux"
    base = POLLINATIONS_IMAGE_BASE_URL.rstrip("/")
    url = f"{base}/prompt/{quote(prompt, safe='')}"
    params = {
        "model": chosen,
        "width": width,
        "height": height,
        "seed": seed,
        "nologo": "true",
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.get(url, params=params, headers=headers)
    resp.raise_for_status()
    return resp.content, resp.headers.get("content-type", "image/jpeg")
