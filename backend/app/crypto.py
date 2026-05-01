"""Symmetric encryption for user-provided Pollinations API keys.

The master key is read from ``MASTER_KEY`` env var. Generate one with::

    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

If ``MASTER_KEY`` is missing, encryption helpers raise on use. We deliberately
do NOT generate a random key on startup, because that would make every redeploy
invalidate every saved user key.
"""
from __future__ import annotations

import os
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken


class MissingMasterKeyError(RuntimeError):
    """Raised when MASTER_KEY env var is missing or empty."""


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    key = os.getenv("MASTER_KEY", "").strip()
    if not key:
        raise MissingMasterKeyError(
            "MASTER_KEY env var is required to encrypt user API keys. "
            "Generate one with: python -c "
            "\"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\""
        )
    return Fernet(key.encode())


def encrypt_key(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_key(ciphertext: str) -> str:
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:  # pragma: no cover - operational error
        raise RuntimeError(
            "Failed to decrypt stored Pollinations key. "
            "MASTER_KEY may have changed since this user signed up."
        ) from exc
