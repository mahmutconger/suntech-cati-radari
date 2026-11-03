"""25 yıllık yatırım finansmanı: NBD (NPV), İVO (IRR - ikiye bölme), LCOE ve nakit akışı (PROJE.md §22.3)."""

from __future__ import annotations

from collections.abc import Sequence

from app.domain.varliklar import FinansOzeti, Varsayimlar, YillikNakitAkisi
from app.domain.varsayilanlar import varsayilan_varsayimlar


def nbd_hesapla(
    yatirim_tl: float,
    yillik_net_akislar: Sequence[float],
    iskonto_orani: float = 0.08,
) -> float:
    """Verilen başlangıç yatırımı ve yıllık net nakit akışları için Net Bugünkü Değeri (NBD / NPV) hesaplar."""
    if yatirim_tl <= 0 and not yillik_net_akislar:
        return 0.0

    r = max(-0.99, iskonto_orani)
    bugunku_deger = 0.0
    for t, akis in enumerate(yillik_net_akislar, start=1):
        bugunku_deger += akis / ((1.0 + r) ** t)

    return bugunku_deger - yatirim_tl


def ic_verim_orani_hesapla(
    yatirim_tl: float,
    yillik_net_akislar: Sequence[float],
    iterasyon_sayisi: int = 80,
) -> float:
    """İkiye bölme (bisection) yöntemiyle İç Verim Oranını (İVO / IRR) hesaplar (numpy kullanılmaz).

    NBD(r) = -yatirim_tl + sum_{t=1..N} net_akis_t / (1 + r)^t = 0 denkleminin kökünü arar.
    """
    if yatirim_tl <= 0 or not yillik_net_akislar:
        return 0.0

    toplam_pozitif = sum(a for a in yillik_net_akislar if a > 0)
    if toplam_pozitif <= 0:
        return 0.0

    alt = -0.90
    ust = 5.0

    nbd_alt = nbd_hesapla(yatirim_tl, yillik_net_akislar, alt)
    nbd_ust = nbd_hesapla(yatirim_tl, yillik_net_akislar, ust)

    if nbd_alt <= 0:
        return alt
    if nbd_ust >= 0:
        return ust

    orta = 0.0
    for _ in range(iterasyon_sayisi):
        orta = (alt + ust) * 0.5
        nbd_orta = nbd_hesapla(yatirim_tl, yillik_net_akislar, orta)
        if abs(nbd_orta) < 1e-5:
            return orta
        if nbd_orta > 0:
            alt = orta
        else:
            ust = orta

    return orta


def lcoe_hesapla(
    yatirim_tl: float,
    yillik_uretim_mwh_listesi: Sequence[float],
    yillik_bakim_tl_listesi: Sequence[float],
    iskonto_orani: float = 0.08,
) -> float:
    """Seviyelendirilmiş Elektrik Maliyetini (LCOE, TL/kWh) hesaplar.

    Formül:
        LCOE = (I_0 + sum_{t=1..N} Bakim_t / (1 + r)^t) / (sum_{t=1..N} Uretim_kWh_t / (1 + r)^t)
    """
    if yatirim_tl <= 0 or not yillik_uretim_mwh_listesi:
        return 0.0

    r = max(-0.99, iskonto_orani)
    indirgenmis_maliyet_tl = yatirim_tl
    indirgenmis_uretim_kwh = 0.0

    for t, uretim_mwh in enumerate(yillik_uretim_mwh_listesi, start=1):
        carpan = (1.0 + r) ** t
        bakim_tl = yillik_bakim_tl_listesi[t - 1] if t - 1 < len(yillik_bakim_tl_listesi) else 0.0
        indirgenmis_maliyet_tl += bakim_tl / carpan
        indirgenmis_uretim_kwh += (uretim_mwh * 1000.0) / carpan

    if indirgenmis_uretim_kwh <= 0:
        return 0.0

    return indirgenmis_maliyet_tl / indirgenmis_uretim_kwh


