from __future__ import annotations

from app.core.firebase import get_firestore_client


class VeritabaniHatasi(Exception):
    pass


# ponytail: süreç içi önbellek (~400 bina, ~10 trafo); veri hattı yeniden çalışınca sunucu yeniden başlatılmalı
_onbellek: dict[str, list[dict]] = {}


def _koleksiyon(ad: str) -> list[dict]:
    if ad not in _onbellek:
        try:
            _onbellek[ad] = [d.to_dict() for d in get_firestore_client().collection(ad).stream()]
        except Exception as e:
            raise VeritabaniHatasi(ad) from e
    return _onbellek[ad]


def binalar() -> list[dict]:
    return _koleksiyon("binalar")


def trafolar() -> list[dict]:
    return _koleksiyon("trafo_merkezleri")


class HesapDeposu:
    """Mehmet'in hesap use case'lerinin beklediği BinaDeposu; aynı önbelleği kullanır."""

    def hepsi(self) -> list[dict]:
        return binalar()

    def getir(self, bina_id: int) -> dict | None:
        return next((b for b in binalar() if b["osm_id"] == bina_id), None)
