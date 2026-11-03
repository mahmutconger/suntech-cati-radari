"""PVGIS saatlik üretim ölçekleme, UTC->Türkiye saati kaydırma ve vardiya tüketim profilleri."""

from __future__ import annotations

import math
from collections.abc import Sequence

from app.domain.varliklar import VardiyaTipi
from app.domain.varsayilanlar import (
    PVGIS_SAAT_SAYISI,
    TURKIYE_UTC_FARKI_SAAT,
    VARSAYILAN_VERIM_KWH_KWP,
)


def utc_dizisini_turkiye_saatine_kaydir(
    saatlik_degerler: Sequence[float],
    fark_saat: int = TURKIYE_UTC_FARKI_SAAT,
) -> list[float]:
    """UTC zaman damgalı 8.760 saatlik diziyi Türkiye saatine (UTC+3) ileri kaydırır.

    Örnek: UTC 10:00'daki tepe üretim, kaydırma sonrası yerel saat 13:00 indeksine gelir.
    """
    n = len(saatlik_degerler)
    if n == 0:
        return []
    kayma = fark_saat % n
    if kayma == 0:
        return [float(x) for x in saatlik_degerler]
    return [float(saatlik_degerler[(i - kayma) % n]) for i in range(n)]


def varsayilan_saatlik_uretim_wh_kwp(
    verim_kwh_kwp: float = VARSAYILAN_VERIM_KWH_KWP,
) -> list[float]:
    """Veritabanında saatlik PVGIS dizisi bulunmadığında kullanılan sentetik 8.760 saatlik profil (Wh/kWp, UTC).

    En yüksek üretim 10:00 UTC (Türkiye saatiyle 13:00) civarında oluşur ve
    yaz aylarında kışa göre daha yüksek genlik verir. Yıllık toplamı `verim_kwh_kwp * 1000` Wh'dir.
    """
    ham: list[float] = []
    for saat_indeksi in range(PVGIS_SAAT_SAYISI):
        gun = saat_indeksi // 24
        saat_utc = saat_indeksi % 24
        # Mevsimsel çarpan: Haziran/Temmuz (gün ~172) tepe, Aralık dip
        mevsim = 1.0 + 0.45 * math.cos(2.0 * math.pi * (gun - 172) / 365.0)
        # Gündüz penceresi: UTC 04:00 - 16:00 (TR 07:00 - 19:00), tepe UTC 10:00 (TR 13:00)
        if 4 <= saat_utc <= 16:
            gunes_acisi = math.sin(math.pi * (saat_utc - 4) / 12.0)
            deger = max(0.0, mevsim * (gunes_acisi**1.5))
        else:
            deger = 0.0
        ham.append(deger)

    toplam_ham = sum(ham)
    hedef_toplam_wh = max(0.0, verim_kwh_kwp) * 1000.0
    if toplam_ham <= 0 or hedef_toplam_wh <= 0:
        return [0.0] * PVGIS_SAAT_SAYISI

    carpan = hedef_toplam_wh / toplam_ham
    return [d * carpan for d in ham]


def saatlik_uretim_kwh_olcekle(
    saatlik_wh_kwp: Sequence[float] | None,
    kwp: float,
    verim_kwh_kwp: float = VARSAYILAN_VERIM_KWH_KWP,
    utc_kaydir: bool = True,
) -> list[float]:
    """PVGIS'in 1 kWp için saatlik Wh dizisini önce binanın yıllık verimine, sonra kWp'ye ölçekler (kWh).

    PROJE.md Bölüm 8:
    - PVGIS 2023 profilinin toplamı (~1.312,9 kWh/kWp) binanın çok yıllık `verim_kwh_kwp`
      değerine (ör. 1.340) normalize edilir; böylece simülasyon ile yıllık hesap aynı üretimi verir.
    - Saatler UTC olduğundan vardiya eşlemesinden önce 3 saat ileri (UTC+3) kaydırılır.
    """
    if kwp <= 0 or verim_kwh_kwp <= 0:
        return [0.0] * PVGIS_SAAT_SAYISI

    if not saatlik_wh_kwp or len(saatlik_wh_kwp) != PVGIS_SAAT_SAYISI:
        dizi = varsayilan_saatlik_uretim_wh_kwp(verim_kwh_kwp)
    else:
        dizi = [max(0.0, float(x)) for x in saatlik_wh_kwp]

    if utc_kaydir:
        dizi = utc_dizisini_turkiye_saatine_kaydir(dizi, TURKIYE_UTC_FARKI_SAAT)

    mevcut_toplam_kwh_kwp = sum(dizi) / 1000.0
    if mevcut_toplam_kwh_kwp <= 0:
        return [0.0] * PVGIS_SAAT_SAYISI

    hedef_yillik_kwh = kwp * verim_kwh_kwp
    olcek = (hedef_yillik_kwh / 1000.0) / mevcut_toplam_kwh_kwp  # Wh -> kWh dahil
    return [wh * olcek for wh in dizi]


def vardiya_tuketim_profili_uret(
    yillik_tuketim_kwh: float,
    vardiya: VardiyaTipi = "iki",
) -> list[float]:
    """Yıllık elektrik tüketimini (kWh) seçilen vardiya profiline göre 8.760 saate dağıtır.

    Vardiyalar (PROJE.md Bölüm 8, yerel Türkiye saati):
    - 'tek': Hafta içi (Pazartesi-Cuma, 5 gün/hafta) 08:00-17:00 (9 saat/gün)
    - 'iki': Hafta içi (Pazartesi-Cuma, 5 gün/hafta) 06:00-22:00 (16 saat/gün)
    - 'uc' : 7 gün 24 saat kesintisiz
    """
    if yillik_tuketim_kwh <= 0:
        return [0.0] * PVGIS_SAAT_SAYISI

    if vardiya == "uc":
        saat_basi = yillik_tuketim_kwh / PVGIS_SAAT_SAYISI
        return [saat_basi] * PVGIS_SAAT_SAYISI

    aktif_maske: list[float] = []
    for saat_indeksi in range(PVGIS_SAAT_SAYISI):
        gun = saat_indeksi // 24
        saat = saat_indeksi % 24
        hafta_ici = (gun % 7) < 5

        if vardiya == "tek":
            aktif = hafta_ici and (8 <= saat < 17)
        elif vardiya == "iki":
            aktif = hafta_ici and (6 <= saat < 22)
        else:
            aktif = True

        aktif_maske.append(1.0 if aktif else 0.0)

    aktif_saat_sayisi = sum(aktif_maske)
    if aktif_saat_sayisi <= 0:
        saat_basi = yillik_tuketim_kwh / PVGIS_SAAT_SAYISI
        return [saat_basi] * PVGIS_SAAT_SAYISI

    birim_tuketim = yillik_tuketim_kwh / aktif_saat_sayisi
    return [m * birim_tuketim for m in aktif_maske]
