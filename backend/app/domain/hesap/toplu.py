"""Bütün OSB binaları için toplu hesap, özet ve sıralama fonksiyonları (PROJE.md §8 ve §22.3)."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Literal

from app.domain.hesap.yillik import bina_hesapla
from app.domain.varliklar import Bina, HesapSonucu, OsbOzeti, Varsayimlar
from app.domain.varsayilanlar import varsayilan_varsayimlar

SiralamaOlcutu = Literal[
    "tasarruf_tl",
    "kwp",
    "uretim_mwh",
    "co2_ton",
    "geri_odeme_yil",
    "yatirim_tl",
    "uygunluk_skoru",
    "nbd_tl",
]


def osb_binalarini_suz(
    binalar: Sequence[Bina],
    osb: str | None = "manisa",
) -> list[Bina]:
    """Bina listesini seçilen OSB koduna göre süzer (`osb` boş/None olan kayıtlar 'manisa' sayılır)."""
    hedef = (osb or "manisa").strip().lower()
    if not hedef or hedef == "hepsi":
        return list(binalar)
    return [
        b
        for b in binalar
        if (b.osb or "manisa").strip().lower() == hedef
    ]


def osb_ozeti_hesapla(sonuclar: Sequence[HesapSonucu]) -> OsbOzeti:
    """Hesaplanan bina sonuçlarından OSB toplam özetini üretir (toplam NBD ve ortalama skor dahil)."""
    bina_sayisi = len(sonuclar)
    toplam_kwp = sum(s.kwp for s in sonuclar)
    toplam_mwh = sum(s.uretim_mwh for s in sonuclar)
    toplam_tasarruf_tl = sum(s.tasarruf_tl for s in sonuclar)
    toplam_yatirim_tl = sum(s.yatirim_tl for s in sonuclar)
    toplam_co2_ton = sum(s.co2_ton for s in sonuclar)
    toplam_nbd_tl = sum(s.nbd_tl for s in sonuclar)
    ortalama_skor = (
        sum(s.uygunluk_skoru for s in sonuclar) / bina_sayisi
        if bina_sayisi > 0
        else 0.0
    )

    return OsbOzeti(
        bina_sayisi=bina_sayisi,
        toplam_mwp=toplam_kwp / 1000.0,
        toplam_gwh=toplam_mwh / 1000.0,
        toplam_tasarruf_tl=toplam_tasarruf_tl,
        toplam_yatirim_tl=toplam_yatirim_tl,
        toplam_co2_ton=toplam_co2_ton,
        toplam_nbd_tl=toplam_nbd_tl,
        ortalama_skor=ortalama_skor,
    )


def toplu_hesapla(
    binalar: Sequence[Bina],
    varsayimlar: Varsayimlar | None = None,
) -> tuple[list[HesapSonucu], OsbOzeti]:
    """Verilen binaların tamamı için yıllık sonuçları ve OSB özetini hesaplar."""
    v = varsayimlar or varsayilan_varsayimlar()
    sonuclar = [bina_hesapla(bina, v) for bina in binalar]
    ozet = osb_ozeti_hesapla(sonuclar)
    return sonuclar, ozet


def sonuclari_sirala(
    sonuclar: Sequence[HesapSonucu],
    olcut: SiralamaOlcutu = "tasarruf_tl",
    adet: int = 20,
) -> list[HesapSonucu]:
    """Hesap sonuçlarını belirtilen ölçüte göre sıralar.

    Not: 'geri_odeme_yil' ölçütünde pozitif en kısa geri ödeme süresi öne gelir;
    diğer tüm ölçütlerde (tasarruf_tl, uygunluk_skoru, nbd_tl vb.) büyükten küçüğe sıralanır.
    """
    if adet <= 0:
        return []

    gecerli_olcutler = {
        "tasarruf_tl",
        "kwp",
        "uretim_mwh",
        "co2_ton",
        "geri_odeme_yil",
        "yatirim_tl",
        "uygunluk_skoru",
        "nbd_tl",
    }
    alan = olcut if olcut in gecerli_olcutler else "tasarruf_tl"

    if alan == "geri_odeme_yil":
        sirali = sorted(
            sonuclar,
            key=lambda s: (s.geri_odeme_yil <= 0, s.geri_odeme_yil, -s.tasarruf_tl),
        )
    else:
        sirali = sorted(
            sonuclar,
            key=lambda s: (getattr(s, alan, 0.0), s.tasarruf_tl),
            reverse=True,
        )

    return list(sirali[:adet])


def binalari_sirala(
    binalar: Sequence[Bina],
    varsayimlar: Varsayimlar | None = None,
    olcut: SiralamaOlcutu = "tasarruf_tl",
    adet: int = 20,
) -> list[HesapSonucu]:
    """Binaları hesaplayıp belirtilen ölçüte göre ilk `adet` sonucu döner."""
    sonuclar, _ = toplu_hesapla(binalar, varsayimlar)
    return sonuclari_sirala(sonuclar, olcut=olcut, adet=adet)
