"""Hesap motoru varsayılan değerleri, aralıkları, kaynakları ve tarihleri (PROJE.md Bölüm 16 ve 22.1)."""

from __future__ import annotations

from dataclasses import dataclass

from app.domain.varliklar import Varsayimlar


@dataclass(frozen=True)
class VarsayimKaynagi:
    """Tek bir varsayımın meta verisi (Varsayımlar sayfası ve API için)."""

    anahtar: str
    ad: str
    deger: str
    sayisal_deger: float | None
    birim: str
    aralik: str
    min_deger: float | None
    max_deger: float | None
    kaynak: str
    tarih: str
    aciklama: str = ""


# Sabit varsayılan değerler
VARSAYILAN_KULLANILABILIR_ORAN: float = 0.45
VARSAYILAN_M2_KWP: float = 6.5
VARSAYILAN_TARIFE_TL_KWH: float = 4.81
VARSAYILAN_FAZLA_FIYAT_TL_KWH: float = 2.99
VARSAYILAN_OZ_TUKETIM_ORANI: float = 0.80
VARSAYILAN_MALIYET_CARPANI: float = 1.0
VARSAYILAN_EMISYON_FAKTORU: float = 0.6242  # tCO2 / MWh
VARSAYILAN_VERIM_KWH_KWP: float = 1340.0

# 25 yıllık finans varsayılanları (PROJE.md §22.1)
VARSAYILAN_OMUR_YIL: int = 25
VARSAYILAN_DEGRADASYON: float = 0.005      # Yıllık %0,5 panel yaşlanması
VARSAYILAN_BAKIM_ORANI: float = 0.01       # Yatırımın yıllık %1'i O&M gideri
VARSAYILAN_ISKONTO_ORANI: float = 0.08     # Reel %8 iskonto oranı
VARSAYILAN_TARIFE_ARTISI: float = 0.0      # Reel %0 elektrik fiyatı artışı

# Kurulum maliyeti kademeleri (KDV hariç, TL/kWp)
MALIYET_KADEME_KUCUK_SINIR_KWP: float = 250.0
MALIYET_KADEME_BUYUK_SINIR_KWP: float = 1000.0
MALIYET_KUCUK_TL_KWP: float = 31500.0   # <= 250 kWp
MALIYET_ORTA_TL_KWP: float = 25650.0    # 250 < kWp < 1000
MALIYET_BUYUK_TL_KWP: float = 21200.0   # >= 1000 kWp

# Döviz kuru referansı
REFERANS_DOVIZ_KURU_TL_USD: float = 49.86

# Statik ön kontrol sabitleri
STATIK_YUK_MIN_KG_M2: float = 12.0
STATIK_YUK_MAX_KG_M2: float = 15.0
REFERANS_MODUL_WP: float = 580.0
REFERANS_MODUL_M2: float = 2.58

# Pil ve kredi varsayılanları
VARSAYILAN_PIL_VERIMI: float = 0.90
VARSAYILAN_PIL_BIRIM_MALIYET_TL_KWH: float = 12500.0  # ~250 $/kWh × 49,86 TL/$
VARSAYILAN_KREDI_AYLIK_FAIZ: float = 0.025            # Aylık %2,5
VARSAYILAN_KREDI_VADE_AY: int = 48
VARSAYILAN_KREDI_PESINAT_ORANI: float = 0.20

# PVGIS saatlik seri referansı (2023 yılı, 8760 saat, UTC+3 Türkiye kaydırması)
PVGIS_SAAT_SAYISI: int = 8760
TURKIYE_UTC_FARKI_SAAT: int = 3


