"""Saatlik simülasyon, vardiya, pil, kredi, statik, şebeke ve use case birim testleri."""

from __future__ import annotations

import asyncio
import math

from app.application.hesap import (
    BinaHesapSorgusu,
    SimulasyonSorgusu,
    SiralamaSorgusu,
    TopluHesapSorgusu,
    VarsayimlariGetirSorgusu,
)
from app.domain.hesap import (
    aylik_taksit_hesapla,
    bina_simulasyonu_hesapla,
    kredi_hesapla,
    pil_simule_et,
    saatlik_uretim_kwh_olcekle,
    statik_on_kontrol_hesapla,
    utc_dizisini_turkiye_saatine_kaydir,
    vardiya_tuketim_profili_uret,
)
from app.domain.varliklar import (
    Bina,
    KrediGirdisi,
    PilGirdisi,
    SebekeGirdisi,
)
from app.domain.varsayilanlar import PVGIS_SAAT_SAYISI


class SahteBinaDeposu:
    """Birim testleri için bellekte çalışan sahte BinaDeposu."""

    def __init__(self, binalar: list[Bina]) -> None:
        self._binalar = {b.id: b for b in binalar}

    def hepsi(self) -> list[Bina]:
        return list(self._binalar.values())

    def getir(self, bina_id: int) -> Bina | None:
        return self._binalar.get(bina_id)

    def saatlik_uretim_wh_kwp(self, bina_id: int) -> list[float] | None:
        return None


def test_utc_turkiye_kaydirma() -> None:
    """UTC 10:00'daki tepe üretimin 3 saat kaydırmayla yerel 13:00'a gelmesi."""
    dizi = [0.0] * 24
    dizi[10] = 750.0  # 10:00 UTC
    kaydirilmis = utc_dizisini_turkiye_saatine_kaydir(dizi, fark_saat=3)
    assert kaydirilmis[13] == 750.0
    assert sum(kaydirilmis) == 750.0


def test_saatlik_uretim_olcekleme_yillik_esitligi() -> None:
    """PVGIS 2023 saatlik profil toplamının (ör. 1.312,9 kWh/kWp) binanın yıllık verimine (1.340) ölçeklenmesi."""
    ham_wh = [150.0] * PVGIS_SAAT_SAYISI  # toplam = 1.314 kWh/kWp
    olcekli_kwh = saatlik_uretim_kwh_olcekle(
        saatlik_wh_kwp=ham_wh,
        kwp=500.0,
        verim_kwh_kwp=1340.0,
    )
    assert len(olcekli_kwh) == PVGIS_SAAT_SAYISI
    assert math.isclose(sum(olcekli_kwh), 500.0 * 1340.0, rel_tol=1e-6)


def test_vardiya_profilleri_toplami_ve_oz_tuketim_farki() -> None:
    """Tek, iki ve üç vardiya profillerinin toplam tüketimi koruması ve öz tüketim farkı."""
    yillik_tuketim = 1_000_000.0
    for vardiya in ("tek", "iki", "uc"):
        profil = vardiya_tuketim_profili_uret(yillik_tuketim, vardiya=vardiya)
        assert len(profil) == PVGIS_SAAT_SAYISI
        assert math.isclose(sum(profil), yillik_tuketim, rel_tol=1e-6)

    bina = Bina(id=1, alan_m2=10_000.0, verim_kwh_kwp=1340.0)
    sim_tek = bina_simulasyonu_hesapla(bina, vardiya="tek", yillik_tuketim_kwh=900_000.0)
    sim_iki = bina_simulasyonu_hesapla(bina, vardiya="iki", yillik_tuketim_kwh=900_000.0)
    assert len(sim_iki.gunluk_profil) == 24
    assert 0.0 < sim_tek.oz_tuketim_orani <= 1.0
    assert 0.0 < sim_iki.oz_tuketim_orani <= 1.0


def test_pil_simulasyonu_oz_tuketimi_artirir() -> None:
    """Fazla üretim olan saatlerde pilin şarj olup gece deşarj olarak öz tüketimi artırması."""
    # Gündüz 10 kWh üretim / 2 kWh tüketim; gece 0 üretim / 6 kWh tüketim
    uretim = [10.0, 0.0] * 10
    tuketim = [2.0, 6.0] * 10
    pil = PilGirdisi(kapasite_kwh=10.0, guc_kw=8.0, birim_maliyet_tl_kwh=10000.0, verim=0.90)

    sonuc, sarj, desarj = pil_simule_et(
        saatlik_uretim_kwh=uretim,
        saatlik_tuketim_kwh=tuketim,
        pil_girdisi=pil,
        cati_yatirim_tl=1_000_000.0,
    )
    assert sum(sarj) > 0
    assert sum(desarj) > 0
    assert sonuc.pilli_oz_tuketim_orani > 0.20  # pilsiz doğrudan öz tüketim oranı 2/10 = 0.20
    assert sonuc.ek_tasarruf_tl > 0


