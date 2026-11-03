"""Saatlik batarya (pil) şarj/deşarj simülasyonu (%90 gidiş-dönüş verimi, PROJE.md Bölüm 8)."""

from __future__ import annotations

import math
from collections.abc import Sequence

from app.domain.varliklar import PilGirdisi, PilSonucu, Varsayimlar
from app.domain.varsayilanlar import varsayilan_varsayimlar


def pil_simule_et(
    saatlik_uretim_kwh: Sequence[float],
    saatlik_tuketim_kwh: Sequence[float],
    pil_girdisi: PilGirdisi,
    cati_yatirim_tl: float,
    pilsiz_tasarruf_tl: float | None = None,
    varsayimlar: Varsayimlar | None = None,
    sebeke_limit_kw: float | None = None,
) -> tuple[PilSonucu, list[float], list[float]]:
    """Saatlik fazla üretimi pilde depolayıp açık saatlerde deşarj eden batarya simülasyonu.

    Döner:
        (PilSonucu, saatlik_pil_sarj_kwh, saatlik_pil_desarj_kwh)
    """
    v = varsayimlar or varsayilan_varsayimlar()
    n = min(len(saatlik_uretim_kwh), len(saatlik_tuketim_kwh))

    if pilsiz_tasarruf_tl is None:
        pilsiz_oz = sum(
            min(max(0.0, saatlik_uretim_kwh[i]), max(0.0, saatlik_tuketim_kwh[i]))
            for i in range(n)
        )
        pilsiz_fazla = sum(
            max(0.0, saatlik_uretim_kwh[i])
            - min(max(0.0, saatlik_uretim_kwh[i]), max(0.0, saatlik_tuketim_kwh[i]))
            for i in range(n)
        )
        if sebeke_limit_kw is not None:
            pilsiz_fazla = sum(
                min(
                    max(0.0, saatlik_uretim_kwh[i])
                    - min(
                        max(0.0, saatlik_uretim_kwh[i]),
                        max(0.0, saatlik_tuketim_kwh[i]),
                    ),
                    max(0.0, sebeke_limit_kw),
                )
                for i in range(n)
            )
        temel_tasarruf_tl = (
            pilsiz_oz * v.tarife_tl_kwh + pilsiz_fazla * v.fazla_fiyat_tl_kwh
        )
    else:
        temel_tasarruf_tl = pilsiz_tasarruf_tl

    kapasite = max(0.0, pil_girdisi.kapasite_kwh)
    guc = max(0.0, pil_girdisi.guc_kw) if pil_girdisi.guc_kw > 0 else kapasite * 0.5
    verim = max(0.01, min(1.0, pil_girdisi.verim))
    tek_yon_verim = math.sqrt(verim)

    if kapasite <= 0 or n == 0:
        toplam_uretim = sum(saatlik_uretim_kwh[:n])
        dogrudan_oz = sum(
            min(saatlik_uretim_kwh[i], saatlik_tuketim_kwh[i]) for i in range(n)
        )
        oran = (dogrudan_oz / toplam_uretim) if toplam_uretim > 0 else 0.0
        geri_odeme = (
            (cati_yatirim_tl / temel_tasarruf_tl) if temel_tasarruf_tl > 0 else 0.0
        )
        return (
            PilSonucu(
                kapasite_kwh=0.0,
                guc_kw=0.0,
                pil_yatirim_tl=0.0,
                yillik_pil_desarj_mwh=0.0,
                pilli_oz_tuketim_orani=oran,
                ek_tasarruf_tl=0.0,
                toplam_yatirim_tl=cati_yatirim_tl,
                toplam_tasarruf_tl=temel_tasarruf_tl,
                geri_odeme_yil=geri_odeme,
            ),
            [0.0] * n,
            [0.0] * n,
        )

    doluluk_kwh = 0.0
    toplam_oz_tuketim_kwh = 0.0
    toplam_sebekeye_verilen_kwh = 0.0
    toplam_pil_desarj_kwh = 0.0

    sarj_listesi: list[float] = []
    desarj_listesi: list[float] = []

    for i in range(n):
        u = max(0.0, saatlik_uretim_kwh[i])
        t = max(0.0, saatlik_tuketim_kwh[i])

        dogrudan_oz = min(u, t)
        fazla = u - dogrudan_oz
        acik = t - dogrudan_oz

        sarj_kwh = 0.0
        desarj_kwh = 0.0

        if fazla > 0 and doluluk_kwh < kapasite:
            bos_kapasite_giris = (kapasite - doluluk_kwh) / tek_yon_verim
            sarj_kwh = min(fazla, guc, bos_kapasite_giris)
            doluluk_kwh += sarj_kwh * tek_yon_verim
            fazla -= sarj_kwh
        elif acik > 0 and doluluk_kwh > 0:
            max_cikis = doluluk_kwh * tek_yon_verim
            desarj_kwh = min(acik, guc, max_cikis)
            doluluk_kwh -= desarj_kwh / tek_yon_verim
            toplam_pil_desarj_kwh += desarj_kwh

        if sebeke_limit_kw is not None:
            sebekeye_giden = min(fazla, max(0.0, sebeke_limit_kw))
        else:
            sebekeye_giden = fazla

        toplam_oz_tuketim_kwh += dogrudan_oz + desarj_kwh
        toplam_sebekeye_verilen_kwh += sebekeye_giden

        sarj_listesi.append(sarj_kwh)
        desarj_listesi.append(desarj_kwh)

    toplam_uretim_kwh = sum(saatlik_uretim_kwh[:n])
    pilli_oz_oran = (
        min(1.0, toplam_oz_tuketim_kwh / toplam_uretim_kwh)
        if toplam_uretim_kwh > 0
        else 0.0
    )

    toplam_tasarruf_tl = (
        toplam_oz_tuketim_kwh * v.tarife_tl_kwh
        + toplam_sebekeye_verilen_kwh * v.fazla_fiyat_tl_kwh
    )
    ek_tasarruf_tl = toplam_tasarruf_tl - temel_tasarruf_tl

    pil_yatirim_tl = kapasite * max(0.0, pil_girdisi.birim_maliyet_tl_kwh)
    toplam_yatirim_tl = cati_yatirim_tl + pil_yatirim_tl
    geri_odeme_yil = (
        toplam_yatirim_tl / toplam_tasarruf_tl if toplam_tasarruf_tl > 0 else 0.0
    )

    sonuc = PilSonucu(
        kapasite_kwh=kapasite,
        guc_kw=guc,
        pil_yatirim_tl=pil_yatirim_tl,
        yillik_pil_desarj_mwh=toplam_pil_desarj_kwh / 1000.0,
        pilli_oz_tuketim_orani=pilli_oz_tuketim_orani_yuvarla(pilli_oz_oran),
        ek_tasarruf_tl=ek_tasarruf_tl,
        toplam_yatirim_tl=toplam_yatirim_tl,
        toplam_tasarruf_tl=toplam_tasarruf_tl,
        geri_odeme_yil=geri_odeme_yil,
    )
    return sonuc, sarj_listesi, desarj_listesi


def pilli_oz_tuketim_orani_yuvarla(oran: float) -> float:
    """Oranı [0, 1] aralığında tutar."""
    return max(0.0, min(1.0, oran))
