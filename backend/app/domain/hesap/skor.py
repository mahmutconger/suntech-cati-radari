"""Çatı GES uygunluk skoru (0-100) hesaplama modülü (PROJE.md §22.3)."""

from __future__ import annotations

import math


def _sinirla(deger: float, alt: float = 0.0, ust: float = 1.0) -> float:
    return max(alt, min(ust, deger))


def uygunluk_skoru_hesapla(
    geri_odeme_yil: float,
    verim_kwh_kwp: float,
    kwp: float,
    trafo_mesafe_km: float | None = None,
    mevcut_ges: bool = False,
) -> float:
    """Bina için 0 ile 100 arasında güneş enerjisi uygunluk skoru hesaplar (PROJE.md §22.3).

    Ağırlıklar:
    - Geri ödeme süresi (%40): <= 3,0 yıl tam puan (1,0), >= 8,0 yıl sıfır puan (0,0)
    - Güneş verimi (%20)     : 1.250 - 1.350 kWh/kWp aralığında doğrusal ölçek
    - Kurulu güç kWp (%20)   : logaritmik ölçek (70 kWp -> ~0,40; 250 kWp -> ~0,65; >= 1.500 kWp -> 1,0)
    - Trafo mesafesi (%10)   : 0 km -> 1,0; >= 5 km -> 0,0; `trafo_mesafe_km is None` ise nötr (0,5)
    - Mevcut GES yok (%10)   : Çatıda henüz GES yoksa 1,0

    Çatıda zaten GES varsa (OSM ya da uydu tespiti) skor 0'dır: ilk gidilecek listesinden düşer.
    """
    if mevcut_ges or kwp <= 0 or geri_odeme_yil <= 0:
        return 0.0

    # 1. Geri ödeme bileşeni (%40)
    geri_odeme_norm = _sinirla((8.0 - geri_odeme_yil) / (8.0 - 3.0))

    # 2. Güneş verimi bileşeni (%20)
    verim_norm = _sinirla((verim_kwh_kwp - 1250.0) / (1350.0 - 1250.0))

    # 3. Kurulu güç (kWp) ölçek bileşeni (%20)
    kwp_norm = _sinirla(math.log1p(max(0.0, kwp)) / math.log1p(1500.0))

    # 4. Trafo mesafesi bileşeni (%10) — veri yoksa nötr (0,5)
    if trafo_mesafe_km is None:
        trafo_norm = 0.5
    else:
        trafo_norm = _sinirla((5.0 - max(0.0, trafo_mesafe_km)) / 5.0)

    # 5. Mevcut GES durumu bileşeni (%10)
    ges_norm = 0.0 if mevcut_ges else 1.0

    skor = (
        40.0 * geri_odeme_norm
        + 20.0 * verim_norm
        + 20.0 * kwp_norm
        + 10.0 * trafo_norm
        + 10.0 * ges_norm
    )
    return round(_sinirla(skor, 0.0, 100.0), 1)
