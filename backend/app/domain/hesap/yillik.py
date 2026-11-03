"""Yıllık deterministik güneş enerjisi ve yatırım hesap fonksiyonları (PROJE.md Bölüm 8)."""

from __future__ import annotations

from app.domain.varliklar import Bina, HesapSonucu, Varsayimlar
from app.domain.varsayilanlar import (
    MALIYET_BUYUK_TL_KWP,
    MALIYET_KADEME_BUYUK_SINIR_KWP,
    MALIYET_KADEME_KUCUK_SINIR_KWP,
    MALIYET_KUCUK_TL_KWP,
    MALIYET_ORTA_TL_KWP,
    VARSAYILAN_VERIM_KWH_KWP,
    varsayilan_varsayimlar,
)


def birim_maliyet_tl_kwp(kwp: float, maliyet_carpani: float = 1.0) -> float:
    """Kurulu güce (kWp) göre kademeli birim kurulum maliyetini (TL/kWp) döner.

    Kademeler (PROJE.md Bölüm 16-17):
    - <= 250 kWp      -> 31.500 TL/kWp
    - 250 - 1.000 kWp -> 25.650 TL/kWp
    - >= 1.000 kWp    -> 21.200 TL/kWp
    """
    if kwp <= MALIYET_KADEME_KUCUK_SINIR_KWP:
        taban = MALIYET_KUCUK_TL_KWP
    elif kwp < MALIYET_KADEME_BUYUK_SINIR_KWP:
        taban = MALIYET_ORTA_TL_KWP
    else:
        taban = MALIYET_BUYUK_TL_KWP
    return taban * maliyet_carpani


def kwp_hesapla(
    alan_m2: float,
    kullanilabilir_oran: float = 0.45,
    m2_kwp: float = 6.5,
    yillik_tuketim_kwh: float | None = None,
    verim_kwh_kwp: float = VARSAYILAN_VERIM_KWH_KWP,
) -> float:
    """Çatı alanına ve varsa yıllık tüketime göre kurulabilir gücü (kWp) hesaplar.

    Formül:
        kwp = alan_m2 * kullanilabilir_oran / m2_kwp
        Tüketim girildiyse üst sınır: yillik_tuketim_kwh / verim_kwh_kwp
    """
    if alan_m2 <= 0 or kullanilabilir_oran <= 0 or m2_kwp <= 0:
        return 0.0

    cati_kwp = (alan_m2 * kullanilabilir_oran) / m2_kwp

    if yillik_tuketim_kwh is not None and yillik_tuketim_kwh > 0 and verim_kwh_kwp > 0:
        tuketim_siniri_kwp = yillik_tuketim_kwh / verim_kwh_kwp
        return min(cati_kwp, tuketim_siniri_kwp)

    return cati_kwp


def kwp_icin_hesapla(
    kwp: float,
    verim_kwh_kwp: float = VARSAYILAN_VERIM_KWH_KWP,
    varsayimlar: Varsayimlar | None = None,
    bina_id: int = 0,
) -> HesapSonucu:
    """Verilen kurulu güç (kWp) ve özgül üretim için yıllık üretim ve finansal sonuçları hesaplar."""
    v = varsayimlar or varsayilan_varsayimlar()

    if kwp <= 0 or verim_kwh_kwp <= 0:
        return HesapSonucu(
            bina_id=bina_id,
            kwp=0.0,
            uretim_mwh=0.0,
            tasarruf_tl=0.0,
            yatirim_tl=0.0,
            geri_odeme_yil=0.0,
            co2_ton=0.0,
        )

    uretim_kwh = kwp * verim_kwh_kwp
    uretim_mwh = uretim_kwh / 1000.0

    oz = max(0.0, min(1.0, v.oz_tuketim_orani))
    birim_gelir_tl_kwh = oz * v.tarife_tl_kwh + (1.0 - oz) * v.fazla_fiyat_tl_kwh
    tasarruf_tl = uretim_kwh * birim_gelir_tl_kwh

    yatirim_tl = kwp * birim_maliyet_tl_kwp(kwp, v.maliyet_carpani)
    geri_odeme_yil = (yatirim_tl / tasarruf_tl) if tasarruf_tl > 0 else 0.0
    co2_ton = uretim_mwh * v.emisyon_faktoru

    return HesapSonucu(
        bina_id=bina_id,
        kwp=kwp,
        uretim_mwh=uretim_mwh,
        tasarruf_tl=tasarruf_tl,
        yatirim_tl=yatirim_tl,
        geri_odeme_yil=geri_odeme_yil,
        co2_ton=co2_ton,
    )


def bina_hesapla(
    bina: Bina,
    varsayimlar: Varsayimlar | None = None,
    yillik_tuketim_kwh: float | None = None,
) -> HesapSonucu:
    """Bina varlığı için kurulu gücü ve yıllık yatırım analizini hesaplar."""
    v = varsayimlar or varsayilan_varsayimlar()
    verim = bina.verim_kwh_kwp if bina.verim_kwh_kwp > 0 else VARSAYILAN_VERIM_KWH_KWP

    kwp = kwp_hesapla(
        alan_m2=bina.alan_m2,
        kullanilabilir_oran=v.kullanilabilir_oran,
        m2_kwp=v.m2_kwp,
        yillik_tuketim_kwh=yillik_tuketim_kwh,
        verim_kwh_kwp=verim,
    )
    return kwp_icin_hesapla(
        kwp=kwp,
        verim_kwh_kwp=verim,
        varsayimlar=v,
        bina_id=bina.id,
    )
