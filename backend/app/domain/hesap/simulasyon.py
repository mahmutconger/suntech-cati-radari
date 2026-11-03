"""8.760 saatlik mahsuplaşma, şebeke/trafo sınırı, pil, kredi ve statik birleşik simülasyonu."""

from __future__ import annotations

from collections.abc import Sequence

from app.domain.hesap.kredi import kredi_hesapla
from app.domain.hesap.pil import pil_simule_et
from app.domain.hesap.profil import (
    saatlik_uretim_kwh_olcekle,
    vardiya_tuketim_profili_uret,
)
from app.domain.hesap.statik import statik_on_kontrol_hesapla
from app.domain.hesap.yillik import (
    birim_maliyet_tl_kwp,
    kwp_hesapla,
    yatirim_maliyeti_hesapla,
)
from app.domain.varliklar import (
    Bina,
    KrediGirdisi,
    PilGirdisi,
    SaatlikGunProfili,
    SebekeGirdisi,
    SebekeSonucu,
    SimulasyonSonucu,
    VardiyaTipi,
    Varsayimlar,
)
from app.domain.varsayilanlar import (
    PVGIS_SAAT_SAYISI,
    VARSAYILAN_VERIM_KWH_KWP,
    varsayilan_varsayimlar,
)


def _sebeke_limit_kw_belirle(sebeke: SebekeGirdisi | None) -> float | None:
    """Şebekeye verme kısıtını (kW) belirler.

    - `sebekeye_vermeden=True` -> 0.0 kW (hiçbir fazla enerji şebekeye verilmez)
    - `trafo_kalan_kapasite_mw` girilmişse -> MW * 1000 kW
    - Kısıt yoksa -> None
    """
    if sebeke is None:
        return None
    if sebeke.sebekeye_vermeden:
        return 0.0
    if sebeke.trafo_kalan_kapasite_mw is not None and sebeke.trafo_kalan_kapasite_mw >= 0:
        return float(sebeke.trafo_kalan_kapasite_mw) * 1000.0
    return None


