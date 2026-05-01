"""Firebase Admin SDK bootstrap.

Initializes a single Firebase app instance from one of these sources, in order:

1. ``FIREBASE_SERVICE_ACCOUNT_JSON`` — entire service-account JSON pasted into
   one env var. Best for Render where you can't easily upload files.
2. ``GOOGLE_APPLICATION_CREDENTIALS`` — path to a service-account JSON file.
   Standard Google Cloud convention; works locally.
3. Application Default Credentials when running on Google Cloud / Firebase
   hosting / GCE.

The Firestore client returned by :func:`get_firestore` is reused across calls.
"""
from __future__ import annotations

import json
import logging
import os
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, firestore

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
    project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip() or None
    options = {"projectId": project_id} if project_id else None
    return firebase_admin.initialize_app(cred, options)


@lru_cache(maxsize=1)
def get_firestore() -> firestore.firestore.Client:
    get_app()
    return firestore.client()