def varsayilan_varsayimlar() -> Varsayimlar:
    """Varsayılan hesap parametrelerini içeren Varsayimlar nesnesi döner."""
    return Varsayimlar(
        kullanilabilir_oran=VARSAYILAN_KULLANILABILIR_ORAN,
        m2_kwp=VARSAYILAN_M2_KWP,
        tarife_tl_kwh=VARSAYILAN_TARIFE_TL_KWH,
        fazla_fiyat_tl_kwh=VARSAYILAN_FAZLA_FIYAT_TL_KWH,
        oz_tuketim_orani=VARSAYILAN_OZ_TUKETIM_ORANI,
        maliyet_carpani=VARSAYILAN_MALIYET_CARPANI,
        emisyon_faktoru=VARSAYILAN_EMISYON_FAKTORU,
        omur_yil=VARSAYILAN_OMUR_YIL,
        degradasyon=VARSAYILAN_DEGRADASYON,
        bakim_orani=VARSAYILAN_BAKIM_ORANI,
        iskonto_orani=VARSAYILAN_ISKONTO_ORANI,
        tarife_artisi=VARSAYILAN_TARIFE_ARTISI,
    )


VARSAYIM_KAYNAKLARI: tuple[VarsayimKaynagi, ...] = (
    VarsayimKaynagi(
        anahtar="verim_kwh_kwp",
        ad="Yıllık özgül üretim",
        deger="1.288-1.341 kWh/kWp, konuma göre",
        sayisal_deger=VARSAYILAN_VERIM_KWH_KWP,
        birim="kWh/kWp",
        aralik="sabit",
        min_deger=1288.0,
        max_deger=1341.0,
        kaynak="PVGIS v5.3, SARAH3, yatay panel, %14 kayıp, arazi ufku dahil",
        tarih="1 Kasım 2026 sorgusu",
        aciklama="Her bina kendine en yakın PVGIS ızgara noktasının değerini alır.",
    ),
    VarsayimKaynagi(
        anahtar="panel_yerlesimi",
        ad="Panel yerleşimi",
        deger="Çatıya paralel, yatay kabul",
        sayisal_deger=0.0,
        birim="derece",
        aralik="sabit",
        min_deger=None,
        max_deger=None,
        kaynak="PVGIS: yatay 1.340; 10° güney 1.435; 10° doğu 1.328; 10° batı 1.324; 10° kuzey 1.210 kWh/kWp",
        tarih="1 Kasım 2026",
        aciklama="Çatı eğim yönü bilinmediğinden tarafsız yatay kabul yapılmıştır.",
    ),
    VarsayimKaynagi(
        anahtar="kullanilabilir_oran",
        ad="Kullanılabilir çatı oranı",
        deger="%45",
        sayisal_deger=VARSAYILAN_KULLANILABILIR_ORAN,
        birim="oran",
        aralik="%30-70",
        min_deger=0.30,
        max_deger=0.70,
        kaynak="105 ticari binada ortalama 0,49 (KFUPM, Renewable Energy); sanayi için biraz düşük tutuldu",
        tarih="2022",
        aciklama="Işıklık, havalandırma, bakım yürüyüş yolları ve kenar boşlukları düşüldükten sonra kalan net alan oranı.",
    ),
    VarsayimKaynagi(
        anahtar="m2_kwp",
        ad="Panel yoğunluğu",
        deger="6,5 m²/kWp",
        sayisal_deger=VARSAYILAN_M2_KWP,
        birim="m²/kWp",
        aralik="5-10",
        min_deger=5.0,
        max_deger=10.0,
        kaynak="Aralıklar dahil 1 kWp için 6-7 m²; 580 Wp modül 2,58 m²",
        tarih="2026",
        aciklama="1 kWp kurulu güç için gereken kullanılabilir çatı alanı.",
    ),
    VarsayimKaynagi(
        anahtar="tarife_tl_kwh",
        ad="Sanayi elektrik tarifesi",
        deger="4,81 TL/kWh, vergisiz",
        sayisal_deger=VARSAYILAN_TARIFE_TL_KWH,
        birim="TL/kWh",
        aralik="3-7 TL",
        min_deger=3.0,
        max_deger=7.0,
        kaynak="EPDK, sanayi tek zamanlı: aktif enerji 2,99 + dağıtım 1,83",
        tarih="4 Nisan 2026",
        aciklama="Öz tüketimde şebekeden çekilmeyen her kWh için sağlanan birim tasarruf.",
    ),
    VarsayimKaynagi(
        anahtar="fazla_fiyat_tl_kwh",
        ad="Fazla enerji fiyatı",
        deger="2,99 TL/kWh",
        sayisal_deger=VARSAYILAN_FAZLA_FIYAT_TL_KWH,
        birim="TL/kWh",
        aralik="1,5-3 TL",
        min_deger=1.5,
        max_deger=3.0,
        kaynak="Lisanssız Üretim Yönetmeliği değişikliği, Resmî Gazete 33212: saatlik mahsuplaşma, ihtiyaç fazlası 10 yıl alınır, üretim bağlı tüketimin iki katını geçemez",
        tarih="2 Nisan 2026",
        aciklama="Saatlik tüketimi aşan ve şebekeye verilen ihtiyaç fazlası enerjinin alım bedeli.",
    ),
    VarsayimKaynagi(
        anahtar="oz_tuketim_orani",
        ad="Öz tüketim oranı",
        deger="%80 (saatlik simülasyonla hesaplanır)",
        sayisal_deger=VARSAYILAN_OZ_TUKETIM_ORANI,
        birim="oran",
        aralik="%50-100",
        min_deger=0.50,
        max_deger=1.00,
        kaynak="Varsayım: gündüz çalışan fabrika; saatlik simülasyonda vardiya profiline göre doğrudan hesaplanır",
        tarih="2026",
        aciklama="Üretilen elektriğin tesis içinde anında tüketilen oranı.",
    ),
    VarsayimKaynagi(
        anahtar="kurulum_maliyeti",
        ad="Kurulum maliyeti, KDV hariç",
        deger="≤250 kWp 31.500; 250-1.000 kWp 25.650; ≥1.000 kWp 21.200 TL/kWp",
        sayisal_deger=MALIYET_BUYUK_TL_KWP,
        birim="TL/kWp",
        aralik="±%30 (maliyet çarpanı 0,7-1,3)",
        min_deger=0.70,
        max_deger=1.30,
        kaynak="Azimut Solar fiyat listesi (100 kW 3.150.000 TL, 500 kW 12.825.000 TL); MY Enerjisolar, ticari/sanayi çatı 400-450 $/kWp",
        tarih="Nisan-Ağustos 2026",
        aciklama="Anahtar teslim (EPC) kademeli birim kurulum maliyeti.",
    ),
    VarsayimKaynagi(
        anahtar="doviz_kuru",
        ad="Döviz kuru",
        deger="49,86 TL/$",
        sayisal_deger=REFERANS_DOVIZ_KURU_TL_USD,
        birim="TL/USD",
        aralik="sabit",
        min_deger=None,
        max_deger=None,
        kaynak="TCMB döviz satış, bülten 2026/204",
        tarih="30 Ekim 2026",
        aciklama="Dolar bazlı EPC ve ekipman fiyatlarının TL karşılığı için referans kur.",
    ),
    VarsayimKaynagi(
        anahtar="emisyon_faktoru",
        ad="Şebeke emisyon faktörü",
        deger="0,6242 tCO₂/MWh",
        sayisal_deger=VARSAYILAN_EMISYON_FAKTORU,
        birim="tCO₂/MWh",
        aralik="0,36-0,71",
        min_deger=0.36,
        max_deger=0.71,
        kaynak="ETKB, 2023 Türkiye Ulusal Elektrik Şebekesi Emisyon Faktörü Bilgi Formu, güneş ve rüzgâr için birleşik marj",
        tarih="2023 verisi, 31 Aralık 2025'te duyuruldu",
        aciklama="1 MWh güneş enerjisi üretimiyle önlenen sera gazı emisyonu.",
    ),
    VarsayimKaynagi(
        anahtar="omur_yil",
        ad="Ekonomik ömür",
        deger="25 yıl",
        sayisal_deger=float(VARSAYILAN_OMUR_YIL),
        birim="yıl",
        aralik="15-30 yıl",
        min_deger=15.0,
        max_deger=30.0,
        kaynak="IEC 61215 / Tier-1 fotovoltaik modül doğrusal performans garantisi standardı",
        tarih="2026",
        aciklama="NBD, İVO, LCOE ve 25 yıllık nakit akışı analizinde kullanılan sistem ömrü.",
    ),
    VarsayimKaynagi(
        anahtar="degradasyon",
        ad="Yıllık panel yaşlanması (degradasyon)",
        deger="%0,5 / yıl",
        sayisal_deger=VARSAYILAN_DEGRADASYON,
        birim="oran/yıl",
        aralik="%0,2-1,0",
        min_deger=0.002,
        max_deger=0.01,
        kaynak="NREL Photovoltaic Degradation Rates incelemesi ve моно-PERC/TOPCon modül katalogları",
        tarih="2026",
        aciklama="Modül üretiminin her yıl bir önceki yıla göre azalma oranı.",
    ),
    VarsayimKaynagi(
        anahtar="bakim_orani",
        ad="Yıllık işletme ve bakım (O&M) gideri",
        deger="Yatırımın %1,0'i / yıl",
        sayisal_deger=VARSAYILAN_BAKIM_ORANI,
        birim="oran/yıl",
        aralik="%0,5-2,5",
        min_deger=0.005,
        max_deger=0.025,
        kaynak="IRENA Renewable Power Generation Costs & Türkiye sanayi çatı GES temizlik/izleme/sigorta ortalaması",
        tarih="2025-2026",
        aciklama="Temizlik, inverter kontrolü, izleme ve sigorta için yıllık sabit gider oranı.",
    ),
    VarsayimKaynagi(
        anahtar="iskonto_orani",
        ad="Reel iskonto oranı",
        deger="%8,0 (reel)",
        sayisal_deger=VARSAYILAN_ISKONTO_ORANI,
        birim="oran",
        aralik="%4-15",
        min_deger=0.04,
        max_deger=0.15,
        kaynak="SHURA / Dünya Bankası Türkiye dağıtık güneş enerjisi reel sermaye maliyeti (WACC) referansı",
        tarih="2025-2026",
        aciklama="Sabit fiyatlarla (enflasyondan arındırılmış) NBD ve LCOE hesabında kullanılan reel iskonto oranı.",
    ),
    VarsayimKaynagi(
        anahtar="tarife_artisi",
        ad="Reel elektrik tarifesi artışı",
        deger="%0,0 (reel sabit)",
        sayisal_deger=VARSAYILAN_TARIFE_ARTISI,
        birim="oran/yıl",
        aralik="-%2 ile +%5",
        min_deger=-0.02,
        max_deger=0.05,
        kaynak="Muhafazakâr baz senaryo: elektrik fiyatının genel enflasyonla paralel hareket ettiği kabulü",
        tarih="2026",
        aciklama="Enflasyon üzerindeki yıllık reel elektrik tarifesi değişim oranı.",
    ),
    VarsayimKaynagi(
        anahtar="statik_ek_yuk",
        ad="Statik ek yük",
        deger="yaklaşık 12-15 kg/m²",
        sayisal_deger=13.5,
        birim="kg/m²",
        aralik="12-15",
        min_deger=STATIK_YUK_MIN_KG_M2,
        max_deger=STATIK_YUK_MAX_KG_M2,
        kaynak="Tipik modül ve alüminyum ray ağırlığı; kesin değer statik raporla belirlenir",
        tarih="2026",
        aciklama="Panel ve konstrüksiyonun çatıya getirdiği yayılı yük.",
    ),
    VarsayimKaynagi(
        anahtar="bina_secimi",
        ad="Bina seçimi",
        deger="OSB sınırı içinde, taban alanı ≥1.000 m²",
        sayisal_deger=1000.0,
        birim="m²",
        aralik="sabit",
        min_deger=1000.0,
        max_deger=None,
        kaynak="OpenStreetMap, sınır way 808798100",
        tarih="1 Kasım 2026",
        aciklama="Manisa OSB sınırları içindeki büyük sanayi çatıları.",
    ),
    VarsayimKaynagi(
        anahtar="geri_odeme",
        ad="Geri ödeme",
        deger="basit: yatırım ÷ ilk yıl tasarrufu",
        sayisal_deger=None,
        birim="yıl",
        aralik="-",
        min_deger=None,
        max_deger=None,
        kaynak="Enflasyon, tarife artışı, panel yaşlanması, bakım ve finansman dahil değil",
        tarih="2026",
        aciklama="İlk tarama ve sıralama amaçlı basit geri ödeme süresi.",
    ),
)
