"""25 yıllık finans (NBD, İVO, LCOE, nakit akışı) birim testleri (PROJE.md §17 ve §22.3)."""

from __future__ import annotations

import math

from app.domain.hesap import (
    bina_finans_hesapla,
    finans_ozeti_hesapla,
    ic_verim_orani_hesapla,
    kwp_icin_hesapla,
    lcoe_hesapla,
    nbd_hesapla,
    yillik_nakit_akisi_hesapla,
)
from app.domain.varliklar import Bina, Varsayimlar


def test_nbd_ve_ivo_tutarliligi() -> None:
    """Bulunan iç verim oranında (İVO / IRR) NBD sıfıra çok yakın olmalıdır."""
    yatirim = 12_825_000.0
    akislar = [2_800_000.0 * ((1.0 - 0.005) ** i) for i in range(25)]

    ivo = ic_verim_orani_hesapla(yatirim, akislar)
    assert 0.15 < ivo < 0.30

    nbd_ivo_noktasinda = nbd_hesapla(yatirim, akislar, iskonto_orani=ivo)
    assert abs(nbd_ivo_noktasinda) < 1.0


def test_ornek_catilar_25_yillik_finans() -> None:
    """PROJE.md §17 örnek çatılarının (100, 500, 1.000 kWp) 25 yıllık finans metrikleri kontrolü."""
    s100 = kwp_icin_hesapla(kwp=100.0, verim_kwh_kwp=1340.0)
    s500 = kwp_icin_hesapla(kwp=500.0, verim_kwh_kwp=1340.0)
    s1000 = kwp_icin_hesapla(kwp=1000.0, verim_kwh_kwp=1340.0)

    # Üç ölçekte de NBD pozitif ve ölçek büyüdükçe birim maliyet düştüğü için İVO artmalı
    assert s100.nbd_tl > 0
    assert s500.nbd_tl > s100.nbd_tl
    assert s1000.nbd_tl > s500.nbd_tl

    assert s100.ic_verim_orani > 0.14
    assert s500.ic_verim_orani > s100.ic_verim_orani
    assert s1000.ic_verim_orani > s500.ic_verim_orani

    # LCOE, şebeke sanayi tarifesinden (4,81 TL/kWh) belirgin biçimde düşük olmalı
    assert 1.5 < s100.lcoe_tl_kwh < 3.0
    assert 1.2 < s500.lcoe_tl_kwh < s100.lcoe_tl_kwh
    assert 1.0 < s1000.lcoe_tl_kwh < s500.lcoe_tl_kwh

    # 25 yıllık kümülatif net kazanç pozitif ve NBD'den büyük olmalı (iskonto uygulanmadığı için)
    assert s500.net_kazanc_25y_tl > s500.nbd_tl > 0


def test_25_yillik_nakit_akisi_tablosu() -> None:
    """25 yıllık nakit akışı satırlarının uzunluğu, degradasyon ve kümülatif toplam kontrolü."""
    bina = Bina(id=42, alan_m2=10_000.0, verim_kwh_kwp=1340.0)
    v = Varsayimlar(omur_yil=25, degradasyon=0.005, bakim_orani=0.01, iskonto_orani=0.08, tarife_artisi=0.0)
    ozet = bina_finans_hesapla(bina, v)

    assert len(ozet.yillik_akislar) == 25
    ilk = ozet.yillik_akislar[0]
    son = ozet.yillik_akislar[-1]

    assert ilk.yil == 1
    assert son.yil == 25
    # Degradasyon nedeniyle 25. yıl üretimi 1. yıldan düşük olmalı: (1 - 0.005)^24
    assert math.isclose(son.uretim_mwh, ilk.uretim_mwh * (0.995**24), rel_tol=1e-6)
    # Son yılın kümülatif değeri 25 yıllık net kazanca eşit olmalı
    assert math.isclose(son.kumulatif_tl, ozet.net_kazanc_25y_tl, rel_tol=1e-6)


def test_sifir_girdi_finans_korumasi() -> None:
    """Sıfır yatırım veya sıfır üretim durumunda hata vermeden sıfır dönmelidir."""
    ozet = finans_ozeti_hesapla(0.0, 0.0, 0.0)
    assert ozet.nbd_tl == 0.0
    assert ozet.ic_verim_orani == 0.0
    assert ozet.lcoe_tl_kwh == 0.0
    assert ozet.yillik_akislar == []
    assert lcoe_hesapla(0.0, [], []) == 0.0
    assert len(yillik_nakit_akisi_hesapla(0.0, 0.0, 0.0)) == 25
