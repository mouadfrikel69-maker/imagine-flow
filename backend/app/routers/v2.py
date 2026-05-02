"""Generation endpoints with two-tier API-key routing + daily quota.

Mobile + web (once migrated) call these. Old ``/api/caption`` and
``/api/image`` remain in :mod:`app.main` for the existing Vite frontend.

The "logic" the user originally asked about lives in :func:`pick_key` — three
lines: if the user signed in with Google or email, use the developer's shared
``DEV_POLLINATIONS_API_KEY`` env var (limit 6/day). Otherwise decrypt the
user's own stored key (limit 20/day). The daily counter is tracked in
Firestore so concurrent requests can't race past the limit.
"""
from __future__ import annotations

import logging
import os

import httpx
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, Field

from ..auth import CurrentUser, CurrentUserDep
from ..crypto import decrypt_key
from ..pollinations import (
    POLLINATIONS_IMAGE_MODEL,
    POLLINATIONS_VISION_MODEL,
    caption_image,
    fetch_generated_image,
)
from ..quota import QuotaExceeded, release_slot, reserve_slot

logger = logging.getLogger("imagine-flow.v2")
router = APIRouter(prefix="/api/v2", tags=["v2"])

DEFAULT_INSTRUCTION = (
    "Describe this image in 2-3 vivid, accurate sentences. "
    "Mention subject, setting, mood, and style."
)


def _dev_key() -> str:
    key = (
        os.getenv("DEV_POLLINATIONS_API_KEY")
        or os.getenv("POLLINATIONS_API_KEY")
        or ""
    ).strip()
    if not key:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Server is missing DEV_POLLINATIONS_API_KEY.",
        )
    return key


def pick_key(user: CurrentUser) -> str:
    """The two-tier routing logic. Three lines."""
    if user.auth_method != "pollinations" or not user.pollinations_api_key:
        return _dev_key()  # 6/day shared tier
    return decrypt_key(user.pollinations_api_key)  # 20/day with their own key


def _reserve_quota(user: CurrentUser) -> str:
    """Race-safe quota check + reservation.

    Atomically increments the user's daily counter inside a Firestore
    transaction. If we've already hit the limit the transaction raises
    :class:`QuotaExceeded` and we surface a 429 to the client *without*
    incrementing. Returns the UTC date key that was incremented — callers
    must pass it to :func:`release_slot` if the downstream API call fails
    so the rollback targets the same document even across UTC midnight.
    """
    try:
        _new_used, date_key = reserve_slot(user.uid, user.daily_limit)
    except QuotaExceeded as exc:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Daily limit reached ({user.daily_limit}/day). Try again tomorrow.",
        ) from exc
    return date_key


def _safe_release(uid: str, date_key: str) -> None:
    """Best-effort slot rollback that swallows its own errors.

    The caller is already in an exception handler about to raise an
    intentional :class:`HTTPException` (typically a 502). If Firestore is
    transiently unavailable the release would otherwise propagate and
    mask the upstream failure with a generic 500, hiding the real cause
    from clients. We log and continue — a leaked quota slot is far less
    bad than a misleading error.
    """
    try:
        release_slot(uid, date_key)
    except Exception:  # noqa: BLE001 — deliberately broad
        logger.warning(
            "Failed to release quota slot for %s", uid, exc_info=True
        )


class GenerateImageRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    width: int = Field(default=1024, ge=64, le=2048)
    height: int = Field(default=1024, ge=64, le=2048)
    seed: int = Field(default=0, ge=0, le=2_147_483_647)
    model: str | None = None


@router.post("/generate-image")
async def generate_image(
    req: GenerateImageRequest, user: CurrentUser = CurrentUserDep
) -> Response:
    # Reserve a slot atomically *before* the upstream call so concurrent
    # requests can't all observe the same usage and bypass the limit. We
    # capture the date key so the rollback targets the same document
    # even if the upstream call drags us across UTC midnight.
    date_key = _reserve_quota(user)
    try:
        # pick_key() can raise (missing DEV key, rotated MASTER_KEY) — keep
        # it inside the try so the catch-all branch releases the slot.
        key = pick_key(user)
        image_bytes, content_type = await fetch_generated_image(
            api_key=key,
            prompt=req.prompt,
            width=req.width,
            height=req.height,
            seed=req.seed,
            model=req.model or POLLINATIONS_IMAGE_MODEL,
        )
    except httpx.HTTPStatusError as exc:
        # Roll back the reservation — the user got nothing useful, so don't
        # charge them for it.
        _safe_release(user.uid, date_key)
        logger.warning("Pollinations image error: %s", exc)
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"Pollinations error: {exc.response.text[:300]}",
        ) from exc
    except httpx.HTTPError as exc:
        _safe_release(user.uid, date_key)
        logger.exception("Pollinations image request failed")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, f"Upstream request failed: {exc}"
        ) from exc
    except Exception:
        _safe_release(user.uid, date_key)
        raise

    return Response(
        content=image_bytes,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=3600"},
    )


class CaptionRequestV2(BaseModel):
    image_data_url: str = Field(
        description="Base64 data URL (e.g. data:image/png;base64,...)."
    )
    instruction: str | None = None
    model: str | None = None


class CaptionResponseV2(BaseModel):
    caption: str
    model: str


@router.post("/caption", response_model=CaptionResponseV2)
async def caption(
    req: CaptionRequestV2, user: CurrentUser = CurrentUserDep
) -> CaptionResponseV2:
    if not req.image_data_url.startswith("data:image/"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "image_data_url must be a base64 data URL (data:image/...).",
        )
    # Reserve atomically before the upstream call (see generate_image).
    date_key = _reserve_quota(user)
    try:
        # pick_key() can raise — keep inside the try so the catch-all
        # branch releases the slot.
        key = pick_key(user)
        instruction = (req.instruction or DEFAULT_INSTRUCTION).strip()
        model = (req.model or POLLINATIONS_VISION_MODEL).strip() or "openai"
        text = await caption_image(
            api_key=key,
            image_data_url=req.image_data_url,
            instruction=instruction,
            model=model,
        )
    except httpx.HTTPStatusError as exc:
        _safe_release(user.uid, date_key)
        logger.warning("Pollinations caption error: %s", exc)
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"Pollinations error: {exc.response.text[:300]}",
        ) from exc
    except httpx.HTTPError as exc:
        _safe_release(user.uid, date_key)
        logger.exception("Pollinations caption request failed")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, f"Upstream request failed: {exc}"
        ) from exc
    except Exception:
        _safe_release(user.uid, date_key)
        raise

    return CaptionResponseV2(caption=text, model=model)
