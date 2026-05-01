"""User-profile endpoints (auth required).

These are the endpoints the mobile/web client hits to:

* Read the signed-in user's quota + auth method (``GET /api/v2/me``).
* Save a Pollinations API key the very first time they sign up via the
  Pollinations flow (``POST /api/v2/me/setup-pollinations``).
* Upgrade a Google/email user to the 20/day tier by attaching their own
  Pollinations key (``POST /api/v2/me/upgrade-pollinations``).
* Permanently dismiss the dashboard upsell card
  (``POST /api/v2/me/dismiss-upsell``).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import CurrentUser, CurrentUserDep
from ..crypto import encrypt_key
from ..firebase_app import get_firestore
from ..pollinations import validate_key
from ..quota import get_usage

logger = logging.getLogger("imagine-flow.me")
router = APIRouter(prefix="/api/v2/me", tags=["me"])


class MeResponse(BaseModel):
    uid: str
    email: str | None
    name: str | None
    auth_method: str
    daily_limit: int
    used_today: int
    dismissed_pollinations_upsell: bool
    has_pollinations_key: bool


@router.get("", response_model=MeResponse)
def me(user: CurrentUser = CurrentUserDep) -> MeResponse:
    return MeResponse(
        uid=user.uid,
        email=user.email,
        name=user.name,
        auth_method=user.auth_method,
        daily_limit=user.daily_limit,
        used_today=get_usage(user.uid),
        dismissed_pollinations_upsell=user.dismissed_pollinations_upsell,
        has_pollinations_key=user.pollinations_api_key is not None,
    )


class KeyRequest(BaseModel):
    pollinations_key: str = Field(min_length=8, max_length=512)


@router.post("/setup-pollinations")
async def setup_pollinations(
    req: KeyRequest, user: CurrentUser = CurrentUserDep
) -> dict[str, bool]:
    """Save a Pollinations key right after sign-up. Sets ``auth_method=pollinations``."""
    if not await validate_key(req.pollinations_key):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "That Pollinations API key didn't work. Double-check it.",
        )
    db = get_firestore()
    db.collection("user_profile").document(user.uid).set(
        {
            "auth_method": "pollinations",
            "pollinations_api_key": encrypt_key(req.pollinations_key),
        },
        merge=True,
    )
    return {"ok": True}


@router.post("/upgrade-pollinations")
async def upgrade_pollinations(
    req: KeyRequest, user: CurrentUser = CurrentUserDep
) -> dict[str, bool]:
    """Existing Google/email user attaches their own key to unlock 20/day."""
    if not await validate_key(req.pollinations_key):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "That Pollinations API key didn't work. Double-check it.",
        )
    db = get_firestore()
    db.collection("user_profile").document(user.uid).set(
        {
            "auth_method": "pollinations",
            "pollinations_api_key": encrypt_key(req.pollinations_key),
            "dismissed_pollinations_upsell": True,
        },
        merge=True,
    )
    return {"ok": True}


@router.post("/dismiss-upsell")
def dismiss_upsell(user: CurrentUser = CurrentUserDep) -> dict[str, bool]:
    db = get_firestore()
    db.collection("user_profile").document(user.uid).set(
        {"dismissed_pollinations_upsell": True}, merge=True
    )
    return {"ok": True}
