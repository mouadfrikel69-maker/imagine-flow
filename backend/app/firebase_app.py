"""Firebase Admin SDK bootstrap.

Initializes a single Firebase app instance from one of these credential sources,
in order:

1. ``FIREBASE_SERVICE_ACCOUNT_JSON`` — entire service-account JSON pasted into
   one env var. Best for Render where you can't easily upload files.
2. ``GOOGLE_APPLICATION_CREDENTIALS`` — path to a service-account JSON file.
   Standard Google Cloud convention; works locally.
3. Application Default Credentials when running on Google Cloud / Firebase
   hosting / GCE.

We use **Firebase Realtime Database** (not Firestore) for application state.
Firestore would force the project onto the Blaze (paid) plan since late 2024
even when staying within free quotas, while Realtime Database remains fully
usable on the Spark (free) plan. The data shape this app needs (per-uid user
profile + per-uid-per-day counter) maps cleanly to RTDB's tree.

The RTDB ``Reference`` factory returned by :func:`get_realtime_db` is reused
across calls. Set ``FIREBASE_DATABASE_URL`` (e.g.
``https://<project>-default-rtdb.firebaseio.com`` or the regional variant
``https://<project>-default-rtdb.<region>.firebasedatabase.app``) so the SDK
knows which database instance to talk to.
"""
from __future__ import annotations

import json
import logging
import os
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, db

logger = logging.getLogger("imagine-flow.firebase")


def _build_credentials() -> credentials.Base | None:
    raw = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if raw:
        try:
            return credentials.Certificate(json.loads(raw))
        except (ValueError, json.JSONDecodeError) as exc:
            logger.error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: %s", exc)
            raise

    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if path and os.path.isfile(path):
        return credentials.Certificate(path)

    return None  # ADC


@lru_cache(maxsize=1)
def get_app() -> firebase_admin.App:
    if firebase_admin._apps:
        return firebase_admin.get_app()
    cred = _build_credentials()
    options: dict[str, str] = {}
    project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
    if project_id:
        options["projectId"] = project_id
    database_url = os.getenv("FIREBASE_DATABASE_URL", "").strip()
    if database_url:
        options["databaseURL"] = database_url
    return firebase_admin.initialize_app(cred, options or None)


def get_realtime_db():  # noqa: ANN201 — return type is the firebase_admin.db module
    """Return the Realtime Database client module.

    Use ``get_realtime_db().reference("path/to/node")`` to read/write nodes.
    The Firebase app is initialized lazily on first call.
    """
    get_app()
    return db