def test_kredi_taksit_hesabi() -> None:
    """Anüite formülü: A * r / (1 - (1 + r)^(-n))."""
    taksit = aylik_taksit_hesapla(anapara_tl=1_000_000.0, aylik_faiz_orani=0.02, vade_ay=12)
    beklenen = 1_000_000.0 * 0.02 / (1.0 - (1.02**-12))
    assert math.isclose(taksit, beklenen, rel_tol=1e-9)

    sonuc = kredi_hesapla(
        yatirim_tl=10_000_000.0,
        yillik_tasarruf_tl=4_800_000.0,
        girdi=KrediGirdisi(aylik_faiz_orani=0.02, vade_ay=48, pesinat_orani=0.20),
    )
    assert math.isclose(sonuc.pesinat_tl, 2_000_000.0)
    assert math.isclose(sonuc.anapara_tl, 8_000_000.0)
    assert math.isclose(sonuc.aylik_tasarruf_tl, 400_000.0)
    assert sonuc.tasarruf_taksiti_karsiliyor_mu is True


def test_statik_ve_sebekeye_vermeden() -> None:
    """Statik ön kontrol ve 'şebekeye vermeden' kısıtında fazla üretimin sıfırlanması."""
    st = statik_on_kontrol_hesapla(kwp=580.0, m2_kwp=6.5)
    assert st.tahmini_panel_sayisi == 1000
    assert st.toplam_ek_yuk_min_ton > 0
    assert len(st.kontrol_listesi) >= 4

    bina = Bina(id=5, alan_m2=10_000.0, verim_kwh_kwp=1340.0)
    sim = bina_simulasyonu_hesapla(
        bina=bina,
        vardiya="tek",
        yillik_tuketim_kwh=500_000.0,
        sebeke_girdisi=SebekeGirdisi(sebekeye_vermeden=True),
    )
    assert sim.sebekeye_verilen_mwh == 0.0
    assert sim.kisitlanan_uretim_mwh > 0.0


def test_use_case_sorgulari() -> None:
    """Application katmanı sorgu use case'lerinin uçtan uca kontrolü."""
    binalar = [
        Bina(id=1, ad="Fabrika A", alan_m2=5_000.0, verim_kwh_kwp=1330.0),
        Bina(id=2, ad="Fabrika B", alan_m2=15_000.0, verim_kwh_kwp=1340.0),
    ]
    depo = SahteBinaDeposu(binalar)

    toplu_sonuc = asyncio.run(TopluHesapSorgusu(depo).calistir())
    assert toplu_sonuc.hata is None
    assert toplu_sonuc.deger is not None
    assert toplu_sonuc.deger.osb_ozeti.bina_sayisi == 2

    tek_sonuc = asyncio.run(BinaHesapSorgusu(depo).calistir(bina_id=2))
    assert tek_sonuc.hata is None
    assert tek_sonuc.deger is not None
    assert tek_sonuc.deger.bina_id == 2

    olmayan_sonuc = asyncio.run(BinaHesapSorgusu(depo).calistir(bina_id=999))
    assert olmayan_sonuc.hata is not None
    assert olmayan_sonuc.hata.kod == "bulunamadi"

    sim_sonuc = asyncio.run(
        SimulasyonSorgusu(depo).calistir(
            bina_id=2,
            vardiya="iki",
            pil_girdisi=PilGirdisi(kapasite_kwh=250.0, guc_kw=125.0),
            kredi_girdisi=KrediGirdisi(aylik_faiz_orani=0.025, vade_ay=36, pesinat_orani=0.20),
        )
    )
    assert sim_sonuc.hata is None
    assert sim_sonuc.deger is not None
    assert sim_sonuc.deger.pil is not None
    assert sim_sonuc.deger.kredi is not None

    sirali_sonuc = asyncio.run(SiralamaSorgusu(depo).calistir(adet=1))
    assert sirali_sonuc.hata is None
    assert sirali_sonuc.deger is not None
    assert len(sirali_sonuc.deger) == 1
    assert sirali_sonuc.deger[0].bina_id == 2

    varsayim_sonuc = VarsayimlariGetirSorgusu().calistir()
    assert varsayim_sonuc.hata is None
    assert varsayim_sonuc.deger is not None
    assert len(varsayim_sonuc.deger.kaynaklar) >= 10
