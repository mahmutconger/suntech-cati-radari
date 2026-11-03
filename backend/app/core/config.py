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
# 503 ya da 429 gelirse sıradaki modele geçilir
GEMINI_MODELLER: list[str] = [
    m.strip()
    for m in get_env("GEMINI_MODELLER", "gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite").split(",")
    if m.strip()
]
GEMINI_SAHTE: bool = get_env("GEMINI_SAHTE", "0") == "1" or not GEMINI_API_KEY
