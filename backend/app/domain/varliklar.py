"""Hesap motoru domain varlıkları (saf Python, dış bağımlılık içermez)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

VardiyaTipi = Literal["tek", "iki", "uc"]


@dataclass(frozen=True)
class Bina:
    """Çatı ve güneş enerjisi hesabı için bina varlığı."""

    id: int
    alan_m2: float
    verim_kwh_kwp: float = 1340.0
    ad: str | None = None
    mevcut_ges: bool = False
    merkez: tuple[float, float] | None = None  # (lon, lat)
    osm_id: int | None = None
    osb_id: int | None = None


@dataclass(frozen=True)
class Varsayimlar:
    """Hesap motoru varsayımları (kaydırıcılarla değiştirilebilir)."""

    kullanilabilir_oran: float = 0.45
    m2_kwp: float = 6.5
    tarife_tl_kwh: float = 4.81
    fazla_fiyat_tl_kwh: float = 2.99
    oz_tuketim_orani: float = 0.80
    maliyet_carpani: float = 1.0
    emisyon_faktoru: float = 0.6242


@dataclass(frozen=True)
class HesapSonucu:
    """Tek bir bina için yıllık güneş enerjisi ve yatırım ön analiz sonucu."""

    bina_id: int
    kwp: float
    uretim_mwh: float
    tasarruf_tl: float
    yatirim_tl: float
    geri_odeme_yil: float
    co2_ton: float


@dataclass(frozen=True)
class OsbOzeti:
    """OSB genelindeki tüm binaların toplam potansiyel özeti."""

    bina_sayisi: int
    toplam_mwp: float
    toplam_gwh: float
    toplam_tasarruf_tl: float
    toplam_yatirim_tl: float
    toplam_co2_ton: float


@dataclass(frozen=True)
class PilGirdisi:
    """Saatlik simülasyonda batarya (pil) depolama parametreleri."""

    kapasite_kwh: float = 0.0
    guc_kw: float = 0.0
    birim_maliyet_tl_kwh: float = 12500.0
    verim: float = 0.90


@dataclass(frozen=True)
class PilSonucu:
    """Batarya simülasyonu çıktıları."""

    kapasite_kwh: float
    guc_kw: float
    pil_yatirim_tl: float
    yillik_pil_desarj_mwh: float
    pilli_oz_tuketim_orani: float
    ek_tasarruf_tl: float
    toplam_yatirim_tl: float
    toplam_tasarruf_tl: float
    geri_odeme_yil: float


@dataclass(frozen=True)
class KrediGirdisi:
    """Kredi ve finansman hesaplama parametreleri."""

    aylik_faiz_orani: float = 0.025
    vade_ay: int = 48
    pesinat_orani: float = 0.20


@dataclass(frozen=True)
class KrediSonucu:
    """Kredi taksit ve nakit akışı karşılaştırma sonucu."""

    anapara_tl: float
    pesinat_tl: float
    aylik_faiz_orani: float
    vade_ay: int
    aylik_taksit_tl: float
    toplam_geri_odeme_tl: float
    toplam_faiz_tl: float
    aylik_tasarruf_tl: float
    aylik_net_akis_tl: float
    tasarruf_taksiti_karsiliyor_mu: bool


@dataclass(frozen=True)
class StatikSonucu:
    """Çatı statiği ön kontrol çıktısı."""

    panel_alani_m2: float
    tahmini_panel_sayisi: int
    birim_yuk_min_kg_m2: float
    birim_yuk_max_kg_m2: float
    toplam_ek_yuk_min_ton: float
    toplam_ek_yuk_max_ton: float
    kontrol_listesi: list[str] = field(default_factory=list)
    uyari_notu: str = ""


@dataclass(frozen=True)
class SebekeGirdisi:
    """Şebeke bağlantı ve trafo kısıtı parametreleri."""

    sebekeye_vermeden: bool = False
    trafo_kalan_kapasite_mw: float | None = None


@dataclass(frozen=True)
class SebekeSonucu:
    """Şebeke ve trafo kısıtı altında üretim/mahsuplaşma çıktısı."""

    sebekeye_vermeden: bool
    trafo_kapasite_kw: float | None
    sebekeye_verilen_mwh: float
    kisitlanan_uretim_mwh: float
    etkin_uretim_mwh: float


@dataclass(frozen=True)
class SaatlikGunProfili:
    """Günlük grafik için (0-23 saat) ortalama üretim ve tüketim profili."""

    saat: int
    uretim_kw: float
    tuketim_kw: float
    oz_tuketim_kw: float
    sebekeye_verilen_kw: float
    pil_sarj_kw: float = 0.0
    pil_desarj_kw: float = 0.0


@dataclass(frozen=True)
class SimulasyonSonucu:
    """Saatlik simülasyon, pil, kredi, statik ve şebeke birleşik sonucu."""

    bina_id: int
    kwp: float
    vardiya: VardiyaTipi
    yillik_tuketim_mwh: float
    uretim_mwh: float
    oz_tuketim_mwh: float
    sebekeye_verilen_mwh: float
    kisitlanan_uretim_mwh: float
    oz_tuketim_orani: float
    tasarruf_tl: float
    yatirim_tl: float
    geri_odeme_yil: float
    co2_ton: float
    statik: StatikSonucu
    sebeke: SebekeSonucu
    pil: PilSonucu | None = None
    kredi: KrediSonucu | None = None
    gunluk_profil: list[SaatlikGunProfili] = field(default_factory=list)
