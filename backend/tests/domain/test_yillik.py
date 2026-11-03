"""Yıllık ve toplu hesap motoru birim testleri (PROJE.md Bölüm 8 ve 17 kontrol testleri)."""

from __future__ import annotations

import math

from app.domain.hesap import (
    bina_hesapla,
    binalari_sirala,
    birim_maliyet_tl_kwp,
    kwp_hesapla,
    kwp_icin_hesapla,
    toplu_hesapla,
)
from app.domain.varliklar import Bina, Varsayimlar
from app.domain.varsayilanlar import varsayilan_varsayimlar


def test_kontrol_testi_1000_kwp() -> None:
    """PROJE.md Bölüm 8 kontrol testi:
    1.000 kWp ve 1.340 kWh/kWp için:
    - 1.340 MWh/yıl üretim
    - 5,96 milyon TL/yıl tasarruf
    - 21,2 milyon TL yatırım
    - 3,6 yıl geri ödeme
    - 836 tCO2/yıl
    """
    sonuc = kwp_icin_hesapla(kwp=1000.0, verim_kwh_kwp=1340.0, bina_id=1)

    assert math.isclose(sonuc.uretim_mwh, 1340.0, rel_tol=1e-6)
    assert round(sonuc.tasarruf_tl / 1_000_000, 2) == 5.96
    assert round(sonuc.yatirim_tl / 1_000_000, 1) == 21.2
    assert round(sonuc.geri_odeme_yil, 1) == 3.6
    assert round(sonuc.co2_ton) == 836


def test_ornek_catilar_tablosu() -> None:
    """PROJE.md Bölüm 17 örnek çatılar tablosu (100, 500, 1.000 kWp ve 10.000 m² çatı)."""
    s100 = kwp_icin_hesapla(kwp=100.0, verim_kwh_kwp=1340.0)
    assert round(s100.uretim_mwh) == 134
    assert round(s100.tasarruf_tl / 1_000_000, 2) == 0.60
    assert round(s100.yatirim_tl / 1_000_000, 2) == 3.15
    assert round(s100.geri_odeme_yil, 1) == 5.3
    assert round(s100.co2_ton) == 84

    s500 = kwp_icin_hesapla(kwp=500.0, verim_kwh_kwp=1340.0)
    assert round(s500.uretim_mwh) == 670
    assert round(s500.tasarruf_tl / 1_000_000, 2) == 2.98
    assert round(s500.yatirim_tl / 1_000_000, 1) == 12.8
    assert round(s500.geri_odeme_yil, 1) == 4.3
    assert round(s500.co2_ton) == 418

    # 10.000 m²'lik çatı: %45 -> 4.500 m², 692 kWp, 928 MWh, 4,1 M TL tasarruf, 17,8 M TL yatırım, 4,3 yıl, 579 tCO2
    bina_10k = Bina(id=10, alan_m2=10_000.0, verim_kwh_kwp=1340.0)
    s10k = bina_hesapla(bina_10k)
    assert round(s10k.kwp) == 692
    assert round(s10k.uretim_mwh) == 928
    assert round(s10k.tasarruf_tl / 1_000_000, 1) == 4.1
    assert round(s10k.yatirim_tl / 1_000_000, 1) == 17.8
    assert round(s10k.geri_odeme_yil, 1) == 4.3
    assert round(s10k.co2_ton) == 579


def test_maliyet_kademeleri() -> None:
    """Kademeli birim maliyet sınırları kontrolü."""
    assert birim_maliyet_tl_kwp(100.0) == 31500.0
    assert birim_maliyet_tl_kwp(250.0) == 31500.0
    assert birim_maliyet_tl_kwp(250.1) == 25650.0
    assert birim_maliyet_tl_kwp(999.9) == 25650.0
    assert birim_maliyet_tl_kwp(1000.0) == 21200.0
    assert birim_maliyet_tl_kwp(2500.0, maliyet_carpani=1.1) == 21200.0 * 1.1


def test_tuketim_siniri_boyutlama() -> None:
    """Tüketim girildiğinde kurulu gücün tüketim ÷ verim ile sınırlandırılması."""
    # Çatı alanı 10.000 m² normalde ~692.3 kWp alır; tüketim 268.000 kWh ise 268.000 / 1.340 = 200 kWp olmalı
    kwp = kwp_hesapla(
        alan_m2=10_000.0,
        kullanilabilir_oran=0.45,
        m2_kwp=6.5,
        yillik_tuketim_kwh=268_000.0,
        verim_kwh_kwp=1340.0,
    )
    assert math.isclose(kwp, 200.0, rel_tol=1e-6)


def test_toplu_hesap_ve_siralama() -> None:
    """OSB toplu hesabı ve yıllık tasarrufa göre sıralama kontrolü."""
    binalar = [
        Bina(id=1, ad="Kucuk Fabrika", alan_m2=2_000.0, verim_kwh_kwp=1320.0),
        Bina(id=2, ad="Buyuk Fabrika", alan_m2=20_000.0, verim_kwh_kwp=1340.0),
        Bina(id=3, ad="Orta Fabrika", alan_m2=8_000.0, verim_kwh_kwp=1330.0),
    ]
    v = varsayilan_varsayimlar()
    sonuclar, ozet = toplu_hesapla(binalar, v)

    assert len(sonuclar) == 3
    assert ozet.bina_sayisi == 3
    assert math.isclose(
        ozet.toplam_mwp, sum(s.kwp for s in sonuclar) / 1000.0, rel_tol=1e-6
    )

    sirali = binalari_sirala(binalar, v, olcut="tasarruf_tl", adet=2)
    assert len(sirali) == 2
    assert sirali[0].bina_id == 2
    assert sirali[1].bina_id == 3

    geri_odeme_sirali = binalari_sirala(
        binalar, Varsayimlar(), olcut="geri_odeme_yil", adet=3
    )
    assert geri_odeme_sirali[0].bina_id == 2  # en büyük çatı en düşük birim maliyetle en hızlı geri öder
