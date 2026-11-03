"""Çatı statiği ön kontrol hesabı ve kontrol listesi (PROJE.md Bölüm 8 ve 16)."""

from __future__ import annotations

import math

from app.domain.varliklar import StatikSonucu
from app.domain.varsayilanlar import (
    REFERANS_MODUL_M2,
    REFERANS_MODUL_WP,
    STATIK_YUK_MAX_KG_M2,
    STATIK_YUK_MIN_KG_M2,
)

STATIK_UYARI_NOTU: str = (
    "Bu bir ön taramadır. Panel ve alüminyum ray sistemi çatıya yaklaşık 12-15 kg/m² "
    "yayılı ek yük getirir; kesin karar yetkili inşaat mühendisinin yerinde statik "
    "raporuyla verilir."
)

STATIK_KONTROL_LISTESI: tuple[str, ...] = (
    "Mevcut çatı makas ve aşık sisteminin 15 kg/m² ek sabit yük kapasitesi",
    "Kar ve rüzgâr yükü kombinasyonlarının TS EN 1991 (Eurocode 1) ile uyumu",
    "Çatı kaplama malzemesi (sandviç panel / trapez sac) bağlantı detayları ve sızdırmazlık",
    "Işıklık, duman tahliye kapakları ve yürüme yollarının yerleşim planından ayrılması",
    "Paratoner, topraklama ve yangın güvenlik koridorlarının korunması",
)


def statik_on_kontrol_hesapla(kwp: float, m2_kwp: float = 6.5) -> StatikSonucu:
    """Kurulu güce (kWp) göre panel alanını, modül sayısını ve toplam ek çatı yükünü hesaplar."""
    if kwp <= 0:
        return StatikSonucu(
            panel_alani_m2=0.0,
            tahmini_panel_sayisi=0,
            birim_yuk_min_kg_m2=STATIK_YUK_MIN_KG_M2,
            birim_yuk_max_kg_m2=STATIK_YUK_MAX_KG_M2,
            toplam_ek_yuk_min_ton=0.0,
            toplam_ek_yuk_max_ton=0.0,
            kontrol_listesi=list(STATIK_KONTROL_LISTESI),
            uyari_notu=STATIK_UYARI_NOTU,
        )

    tahmini_panel_sayisi = math.ceil((kwp * 1000.0) / REFERANS_MODUL_WP)
    net_modul_alani_m2 = tahmini_panel_sayisi * REFERANS_MODUL_M2
    kurulum_alani_m2 = max(net_modul_alani_m2, kwp * max(0.0, m2_kwp))

    # Ek yük hesabı net panel + ray alanı üzerinden (ton = kg / 1000)
    ek_yuk_min_ton = (net_modul_alani_m2 * STATIK_YUK_MIN_KG_M2) / 1000.0
    ek_yuk_max_ton = (net_modul_alani_m2 * STATIK_YUK_MAX_KG_M2) / 1000.0

    return StatikSonucu(
        panel_alani_m2=round(kurulum_alani_m2, 1),
        tahmini_panel_sayisi=tahmini_panel_sayisi,
        birim_yuk_min_kg_m2=STATIK_YUK_MIN_KG_M2,
        birim_yuk_max_kg_m2=STATIK_YUK_MAX_KG_M2,
        toplam_ek_yuk_min_ton=round(ek_yuk_min_ton, 2),
        toplam_ek_yuk_max_ton=round(ek_yuk_max_ton, 2),
        kontrol_listesi=list(STATIK_KONTROL_LISTESI),
        uyari_notu=STATIK_UYARI_NOTU,
    )
