"""Daily generation quota — counted in Firebase Realtime Database.

Each user has at most one counter node per UTC day::

    daily_usage/{uid}/{YYYY-MM-DD}/images_used  →  <int>

We use RTDB's :meth:`Reference.transaction` so the read + check + increment
all happen atomically — concurrent requests can't both observe ``used=5`` and
both slip past a ``5/6`` limit. The date-keyed nodes themselves act as TTL
anchors; we don't bother deleting historical rows since they're tiny.

This module previously used Firestore. We migrated to RTDB because new
Firestore databases now require Google Cloud billing to be enabled (a
late-2024 GCP-side policy change), even when staying inside Spark-tier free
quotas. RTDB is unaffected and remains fully usable on the free plan.
"""
from __future__ import annotations

from datetime import datetime, timezone


class QuotaExceeded(Exception):
    """Raised when the user has hit their daily limit."""

    def __init__(self, used: int, limit: int):
        super().__init__(f"Daily limit reached ({used}/{limit}).")
        self.used = used
        self.limit = limit


def today_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _counter_ref(uid: str, date_key: str):  # noqa: ANN202 — RTDB Reference
    """Return the RTDB reference for a user's per-day counter node."""
    from .firebase_app import get_realtime_db

    return get_realtime_db().reference(
        f"daily_usage/{uid}/{date_key}/images_used"
    )


def get_usage(uid: str) -> int:
    """Return the user's image-generation count for the current UTC day."""
    val = _counter_ref(uid, today_key()).get()
    return int(val or 0)


def reserve_slot(uid: str, daily_limit: int) -> tuple[int, str]:
    """Atomically check the quota and reserve one slot.

    Returns ``(new_used, date_key)`` — the post-increment usage and the
    UTC date string that was actually incremented. Callers that need to
    later release the slot (e.g. on upstream API failure) should pass
    ``date_key`` to :func:`release_slot` so the decrement targets the
    same node even if UTC midnight was crossed in between. Raises
    :class:`QuotaExceeded` if the user has already hit their limit.

    The atomicity is provided by :meth:`Reference.transaction`. If two
    requests race, RTDB serializes them: the second one's update
    function sees the first's incremented value and either accepts the
    new total or raises :class:`QuotaExceeded` cleanly.
    """
    date_key = today_key()
    ref = _counter_ref(uid, date_key)

    def _txn(current: int | None) -> int:
        used = int(current or 0)
        if used >= daily_limit:
            raise QuotaExceeded(used, daily_limit)
        return used + 1

    new_used = ref.transaction(_txn)
    return int(new_used or 0), date_key


def release_slot(uid: str, date_key: str | None = None) -> None:
    """Roll back a previously reserved slot.

    Pass the ``date_key`` returned by :func:`reserve_slot` so the
    decrement targets the same node the reservation incremented —
    otherwise a long-running request that crosses UTC midnight would
    decrement the *next* day's counter (or no node at all),
    permanently leaking a slot from yesterday's quota. If ``date_key``
    is ``None`` we fall back to today, which matches the legacy single-
    day behaviour.

    Best-effort decrement: floors at 0 inside the transaction in case
    the counter is already 0 (e.g. someone manually cleared it).
    """
    if date_key is None:
        date_key = today_key()
    ref = _counter_ref(uid, date_key)

    def _txn(current: int | None) -> int | None:
        used = int(current or 0)
        if used <= 0:
            return current  # no-op, RTDB skips the write
        return used - 1

    ref.transaction(_txn)


def increment_usage(uid: str) -> None:
    """Legacy non-atomic increment, kept for backward compat. Prefer
    :func:`reserve_slot` for new code.

    On RTDB this is implemented with a transaction since the SDK has no
    server-side ``Increment`` primitive.
    """
    ref = _counter_ref(uid, today_key())
    ref.transaction(lambda current: int(current or 0) + 1)
