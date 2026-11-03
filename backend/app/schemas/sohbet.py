from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.hesap import VarsayimlarDto


class Mesaj(BaseModel):
    rol: Literal["kullanici", "asistan"]
    metin: str = Field(min_length=1, max_length=2000)


class SohbetIstegi(BaseModel):
    mesajlar: list[Mesaj] = Field(min_length=1, max_length=20)
    bina_id: int | None = None
    varsayimlar: VarsayimlarDto | None = None  # kaydırıcı değerleri; yoksa varsayılanlar

    @field_validator("mesajlar")
    @classmethod
    def _son_kullanici(cls, v: list[Mesaj]) -> list[Mesaj]:
        if v[-1].rol != "kullanici":
            raise ValueError("son mesaj kullanıcının olmalı")
        return v


class KullanilanArac(BaseModel):
    ad: str
    girdi: dict


class SohbetYaniti(BaseModel):
    cevap: str
    araclar: list[KullanilanArac]
    model: str
