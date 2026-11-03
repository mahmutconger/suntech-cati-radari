from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.firebase import verify_id_token

_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_scheme),
) -> dict:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token gerekli")
    try:
        return verify_id_token(creds.credentials)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Geçersiz token")


async def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_scheme),
) -> dict | None:
    if creds is None:
        return None
    try:
        return verify_id_token(creds.credentials)
    except Exception:
        return None
