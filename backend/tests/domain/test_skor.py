"""Uygunluk skoru (0-100) ve OSB süzgeci birim testleri (PROJE.md §22.3)."""

from __future__ import annotations

from app.domain.hesap import (
    bina_hesapla,
    binalari_sirala,
    osb_binalarini_suz,
    toplu_hesapla,
    uygunluk_skoru_hesapla,
)
from app.domain.varliklar import Bina


def test_uygunluk_skoru_aralik_ve_agirliklar() -> None:
    """Uygunluk skoru 0-100 aralığında olmalı ve daha iyi parametrelerle yükselmelidir."""
    skor_ideal = uygunluk_skoru_hesapla(
        geri_odeme_yil=3.2,
        verim_kwh_kwp=1345.0,
        kwp=1500.0,
        trafo_mesafe_km=0.4,
        mevcut_ges=False,
    )
    skor_zayif = uygunluk_skoru_hesapla(
        geri_odeme_yil=6.8,
        verim_kwh_kwp=1270.0,
        kwp=90.0,
        trafo_mesafe_km=4.5,
        mevcut_ges=True,
    )

    assert 0.0 <= skor_zayif < skor_ideal <= 100.0
    assert skor_ideal > 85.0
    assert skor_zayif < 35.0


def test_mevcut_ges_varsa_skor_sifir() -> None:
    """Çatıda zaten panel varsa, diğer bileşenler ne kadar iyi olursa olsun skor 0 olmalı."""
    ortak = dict(geri_odeme_yil=3.2, verim_kwh_kwp=1345.0, kwp=1500.0, trafo_mesafe_km=0.4)
    assert uygunluk_skoru_hesapla(**ortak, mevcut_ges=False) > 85.0
    assert uygunluk_skoru_hesapla(**ortak, mevcut_ges=True) == 0.0


def test_trafo_mesafesi_yoksa_notr_bilesen() -> None:
    """PROJE.md §22.3 ve §22.5: `trafo_mesafe_km` yoksa (None) o bileşen nötr (5 puan) kalmalıdır."""
    skor_yakin = uygunluk_skoru_hesapla(
        geri_odeme_yil=4.2,
        verim_kwh_kwp=1330.0,
        kwp=500.0,
        trafo_mesafe_km=0.0,
        mevcut_ges=False,
    )
    skor_notr = uygunluk_skoru_hesapla(
        geri_odeme_yil=4.2,
        verim_kwh_kwp=1330.0,
        kwp=500.0,
        trafo_mesafe_km=None,
        mevcut_ges=False,
    )
    skor_uzak = uygunluk_skoru_hesapla(
        geri_odeme_yil=4.2,
        verim_kwh_kwp=1330.0,
        kwp=500.0,
        trafo_mesafe_km=6.0,
        mevcut_ges=False,
    )

    assert skor_uzak < skor_notr < skor_yakin
    # Nötr (None) ile 2,5 km (tam orta mesafe) aynı puanı vermeli
    skor_orta = uygunluk_skoru_hesapla(
        geri_odeme_yil=4.2,
        verim_kwh_kwp=1330.0,
        kwp=500.0,
        trafo_mesafe_km=2.5,
        mevcut_ges=False,
    )
    assert skor_notr == skor_orta


def test_osb_suzgeci_ve_yeni_siralama_olcutleri() -> None:
    """OSB süzgeci ve `uygunluk_skoru` / `nbd_tl` sıralama ölçütleri kontrolü."""
    binalar = [
        Bina(id=1, alan_m2=15_000.0, verim_kwh_kwp=1340.0, osb="manisa", mevcut_ges=False),
        Bina(id=2, alan_m2=3_000.0, verim_kwh_kwp=1300.0, osb="manisa", mevcut_ges=True),
        Bina(id=3, alan_m2=12_000.0, verim_kwh_kwp=1335.0, osb="akhisar", mevcut_ges=False),
    ]

    manisa_binalari = osb_binalarini_suz(binalar, "manisa")
    akhisar_binalari = osb_binalarini_suz(binalar, "akhisar")
    assert [b.id for b in manisa_binalari] == [1, 2]
    assert [b.id for b in akhisar_binalari] == [3]

    _, ozet = toplu_hesapla(manisa_binalari)
    assert ozet.bina_sayisi == 2
    assert ozet.toplam_nbd_tl > 0
    assert 0 < ozet.ortalama_skor <= 100

    skor_sirali = binalari_sirala(manisa_binalari, olcut="uygunluk_skoru", adet=2)
    assert skor_sirali[0].bina_id == 1

    nbd_sirali = binalari_sirala(manisa_binalari, olcut="nbd_tl", adet=2)
    assert nbd_sirali[0].bina_id == 1

    s1 = bina_hesapla(binalar[0])
    assert s1.uygunluk_skoru > 0
