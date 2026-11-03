from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.schemas.hesap import HesapSonucuDto, VarsayimlarDto


class Tuketim(BaseModel):
    yillik_kwh: float = Field(gt=0, le=1e9)


class KayitIstegi(BaseModel):
    bina_id: int
    varsayimlar: VarsayimlarDto
    tuketim: Tuketim | None = None
    sonuc: HesapSonucuDto

    @model_validator(mode="after")
    def _ayni_bina(self) -> KayitIstegi:
        if self.sonuc.bina_id != self.bina_id:
            raise ValueError("sonuc.bina_id ile bina_id aynı olmalı")
        return self


class Kayit(KayitIstegi):
    id: str
    bina_ad: str = ""
    olusturma: datetime
