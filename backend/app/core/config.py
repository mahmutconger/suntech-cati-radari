from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()


def get_env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


CORS_ORIGINS: list[str] = [
    o.strip()
    for o in get_env("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

FIREBASE_PROJECT_ID: str = get_env("FIREBASE_PROJECT_ID")
FIREBASE_SERVICE_ACCOUNT: str = get_env("FIREBASE_SERVICE_ACCOUNT")
GEMINI_API_KEY: str = get_env("GEMINI_API_KEY")
