"""Firebase ID-token verification + user profile loading.

Mobile/web clients send ``Authorization: Bearer <Firebase ID token>``. We verify
it with the Firebase Admin SDK, then look up (or create) the user's profile
node in Realtime Database (``user_profiles/{uid}``).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

from fastapi import Depends, Header, HTTPException, status  # noqa: F401  (Depends re-exported below)
from firebase_admin import auth as firebase_auth

from .firebase_app import get_realtime_db

AuthMethod = Literal["google", "email", "pollinations"]


@dataclass
class CurrentUser:
    uid: str
    email: str | None
    name: str | None
    auth_method: AuthMethod
    pollinations_api_key: str | None  # Fernet-encrypted blob (or None)
    dismissed_pollinations_upsell: bool

    @property
    def daily_limit(self) -> int:
        return 20 if self.auth_method == "pollinations" else 6


def _decode_token(token: str) -> dict:
    try:
        return firebase_auth.verify_id_token(token, check_revoked=False)
    except firebase_auth.RevokedIdTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token revoked") from exc
    except firebase_auth.ExpiredIdTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired") from exc
    except firebase_auth.InvalidIdTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {exc}") from exc
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Auth failed: {exc}") from exc


def _detect_auth_method(decoded: dict) -> AuthMethod:
    """Infer the initial auth method from Firebase's sign-in provider claim."""
    sign_in_provider = (decoded.get("firebase") or {}).get("sign_in_provider", "")
    if sign_in_provider == "google.com":
        return "google"
    return "email"


def _ensure_profile(uid: str, decoded: dict) -> dict:
    ref = get_realtime_db().reference(f"user_profiles/{uid}")
    existing = ref.get()
    if isinstance(existing, dict) and existing:
        return existing

    # First time we've seen this user — create their profile node.
    # RTDB has no server-side timestamp primitive on the admin SDK that's
    # ergonomic to use here, so we capture the current UTC instant client-
    # side. The value is informational only — nothing in the app reads it.
    initial = {
        "uid": uid,
        "email": decoded.get("email"),
        "name": decoded.get("name"),
        "auth_method": _detect_auth_method(decoded),
        "pollinations_api_key": None,
        "dismissed_pollinations_upsell": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    ref.set(initial)
    return initial


def current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> CurrentUser:
    """FastAPI dependency: verify the Firebase ID token and load the profile.

    Declared as a regular ``def`` (not ``async def``) on purpose:
    Firebase Admin's ``verify_id_token`` and RTDB ``get`` / ``set`` are
    synchronous network calls. If we declared this ``async def`` FastAPI
    would run it directly on the event loop, blocking every concurrent
    request for the duration of the round-trip. As a sync def, FastAPI
    runs it in its threadpool and the event loop stays responsive.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Empty token")

    decoded = _decode_token(token)
    uid = decoded.get("uid") or decoded.get("sub")
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has no uid")

    profile = _ensure_profile(uid, decoded)
    return CurrentUser(
        uid=uid,
        email=profile.get("email") or decoded.get("email"),
        name=profile.get("name") or decoded.get("name"),
        auth_method=profile.get("auth_method", "email"),
        pollinations_api_key=profile.get("pollinations_api_key"),
        dismissed_pollinations_upsell=bool(
            profile.get("dismissed_pollinations_upsell", False)
        ),
    )


CurrentUserDep = Depends(current_user)
