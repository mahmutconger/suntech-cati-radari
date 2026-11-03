from __future__ import annotations

from pydantic import BaseModel


class HataDetay(BaseModel):
    kod: str
    mesaj: str


class HataYaniti(BaseModel):
    hata: HataDetay