def _gunluk_profil_olustur(
    saatlik_uretim_kwh: Sequence[float],
    saatlik_tuketim_kwh: Sequence[float],
    saatlik_oz_kwh: Sequence[float],
    saatlik_sebeke_kwh: Sequence[float],
    saatlik_pil_sarj_kwh: Sequence[float],
    saatlik_pil_desarj_kwh: Sequence[float],
) -> list[SaatlikGunProfili]:
    """8.760 saati günün 24 saatine (0..23) göre ortalama kW profiline indirger."""
    n = len(saatlik_uretim_kwh)
    gun_sayisi = max(1, n // 24)
    profiller: list[SaatlikGunProfili] = []

    for saat in range(24):
        indeksler = range(saat, n, 24)
        u_ort = sum(saatlik_uretim_kwh[i] for i in indeksler) / gun_sayisi
        t_ort = sum(saatlik_tuketim_kwh[i] for i in indeksler) / gun_sayisi
        oz_ort = sum(saatlik_oz_kwh[i] for i in indeksler) / gun_sayisi
        seb_ort = sum(saatlik_sebeke_kwh[i] for i in indeksler) / gun_sayisi
        sarj_ort = (
            sum(saatlik_pil_sarj_kwh[i] for i in indeksler) / gun_sayisi
            if saatlik_pil_sarj_kwh
            else 0.0
        )
        desarj_ort = (
            sum(saatlik_pil_desarj_kwh[i] for i in indeksler) / gun_sayisi
            if saatlik_pil_desarj_kwh
            else 0.0
        )
        profiller.append(
            SaatlikGunProfili(
                saat=saat,
                uretim_kw=round(u_ort, 2),
                tuketim_kw=round(t_ort, 2),
                oz_tuketim_kw=round(oz_ort, 2),
                sebekeye_verilen_kw=round(seb_ort, 2),
                pil_sarj_kw=round(sarj_ort, 2),
                pil_desarj_kw=round(desarj_ort, 2),
            )
        )
    return profiller


def bina_simulasyonu_hesapla(
    bina: Bina,
    saatlik_wh_kwp: Sequence[float] | None = None,
    varsayimlar: Varsayimlar | None = None,
    vardiya: VardiyaTipi = "iki",
    yillik_tuketim_kwh: float | None = None,
    pil_girdisi: PilGirdisi | None = None,
    kredi_girdisi: KrediGirdisi | None = None,
    sebeke_girdisi: SebekeGirdisi | None = None,
    utc_kaydir: bool = True,
) -> SimulasyonSonucu:
    """Bina için 8.760 saatlik mahsuplaşma, şebeke kısıtı, pil, kredi ve statik simülasyonunu çalıştırır."""
    v = varsayimlar or varsayilan_varsayimlar()
    verim = bina.verim_kwh_kwp if bina.verim_kwh_kwp > 0 else VARSAYILAN_VERIM_KWH_KWP

    kwp = kwp_hesapla(
        alan_m2=bina.alan_m2,
        kullanilabilir_oran=v.kullanilabilir_oran,
        m2_kwp=v.m2_kwp,
        yillik_tuketim_kwh=yillik_tuketim_kwh,
        verim_kwh_kwp=verim,
    )

    ham_yillik_uretim_kwh = kwp * verim
    etkin_tuketim_kwh = (
        yillik_tuketim_kwh
        if (yillik_tuketim_kwh is not None and yillik_tuketim_kwh > 0)
        else ham_yillik_uretim_kwh
    )

    saatlik_uretim_kwh = saatlik_uretim_kwh_olcekle(
        saatlik_wh_kwp=saatlik_wh_kwp,
        kwp=kwp,
        verim_kwh_kwp=verim,
        utc_kaydir=utc_kaydir,
    )
    saatlik_tuketim_kwh = vardiya_tuketim_profili_uret(
        yillik_tuketim_kwh=etkin_tuketim_kwh,
        vardiya=vardiya,
    )

    sebeke_limit_kw = _sebeke_limit_kw_belirle(sebeke_girdisi)

    # Pilsiz saatlik mahsuplaşma
    saatlik_oz_kwh: list[float] = []
    saatlik_sebeke_kwh: list[float] = []
    saatlik_kisitlanan_kwh: list[float] = []

    for i in range(PVGIS_SAAT_SAYISI):
        u = saatlik_uretim_kwh[i]
        t = saatlik_tuketim_kwh[i]
        oz = min(u, t)
        fazla = u - oz

        if sebeke_limit_kw is not None:
            sebekeye_giden = min(fazla, sebeke_limit_kw)
            kisitlanan = max(0.0, fazla - sebekeye_giden)
        else:
            sebekeye_giden = fazla
            kisitlanan = 0.0

        saatlik_oz_kwh.append(oz)
        saatlik_sebeke_kwh.append(sebekeye_giden)
        saatlik_kisitlanan_kwh.append(kisitlanan)

    toplam_uretim_kwh = sum(saatlik_uretim_kwh)
    pilsiz_oz_kwh = sum(saatlik_oz_kwh)
    pilsiz_sebeke_kwh = sum(saatlik_sebeke_kwh)
    pilsiz_kisitlanan_kwh = sum(saatlik_kisitlanan_kwh)

    cati_yatirim_tl = yatirim_maliyeti_hesapla(kwp, v.maliyet_carpani)
    pilsiz_tasarruf_tl = (
        pilsiz_oz_kwh * v.tarife_tl_kwh + pilsiz_sebeke_kwh * v.fazla_fiyat_tl_kwh
    )

    # Pil simülasyonu (istenmişse)
    pil_sonucu = None
    pil_sarj_kwh: list[float] = [0.0] * PVGIS_SAAT_SAYISI
    pil_desarj_kwh: list[float] = [0.0] * PVGIS_SAAT_SAYISI

    if pil_girdisi is not None and pil_girdisi.kapasite_kwh > 0:
        pil_sonucu, pil_sarj_kwh, pil_desarj_kwh = pil_simule_et(
            saatlik_uretim_kwh=saatlik_uretim_kwh,
            saatlik_tuketim_kwh=saatlik_tuketim_kwh,
            pil_girdisi=pil_girdisi,
            cati_yatirim_tl=cati_yatirim_tl,
            pilsiz_tasarruf_tl=pilsiz_tasarruf_tl,
            varsayimlar=v,
            sebeke_limit_kw=sebeke_limit_kw,
        )
        toplam_oz_kwh = pilsiz_oz_kwh + sum(pil_desarj_kwh)
        kalan_fazla_kwh = [
            max(0.0, saatlik_uretim_kwh[i] - saatlik_oz_kwh[i] - pil_sarj_kwh[i])
            for i in range(PVGIS_SAAT_SAYISI)
        ]
        if sebeke_limit_kw is not None:
            saatlik_sebeke_kwh = [min(f, sebeke_limit_kw) for f in kalan_fazla_kwh]
            saatlik_kisitlanan_kwh = [
                max(0.0, f - min(f, sebeke_limit_kw)) for f in kalan_fazla_kwh
            ]
        else:
            saatlik_sebeke_kwh = kalan_fazla_kwh
            saatlik_kisitlanan_kwh = [0.0] * PVGIS_SAAT_SAYISI

        toplam_sebeke_kwh = sum(saatlik_sebeke_kwh)
        toplam_kisitlanan_kwh = sum(saatlik_kisitlanan_kwh)
        etkin_oz_oran = pil_sonucu.pilli_oz_tuketim_orani
        etkin_tasarruf_tl = pil_sonucu.toplam_tasarruf_tl
        etkin_yatirim_tl = pil_sonucu.toplam_yatirim_tl
        etkin_geri_odeme_yil = pil_sonucu.geri_odeme_yil
    else:
        toplam_oz_kwh = pilsiz_oz_kwh
        toplam_sebeke_kwh = pilsiz_sebeke_kwh
        toplam_kisitlanan_kwh = pilsiz_kisitlanan_kwh
        etkin_oz_oran = (
            (toplam_oz_kwh / toplam_uretim_kwh) if toplam_uretim_kwh > 0 else 0.0
        )
        etkin_tasarruf_tl = pilsiz_tasarruf_tl
        etkin_yatirim_tl = cati_yatirim_tl
        etkin_geri_odeme_yil = (
            (etkin_yatirim_tl / etkin_tasarruf_tl) if etkin_tasarruf_tl > 0 else 0.0
        )

    etkin_uretim_kwh = max(0.0, toplam_uretim_kwh - toplam_kisitlanan_kwh)
    co2_ton = (etkin_uretim_kwh / 1000.0) * v.emisyon_faktoru

    sebeke_sonucu = SebekeSonucu(
        sebekeye_vermeden=bool(sebeke_girdisi and sebeke_girdisi.sebekeye_vermeden),
        trafo_kapasite_kw=sebeke_limit_kw,
        sebekeye_verilen_mwh=toplam_sebeke_kwh / 1000.0,
        kisitlanan_uretim_mwh=toplam_kisitlanan_kwh / 1000.0,
        etkin_uretim_mwh=etkin_uretim_kwh / 1000.0,
    )

    kredi_sonucu = None
    if kredi_girdisi is not None:
        kredi_sonucu = kredi_hesapla(
            yatirim_tl=etkin_yatirim_tl,
            yillik_tasarruf_tl=etkin_tasarruf_tl,
            girdi=kredi_girdisi,
        )

    statik_sonucu = statik_on_kontrol_hesapla(kwp=kwp, m2_kwp=v.m2_kwp)

    gunluk_profil = _gunluk_profil_olustur(
        saatlik_uretim_kwh=saatlik_uretim_kwh,
        saatlik_tuketim_kwh=saatlik_tuketim_kwh,
        saatlik_oz_kwh=[
            saatlik_oz_kwh[i] + pil_desarj_kwh[i] for i in range(PVGIS_SAAT_SAYISI)
        ],
        saatlik_sebeke_kwh=saatlik_sebeke_kwh,
        saatlik_pil_sarj_kwh=pil_sarj_kwh,
        saatlik_pil_desarj_kwh=pil_desarj_kwh,
    )

    return SimulasyonSonucu(
        bina_id=bina.id,
        kwp=kwp,
        vardiya=vardiya,
        yillik_tuketim_mwh=etkin_tuketim_kwh / 1000.0,
        uretim_mwh=toplam_uretim_kwh / 1000.0,
        oz_tuketim_mwh=toplam_oz_kwh / 1000.0,
        sebekeye_verilen_mwh=toplam_sebeke_kwh / 1000.0,
        kisitlanan_uretim_mwh=toplam_kisitlanan_kwh / 1000.0,
        oz_tuketim_orani=etkin_oz_oran,
        tasarruf_tl=etkin_tasarruf_tl,
        yatirim_tl=etkin_yatirim_tl,
        geri_odeme_yil=etkin_geri_odeme_yil,
        co2_ton=co2_ton,
        statik=statik_sonucu,
        sebeke=sebeke_sonucu,
        pil=pil_sonucu,
        kredi=kredi_sonucu,
        gunluk_profil=gunluk_profil,
    )
