"""Kredi taksit ve aylık tasarruf karşılaştırma hesapları (PROJE.md Bölüm 8)."""

from __future__ import annotations

from app.domain.varliklar import KrediGirdisi, KrediSonucu


def aylik_taksit_hesapla(anapara_tl: float, aylik_faiz_orani: float, vade_ay: int) -> float:
    """Anüite formülü ile aylık eşit kredi taksitini (TL) hesaplar.

    Formül (PROJE.md Bölüm 8):
        Aylık taksit = A * r / (1 - (1 + r)^(-n))
        A: anapara (yatırım - peşinat)
        r: aylık faiz oranı
        n: vade (ay sayısı)
    """
    if anapara_tl <= 0 or vade_ay <= 0:
        return 0.0

    if aylik_faiz_orani <= 0:
        return anapara_tl / vade_ay

    payda = 1.0 - (1.0 + aylik_faiz_orani) ** (-vade_ay)
    if payda <= 0:
        return anapara_tl / vade_ay

    return anapara_tl * aylik_faiz_orani / payda


def kredi_hesapla(
    yatirim_tl: float,
    yillik_tasarruf_tl: float,
    girdi: KrediGirdisi,
) -> KrediSonucu:
    """Yatırım tutarı, yıllık tasarruf ve kredi parametreleri ile finansman tablosunu hesaplar."""
    toplam_yatirim = max(0.0, yatirim_tl)
    pesinat_orani = max(0.0, min(1.0, girdi.pesinat_orani))
    pesinat_tl = toplam_yatirim * pesinat_orani
    anapara_tl = max(0.0, toplam_yatirim - pesinat_tl)

    vade_ay = max(1, int(girdi.vade_ay))
    r = max(0.0, float(girdi.aylik_faiz_orani))

    taksit_tl = aylik_taksit_hesapla(anapara_tl, r, vade_ay)
    toplam_geri_odeme_tl = taksit_tl * vade_ay
    toplam_faiz_tl = max(0.0, toplam_geri_odeme_tl - anapara_tl)

    aylik_tasarruf_tl = max(0.0, yillik_tasarruf_tl) / 12.0
    aylik_net_akis_tl = aylik_tasarruf_tl - taksit_tl

    return KrediSonucu(
        anapara_tl=anapara_tl,
        pesinat_tl=pesinat_tl,
        aylik_faiz_orani=r,
        vade_ay=vade_ay,
        aylik_taksit_tl=taksit_tl,
        toplam_geri_odeme_tl=toplam_geri_odeme_tl,
        toplam_faiz_tl=toplam_faiz_tl,
        aylik_tasarruf_tl=aylik_tasarruf_tl,
        aylik_net_akis_tl=aylik_net_akis_tl,
        tasarruf_taksiti_karsiliyor_mu=aylik_tasarruf_tl >= taksit_tl,
    )
