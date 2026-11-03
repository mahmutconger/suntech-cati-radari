from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")


@dataclass
class Hata:
    kod: str
    mesaj: str


@dataclass
class Sonuc(Generic[T]):
    deger: T | None = None
    hata: Hata | None = None

    @property
    def basarili(self) -> bool:
        return self.hata is None

    @staticmethod
    def tamam(deger: T) -> Sonuc[T]:
        return Sonuc(deger=deger)

    @staticmethod
    def hatali(kod: str, mesaj: str) -> Sonuc:
        return Sonuc(hata=Hata(kod=kod, mesaj=mesaj))
