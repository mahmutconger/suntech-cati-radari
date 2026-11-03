from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.application.uydu import goruntu, onbellekteki, tespit_et
from app.core.hiz_siniri import HizSiniri
from app.infrastructure.gemini import GeminiHatasi

router = APIRouter(tags=["uydu"])

_DURUM = {"bina_yok": 404, "sonuc_yok": 404, "goruntu_yok": 502, "cevap_bozuk": 502}


def _hata(sonuc) -> HTTPException:
    return HTTPException(_DURUM.get(sonuc.hata.kod, 400), detail={"kod": sonuc.hata.kod, "mesaj": sonuc.hata.mesaj})


class UyduSonucu(BaseModel):
    bina_id: int
    panel: Literal["var", "yok", "belirsiz"]
    kaplama_orani: float
    guven: float
    aciklama: str
    model: str
    onbellekten: bool


@router.post("/uydu/{bina_id}", response_model=UyduSonucu, dependencies=[Depends(HizSiniri(ip_basina=5, toplam=30))])
def uydu(bina_id: int) -> dict:
    """Çatının uydu görüntüsünde güneş paneli arar; sonuç saklanır, aynı çatı tekrar sorulmaz."""
    try:
        sonuc = tespit_et(bina_id)
    except GeminiHatasi:
        raise HTTPException(503, detail={"kod": "asistan_mesgul", "mesaj": "Uydu analizi şu an yapılamıyor, biraz sonra tekrar deneyin."})
    if not sonuc.basarili:
        raise _hata(sonuc)
    return sonuc.deger


@router.get("/uydu/{bina_id}", response_model=UyduSonucu)
def uydu_onbellek(bina_id: int) -> dict:
    """Daha önce yapılmış uydu kontrolü; Gemini'ye gitmez, yapılmadıysa 404 sonuc_yok."""
    sonuc = onbellekteki(bina_id)
    if not sonuc.basarili:
        raise _hata(sonuc)
    return sonuc.deger


@router.get(
    "/uydu/{bina_id}/goruntu",
    response_class=Response,
    responses={200: {"content": {"image/jpeg": {}}}},
    dependencies=[Depends(HizSiniri(ip_basina=20, toplam=100))],
)
def uydu_goruntu(bina_id: int) -> Response:
    """Çatının sarı sınırla işaretli uydu görüntüsü (JPEG, Esri World Imagery); PDF rapor için."""
    sonuc = goruntu(bina_id)
    if not sonuc.basarili:
        raise _hata(sonuc)
    return Response(sonuc.deger, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})
