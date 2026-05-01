"""Daily generation quota — counted in Firestore.

Each user has at most one document per UTC day::

    daily_usage/{uid}_{YYYY-MM-DD}  →  {uid, date, images_used}

We use Firestore's atomic ``Increment`` so concurrent writes are race-safe.
The document keys themselves act as TTL anchors; we don't bother deleting
historical rows since they're tiny.
"""
from __future__ import annotations

from datetime import datetime, timezone

from google.cloud.firestore import Increment

from .firebase_app import get_firestore


def today_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _doc_id(uid: str, date_key: str) -> str:
    return f"{uid}_{date_key}"


def get_usage(uid: str) -> int:
    db = get_firestore()
    snap = db.collection("daily_usage").document(_doc_id(uid, today_key())).get()
    if not snap.exists:
        return 0
    data = snap.to_dict() or {}
    return int(data.get("images_used", 0))


def increment_usage(uid: str) -> None:
    db = get_firestore()
    date_key = today_key()
    ref = db.collection("daily_usage").document(_doc_id(uid, date_key))
    ref.set(
        {"uid": uid, "date": date_key, "images_used": Increment(1)},
        merge=True,
    )