def yillik_nakit_akisi_hesapla(
    ilk_yil_uretim_mwh: float,
    ilk_yil_tasarruf_tl: float,
    yatirim_tl: float,
    varsayimlar: Varsayimlar | None = None,
) -> list[YillikNakitAkisi]:
    """Sistem ömrü (varsayılan 25 yıl) boyunca yıllık üretim, tasarruf, bakım, net ve kümülatif akışı üretir."""
    v = varsayimlar or varsayilan_varsayimlar()
    omur = max(1, int(v.omur_yil))

    if ilk_yil_uretim_mwh <= 0 or yatirim_tl <= 0:
        return [
            YillikNakitAkisi(
                yil=yil,
                uretim_mwh=0.0,
                tasarruf_tl=0.0,
                bakim_tl=0.0,
                net_akis_tl=0.0,
                kumulatif_tl=0.0,
            )
            for yil in range(1, omur + 1)
        ]

    d = max(0.0, min(0.20, v.degradasyon))
    g = max(-0.50, min(1.0, v.tarife_artisi))
    bakim_yillik_tl = yatirim_tl * max(0.0, v.bakim_orani)

    kumulatif = -yatirim_tl
    satirlar: list[YillikNakitAkisi] = []

    for yil in range(1, omur + 1):
        yaslanma_carpani = (1.0 - d) ** (yil - 1)
        tarife_carpani = (1.0 + g) ** (yil - 1)

        uretim_mwh = ilk_yil_uretim_mwh * yaslanma_carpani
        tasarruf_tl = ilk_yil_tasarruf_tl * yaslanma_carpani * tarife_carpani
        net_akis_tl = tasarruf_tl - bakim_yillik_tl
        kumulatif += net_akis_tl

        satirlar.append(
            YillikNakitAkisi(
                yil=yil,
                uretim_mwh=uretim_mwh,
                tasarruf_tl=tasarruf_tl,
                bakim_tl=bakim_yillik_tl,
                net_akis_tl=net_akis_tl,
                kumulatif_tl=kumulatif,
            )
        )

    return satirlar


def finans_ozeti_hesapla(
    ilk_yil_uretim_mwh: float,
    ilk_yil_tasarruf_tl: float,
    yatirim_tl: float,
    varsayimlar: Varsayimlar | None = None,
) -> FinansOzeti:
    """25 yıllık nakit akışı tablosunu ve NBD, İVO, 25Y Net Kazanç, LCOE özet metriklerini hesaplar."""
    v = varsayimlar or varsayilan_varsayimlar()
    if ilk_yil_uretim_mwh <= 0 or yatirim_tl <= 0:
        return FinansOzeti(
            nbd_tl=0.0,
            ic_verim_orani=0.0,
            net_kazanc_25y_tl=0.0,
            lcoe_tl_kwh=0.0,
            yillik_akislar=[],
        )

    satirlar = yillik_nakit_akisi_hesapla(
        ilk_yil_uretim_mwh=ilk_yil_uretim_mwh,
        ilk_yil_tasarruf_tl=ilk_yil_tasarruf_tl,
        yatirim_tl=yatirim_tl,
        varsayimlar=v,
    )
    net_akislar = [s.net_akis_tl for s in satirlar]
    uretimler_mwh = [s.uretim_mwh for s in satirlar]
    bakimlar_tl = [s.bakim_tl for s in satirlar]

    nbd = nbd_hesapla(yatirim_tl, net_akislar, v.iskonto_orani)
    ivo = ic_verim_orani_hesapla(yatirim_tl, net_akislar)
    net_kazanc_25y = satirlar[-1].kumulatif_tl if satirlar else 0.0
    lcoe = lcoe_hesapla(yatirim_tl, uretimler_mwh, bakimlar_tl, v.iskonto_orani)

    return FinansOzeti(
        nbd_tl=nbd,
        ic_verim_orani=ivo,
        net_kazanc_25y_tl=net_kazanc_25y,
        lcoe_tl_kwh=lcoe,
        yillik_akislar=satirlar,
    )
