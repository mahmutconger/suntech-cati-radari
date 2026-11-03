"""Hesap motoru saf fonksiyonları (yıllık, toplu, 25Y finans, uygunluk skoru, saatlik simülasyon, pil, kredi, statik)."""

from app.domain.hesap.finans import (
    finans_ozeti_hesapla,
    ic_verim_orani_hesapla,
    lcoe_hesapla,
    nbd_hesapla,
    yillik_nakit_akisi_hesapla,
)
from app.domain.hesap.kredi import aylik_taksit_hesapla, kredi_hesapla
from app.domain.hesap.pil import pil_simule_et
from app.domain.hesap.profil import (
    saatlik_uretim_kwh_olcekle,
    utc_dizisini_turkiye_saatine_kaydir,
    vardiya_tuketim_profili_uret,
    varsayilan_saatlik_uretim_wh_kwp,
)
from app.domain.hesap.simulasyon import bina_simulasyonu_hesapla
from app.domain.hesap.skor import uygunluk_skoru_hesapla
from app.domain.hesap.statik import statik_on_kontrol_hesapla
from app.domain.hesap.toplu import (
    SiralamaOlcutu,
    binalari_sirala,
    osb_binalarini_suz,
    osb_ozeti_hesapla,
    sonuclari_sirala,
    toplu_hesapla,
)
from app.domain.hesap.yillik import (
    bina_finans_hesapla,
    bina_hesapla,
    birim_maliyet_tl_kwp,
    kwp_hesapla,
    kwp_icin_hesapla,
    yatirim_maliyeti_hesapla,
)

__all__ = [
    "SiralamaOlcutu",
    "aylik_taksit_hesapla",
    "bina_finans_hesapla",
    "bina_hesapla",
    "bina_simulasyonu_hesapla",
    "binalari_sirala",
    "birim_maliyet_tl_kwp",
    "finans_ozeti_hesapla",
    "ic_verim_orani_hesapla",
    "kredi_hesapla",
    "kwp_hesapla",
    "kwp_icin_hesapla",
    "lcoe_hesapla",
    "nbd_hesapla",
    "osb_binalarini_suz",
    "osb_ozeti_hesapla",
    "pil_simule_et",
    "saatlik_uretim_kwh_olcekle",
    "sonuclari_sirala",
    "statik_on_kontrol_hesapla",
    "toplu_hesapla",
    "utc_dizisini_turkiye_saatine_kaydir",
    "uygunluk_skoru_hesapla",
    "vardiya_tuketim_profili_uret",
    "varsayilan_saatlik_uretim_wh_kwp",
    "yatirim_maliyeti_hesapla",
    "yillik_nakit_akisi_hesapla",
]
