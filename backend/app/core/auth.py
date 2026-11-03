from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.firebase import verify_id_token

_scheme = HTTPBearer(auto_error=False)


# async değil: verify_id_token Google'ın açık anahtarlarını ağdan çekebilir, FastAPI bunu iş parçacığında çalıştırsın
def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(_scheme)) -> dict:
    if creds is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail={"kod": "giris_gerekli", "mesaj": "Bu işlem için giriş yapın."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return verify_id_token(creds.credentials)
    except Exception:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail={"kod": "gecersiz_token", "mesaj": "Oturumunuz geçersiz ya da süresi dolmuş, yeniden giriş yapın."},
            headers={"WWW-Authenticate": "Bearer"},
        )
