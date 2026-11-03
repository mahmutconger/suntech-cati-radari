from __future__ import annotations

import base64
import json
import tempfile

import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth

from app.core.config import FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT

_app: firebase_admin.App | None = None


def _init() -> firebase_admin.App:
    global _app
    if _app is not None:
        return _app

    if FIREBASE_SERVICE_ACCOUNT:
        try:
            decoded = json.loads(base64.b64decode(FIREBASE_SERVICE_ACCOUNT))
            cred = credentials.Certificate(decoded)
        except Exception:
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
    else:
        cred = credentials.ApplicationDefault()

    _app = firebase_admin.initialize_app(cred, {"projectId": FIREBASE_PROJECT_ID})
    return _app


def get_firestore_client() -> firestore.firestore.Client:
    _init()
    return firestore.client()


def verify_id_token(token: str) -> dict:
    _init()
    return firebase_auth.verify_id_token(token)
