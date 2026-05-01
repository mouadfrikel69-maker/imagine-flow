"""Daily generation quota — counted in Firestore.

Each user has at most one document per UTC day::

    daily_usage/{uid}_{YYYY-MM-DD}  →  {uid, date, images_used}

We use a Firestore transaction so the read + check + increment all happen
atomically — concurrent requests can't both observe ``used=5`` and both
slip past a ``5/6`` limit. The document keys themselves act as TTL anchors;
we don't bother deleting historical rows since they're tiny.
"""
from __future__ import annotations

from datetime import datetime, timezone

from google.cloud.firestore import Increment, transactional

from .firebase_app import get_firestore


class QuotaExceeded(Exception):
    """Raised when the user has hit their daily limit."""

    def __init__(self, used: int, limit: int):
        super().__init__(f"Daily limit reached ({used}/{limit}).")
        self.used = used
        self.limit = limit


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


def reserve_slot(uid: str, daily_limit: int) -> int:
    """Atomically check the quota and reserve one slot.

    Returns the post-increment usage. Raises :class:`QuotaExceeded` if the
    user has already hit their limit. Use :func:`release_slot` to roll back
    if the downstream API call fails after this returns.
    """
    db = get_firestore()
    date_key = today_key()
    ref = db.collection("daily_usage").document(_doc_id(uid, date_key))

    @transactional
    def _txn(transaction):
        snap = ref.get(transaction=transaction)
        used = 0
        if snap.exists:
            data = snap.to_dict() or {}
            used = int(data.get("images_used", 0))
        if used >= daily_limit:
            raise QuotaExceeded(used, daily_limit)
        new_used = used + 1
        transaction.set(
            ref,
            {"uid": uid, "date": date_key, "images_used": new_used},
            merge=True,
        )
        return new_used

    return _txn(db.transaction())


def release_slot(uid: str) -> None:
    """Roll back a previously reserved slot. Called when the upstream API
    request fails so the user isn't charged for a non-result.
    """
    db = get_firestore()
    date_key = today_key()
    ref = db.collection("daily_usage").document(_doc_id(uid, date_key))

    # Best-effort decrement. Floor to 0 inside a transaction in case the
    # counter is already 0 (e.g. someone manually cleared it).
    @transactional
    def _txn(transaction):
        snap = ref.get(transaction=transaction)
        if not snap.exists:
            return
        data = snap.to_dict() or {}
        used = int(data.get("images_used", 0))
        if used <= 0:
            return
        transaction.set(
            ref,
            {"uid": uid, "date": date_key, "images_used": used - 1},
            merge=True,
        )

    _txn(db.transaction())


def increment_usage(uid: str) -> None:
    """Legacy non-atomic increment, kept for backward compat. Prefer
    :func:`reserve_slot` for new code.
    """
    db = get_firestore()
    date_key = today_key()
    ref = db.collection("daily_usage").document(_doc_id(uid, date_key))
    ref.set(
        {"uid": uid, "date": date_key, "images_used": Increment(1)},
        merge=True,
    )
