from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.application.sohbet import cevapla
from app.core.hiz_siniri import HizSiniri
from app.infrastructure.gemini import GeminiHatasi
from app.schemas.sohbet import SohbetIstegi, SohbetYaniti

router = APIRouter(tags=["sohbet"])


@router.post("/sohbet", response_model=SohbetYaniti, dependencies=[Depends(HizSiniri(ip_basina=10, toplam=60))])
def sohbet(istek: SohbetIstegi) -> dict:
    """Asistan. Konuşma geçmişini istemci tutar; her istekte son mesajlar gönderilir."""
    try:
        return cevapla([m.model_dump() for m in istek.mesajlar[-10:]], istek.bina_id, istek.varsayimlar)
    except GeminiHatasi:
        raise HTTPException(503, detail={"kod": "asistan_mesgul", "mesaj": "Asistan şu an yanıt veremiyor, biraz sonra tekrar deneyin."})
