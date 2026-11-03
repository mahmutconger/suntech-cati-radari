from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user

router = APIRouter(tags=["auth"])


@router.get("/auth/ben")
def ben(kullanici: dict = Depends(get_current_user)) -> dict:
    """Firebase ID token'ı doğrulanmış kullanıcı."""
    return {
        "uid": kullanici["uid"],
        "email": kullanici.get("email"),
        "email_dogrulandi": kullanici.get("email_verified", False),
    }
