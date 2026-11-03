from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Path, Response

from app.application import kayit
from app.core.auth import get_current_user
from app.schemas.kayit import Kayit, KayitIstegi

router = APIRouter(tags=["kayitlar"])

_DURUM = {"bina_yok": 404, "kayit_yok": 404, "kayit_siniri": 409}


def _hata(sonuc) -> HTTPException:
    return HTTPException(_DURUM.get(sonuc.hata.kod, 400), detail={"kod": sonuc.hata.kod, "mesaj": sonuc.hata.mesaj})


@router.get("/kayitlar", response_model=list[Kayit])
def kayitlari_listele(kullanici: dict = Depends(get_current_user)) -> list[dict]:
    """Giriş yapan kullanıcının kayıtları, yeniden eskiye."""
    return kayit.listele(kullanici["uid"])


@router.post("/kayitlar", response_model=Kayit, status_code=201)
def kayit_ekle(istek: KayitIstegi, kullanici: dict = Depends(get_current_user)) -> dict:
    sonuc = kayit.ekle(kullanici["uid"], istek.model_dump())
    if not sonuc.basarili:
        raise _hata(sonuc)
    return sonuc.deger


@router.delete("/kayitlar/{kayit_id}", status_code=204)
def kayit_sil(
    kayit_id: str = Path(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9]+$"),
    kullanici: dict = Depends(get_current_user),
) -> Response:
    sonuc = kayit.sil(kullanici["uid"], kayit_id)
    if not sonuc.basarili:
        raise _hata(sonuc)
    return Response(status_code=204)
