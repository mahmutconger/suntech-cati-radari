"""Hesap dilimi Pydantic v2 DTO şemaları ve aralık doğrulamaları (PROJE.md Bölüm 9 ve 11)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.varliklar import (
    HesapSonucu as DomainHesapSonucu,
    KrediGirdisi as DomainKrediGirdisi,
    KrediSonucu as DomainKrediSonucu,
    OsbOzeti as DomainOsbOzeti,
    PilGirdisi as DomainPilGirdisi,
    PilSonucu as DomainPilSonucu,
    SaatlikGunProfili as DomainSaatlikGunProfili,
    SebekeGirdisi as DomainSebekeGirdisi,
    SebekeSonucu as DomainSebekeSonucu,
    SimulasyonSonucu as DomainSimulasyonSonucu,
    StatikSonucu as DomainStatikSonucu,
    VardiyaTipi,
    Varsayimlar as DomainVarsayimlar,
)
from app.domain.varsayilanlar import (
    VARSAYILAN_EMISYON_FAKTORU,
    VARSAYILAN_FAZLA_FIYAT_TL_KWH,
    VARSAYILAN_KREDI_AYLIK_FAIZ,
    VARSAYILAN_KREDI_PESINAT_ORANI,
    VARSAYILAN_KREDI_VADE_AY,
    VARSAYILAN_KULLANILABILIR_ORAN,
    VARSAYILAN_M2_KWP,
    VARSAYILAN_MALIYET_CARPANI,
    VARSAYILAN_OZ_TUKETIM_ORANI,
    VARSAYILAN_PIL_BIRIM_MALIYET_TL_KWH,
    VARSAYILAN_PIL_VERIMI,
    VARSAYILAN_TARIFE_TL_KWH,
    VarsayimKaynagi as DomainVarsayimKaynagi,
)


class VarsayimlarDto(BaseModel):
    """Kaydırıcılarla değiştirilebilen hesap varsayımları DTO'su."""

    model_config = ConfigDict(extra="forbid")

    kullanilabilir_oran: float = Field(
        default=VARSAYILAN_KULLANILABILIR_ORAN,
        ge=0.05,
        le=1.0,
        description="Kullanılabilir çatı alanı oranı (0,05 - 1,0)",
    )
    m2_kwp: float = Field(
        default=VARSAYILAN_M2_KWP,
        ge=3.0,
        le=20.0,
        description="1 kWp kurulu güç için gereken alan (m²/kWp)",
    )
    tarife_tl_kwh: float = Field(
        default=VARSAYILAN_TARIFE_TL_KWH,
        ge=0.0,
        le=50.0,
        description="Sanayi elektrik tarifesi (TL/kWh)",
    )
    fazla_fiyat_tl_kwh: float = Field(
        default=VARSAYILAN_FAZLA_FIYAT_TL_KWH,
        ge=0.0,
        le=50.0,
        description="İhtiyaç fazlası elektriğin şebekeye satış fiyatı (TL/kWh)",
    )
    oz_tuketim_orani: float = Field(
        default=VARSAYILAN_OZ_TUKETIM_ORANI,
        ge=0.0,
        le=1.0,
        description="Üretilen enerjinin içeride tüketilen oranı (0 - 1)",
    )
    maliyet_carpani: float = Field(
        default=VARSAYILAN_MALIYET_CARPANI,
        ge=0.3,
        le=3.0,
        description="Kurulum maliyeti duyarlılık çarpanı (ör. 0,7 - 1,3)",
    )
    emisyon_faktoru: float = Field(
        default=VARSAYILAN_EMISYON_FAKTORU,
        ge=0.0,
        le=2.0,
        description="Şebeke emisyon faktörü (tCO2/MWh)",
    )

    def to_domain(self) -> DomainVarsayimlar:
        return DomainVarsayimlar(
            kullanilabilir_oran=self.kullanilabilir_oran,
            m2_kwp=self.m2_kwp,
            tarife_tl_kwh=self.tarife_tl_kwh,
            fazla_fiyat_tl_kwh=self.fazla_fiyat_tl_kwh,
            oz_tuketim_orani=self.oz_tuketim_orani,
            maliyet_carpani=self.maliyet_carpani,
            emisyon_faktoru=self.emisyon_faktoru,
        )

    @classmethod
    def from_domain(cls, v: DomainVarsayimlar) -> VarsayimlarDto:
        return cls(
            kullanilabilir_oran=v.kullanilabilir_oran,
            m2_kwp=v.m2_kwp,
            tarife_tl_kwh=v.tarife_tl_kwh,
            fazla_fiyat_tl_kwh=v.fazla_fiyat_tl_kwh,
            oz_tuketim_orani=v.oz_tuketim_orani,
            maliyet_carpani=v.maliyet_carpani,
            emisyon_faktoru=v.emisyon_faktoru,
        )


class HesapSonucuDto(BaseModel):
    """Tek bina yıllık hesap sonucu DTO'su (PROJE.md Bölüm 9)."""

    bina_id: int
    kwp: float
    uretim_mwh: float
    tasarruf_tl: float
    yatirim_tl: float
    geri_odeme_yil: float
    co2_ton: float

    @classmethod
    def from_domain(cls, s: DomainHesapSonucu) -> HesapSonucuDto:
        return cls(
            bina_id=s.bina_id,
            kwp=round(s.kwp, 2),
            uretim_mwh=round(s.uretim_mwh, 2),
            tasarruf_tl=round(s.tasarruf_tl, 2),
            yatirim_tl=round(s.yatirim_tl, 2),
            geri_odeme_yil=round(s.geri_odeme_yil, 2),
            co2_ton=round(s.co2_ton, 2),
        )


class OsbOzetiDto(BaseModel):
    """OSB toplam özet DTO'su (PROJE.md Bölüm 9)."""

    bina_sayisi: int
    toplam_mwp: float
    toplam_gwh: float
    toplam_tasarruf_tl: float
    toplam_yatirim_tl: float
    toplam_co2_ton: float

    @classmethod
    def from_domain(cls, o: DomainOsbOzeti) -> OsbOzetiDto:
        return cls(
            bina_sayisi=o.bina_sayisi,
            toplam_mwp=round(o.toplam_mwp, 2),
            toplam_gwh=round(o.toplam_gwh, 2),
            toplam_tasarruf_tl=round(o.toplam_tasarruf_tl, 2),
            toplam_yatirim_tl=round(o.toplam_yatirim_tl, 2),
            toplam_co2_ton=round(o.toplam_co2_ton, 2),
        )


class TopluHesapIstegi(BaseModel):
    """POST `/hesap/toplu` istek gövdesi."""

    model_config = ConfigDict(extra="forbid")

    varsayimlar: VarsayimlarDto = Field(default_factory=VarsayimlarDto)


class TopluHesapYaniti(BaseModel):
    """POST `/hesap/toplu` yanıt gövdesi."""

    sonuclar: list[HesapSonucuDto]
    ozet: OsbOzetiDto
    osb_ozeti: OsbOzetiDto | None = None


class BinaHesapIstegi(BaseModel):
    """POST `/hesap/bina/{id}` istek gövdesi."""

    model_config = ConfigDict(extra="forbid")

    varsayimlar: VarsayimlarDto = Field(default_factory=VarsayimlarDto)
    yillik_tuketim_kwh: float | None = Field(
        default=None,
        ge=0.0,
        le=500_000_000.0,
        description="Firmanın yıllık elektrik tüketimi (kWh/yıl)",
    )


class PilGirdisiDto(BaseModel):
    """Batarya simülasyonu girdi DTO'su."""

    model_config = ConfigDict(extra="forbid")

    kapasite_kwh: float = Field(default=0.0, ge=0.0, le=100_000.0)
    guc_kw: float = Field(default=0.0, ge=0.0, le=50_000.0)
    birim_maliyet_tl_kwh: float = Field(
        default=VARSAYILAN_PIL_BIRIM_MALIYET_TL_KWH, ge=0.0, le=200_000.0
    )
    verim: float = Field(default=VARSAYILAN_PIL_VERIMI, ge=0.1, le=1.0)

    def to_domain(self) -> DomainPilGirdisi:
        return DomainPilGirdisi(
            kapasite_kwh=self.kapasite_kwh,
            guc_kw=self.guc_kw,
            birim_maliyet_tl_kwh=self.birim_maliyet_tl_kwh,
            verim=self.verim,
        )


class PilSonucuDto(BaseModel):
    """Batarya simülasyonu sonuç DTO'su."""

    kapasite_kwh: float
    guc_kw: float
    pil_yatirim_tl: float
    yillik_pil_desarj_mwh: float
    pilli_oz_tuketim_orani: float
    ek_tasarruf_tl: float
    toplam_yatirim_tl: float
    toplam_tasarruf_tl: float
    geri_odeme_yil: float

    @classmethod
    def from_domain(cls, p: DomainPilSonucu) -> PilSonucuDto:
        return cls(
            kapasite_kwh=round(p.kapasite_kwh, 2),
            guc_kw=round(p.guc_kw, 2),
            pil_yatirim_tl=round(p.pil_yatirim_tl, 2),
            yillik_pil_desarj_mwh=round(p.yillik_pil_desarj_mwh, 2),
            pilli_oz_tuketim_orani=round(p.pilli_oz_tuketim_orani, 4),
            ek_tasarruf_tl=round(p.ek_tasarruf_tl, 2),
            toplam_yatirim_tl=round(p.toplam_yatirim_tl, 2),
            toplam_tasarruf_tl=round(p.toplam_tasarruf_tl, 2),
            geri_odeme_yil=round(p.geri_odeme_yil, 2),
        )


class KrediGirdisiDto(BaseModel):
    """Kredi hesaplama girdi DTO'su."""

    model_config = ConfigDict(extra="forbid")

    aylik_faiz_orani: float = Field(
        default=VARSAYILAN_KREDI_AYLIK_FAIZ,
        ge=0.0,
        le=0.50,
        description="Aylık kredi faiz oranı (ör. 0,025 = %2,5)",
    )
    vade_ay: int = Field(
        default=VARSAYILAN_KREDI_VADE_AY,
        ge=1,
        le=240,
        description="Kredi vadesi (ay)",
    )
    pesinat_orani: float = Field(
        default=VARSAYILAN_KREDI_PESINAT_ORANI,
        ge=0.0,
        le=1.0,
        description="Özkaynak peşinat oranı (0 - 1)",
    )

    def to_domain(self) -> DomainKrediGirdisi:
        return DomainKrediGirdisi(
            aylik_faiz_orani=self.aylik_faiz_orani,
            vade_ay=self.vade_ay,
            pesinat_orani=self.pesinat_orani,
        )


class KrediSonucuDto(BaseModel):
    """Kredi hesaplama sonuç DTO'su."""

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

    @classmethod
    def from_domain(cls, k: DomainKrediSonucu) -> KrediSonucuDto:
        return cls(
            anapara_tl=round(k.anapara_tl, 2),
            pesinat_tl=round(k.pesinat_tl, 2),
            aylik_faiz_orani=round(k.aylik_faiz_orani, 6),
            vade_ay=k.vade_ay,
            aylik_taksit_tl=round(k.aylik_taksit_tl, 2),
            toplam_geri_odeme_tl=round(k.toplam_geri_odeme_tl, 2),
            toplam_faiz_tl=round(k.toplam_faiz_tl, 2),
            aylik_tasarruf_tl=round(k.aylik_tasarruf_tl, 2),
            aylik_net_akis_tl=round(k.aylik_net_akis_tl, 2),
            tasarruf_taksiti_karsiliyor_mu=k.tasarruf_taksiti_karsiliyor_mu,
        )


class StatikSonucuDto(BaseModel):
    """Çatı statiği ön kontrol sonuç DTO'su."""

    panel_alani_m2: float
    tahmini_panel_sayisi: int
    birim_yuk_min_kg_m2: float
    birim_yuk_max_kg_m2: float
    toplam_ek_yuk_min_ton: float
    toplam_ek_yuk_max_ton: float
    kontrol_listesi: list[str]
    uyari_notu: str

    @classmethod
    def from_domain(cls, st: DomainStatikSonucu) -> StatikSonucuDto:
        return cls(
            panel_alani_m2=st.panel_alani_m2,
            tahmini_panel_sayisi=st.tahmini_panel_sayisi,
            birim_yuk_min_kg_m2=st.birim_yuk_min_kg_m2,
            birim_yuk_max_kg_m2=st.birim_yuk_max_kg_m2,
            toplam_ek_yuk_min_ton=st.toplam_ek_yuk_min_ton,
            toplam_ek_yuk_max_ton=st.toplam_ek_yuk_max_ton,
            kontrol_listesi=list(st.kontrol_listesi),
            uyari_notu=st.uyari_notu,
        )


class SebekeGirdisiDto(BaseModel):
    """Şebeke bağlantı ve trafo sınırı girdi DTO'su."""

    model_config = ConfigDict(extra="forbid")

    sebekeye_vermeden: bool = False
    trafo_kalan_kapasite_mw: float | None = Field(
        default=None,
        ge=0.0,
        le=1000.0,
        description="Bağlı trafo merkezinde kalan boş kapasite (MW)",
    )

    def to_domain(self) -> DomainSebekeGirdisi:
        return DomainSebekeGirdisi(
            sebekeye_vermeden=self.sebekeye_vermeden,
            trafo_kalan_kapasite_mw=self.trafo_kalan_kapasite_mw,
        )


class SebekeSonucuDto(BaseModel):
    """Şebeke ve trafo kısıtı sonuç DTO'su."""

    sebekeye_vermeden: bool
    trafo_kapasite_kw: float | None
    sebekeye_verilen_mwh: float
    kisitlanan_uretim_mwh: float
    etkin_uretim_mwh: float

    @classmethod
    def from_domain(cls, sb: DomainSebekeSonucu) -> SebekeSonucuDto:
        return cls(
            sebekeye_vermeden=sb.sebekeye_vermeden,
            trafo_kapasite_kw=(
                round(sb.trafo_kapasite_kw, 2)
                if sb.trafo_kapasite_kw is not None
                else None
            ),
            sebekeye_verilen_mwh=round(sb.sebekeye_verilen_mwh, 2),
            kisitlanan_uretim_mwh=round(sb.kisitlanan_uretim_mwh, 2),
            etkin_uretim_mwh=round(sb.etkin_uretim_mwh, 2),
        )


class SaatlikGunProfiliDto(BaseModel):
    """Günlük grafik için (0-23 saat) ortalama kW değerleri DTO'su."""

    saat: int
    uretim_kw: float
    tuketim_kw: float
    oz_tuketim_kw: float
    sebekeye_verilen_kw: float
    pil_sarj_kw: float = 0.0
    pil_desarj_kw: float = 0.0

    @classmethod
    def from_domain(cls, gp: DomainSaatlikGunProfili) -> SaatlikGunProfiliDto:
        return cls(
            saat=gp.saat,
            uretim_kw=gp.uretim_kw,
            tuketim_kw=gp.tuketim_kw,
            oz_tuketim_kw=gp.oz_tuketim_kw,
            sebekeye_verilen_kw=gp.sebekeye_verilen_kw,
            pil_sarj_kw=gp.pil_sarj_kw,
            pil_desarj_kw=gp.pil_desarj_kw,
        )


class SimulasyonIstegi(BaseModel):
    """POST `/hesap/simulasyon/{id}` istek gövdesi."""

    model_config = ConfigDict(extra="forbid")

    varsayimlar: VarsayimlarDto = Field(default_factory=VarsayimlarDto)
    vardiya: VardiyaTipi = Field(
        default="iki",
        description="Tüketim vardiya profili: 'tek' (08-17), 'iki' (06-22), 'uc' (7/24)",
    )
    yillik_tuketim_kwh: float | None = Field(
        default=None,
        ge=0.0,
        le=500_000_000.0,
    )
    pil: PilGirdisiDto | None = None
    kredi: KrediGirdisiDto | None = None
    sebeke: SebekeGirdisiDto = Field(default_factory=SebekeGirdisiDto)


class SimulasyonSonucuDto(BaseModel):
    """POST `/hesap/simulasyon/{id}` yanıt gövdesi (PROJE.md Bölüm 9)."""

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
    statik: StatikSonucuDto
    sebeke: SebekeSonucuDto
    pil: PilSonucuDto | None = None
    kredi: KrediSonucuDto | None = None
    gunluk_profil: list[SaatlikGunProfiliDto]

    @classmethod
    def from_domain(cls, s: DomainSimulasyonSonucu) -> SimulasyonSonucuDto:
        return cls(
            bina_id=s.bina_id,
            kwp=round(s.kwp, 2),
            vardiya=s.vardiya,
            yillik_tuketim_mwh=round(s.yillik_tuketim_mwh, 2),
            uretim_mwh=round(s.uretim_mwh, 2),
            oz_tuketim_mwh=round(s.oz_tuketim_mwh, 2),
            sebekeye_verilen_mwh=round(s.sebekeye_verilen_mwh, 2),
            kisitlanan_uretim_mwh=round(s.kisitlanan_uretim_mwh, 2),
            oz_tuketim_orani=round(s.oz_tuketim_orani, 4),
            tasarruf_tl=round(s.tasarruf_tl, 2),
            yatirim_tl=round(s.yatirim_tl, 2),
            geri_odeme_yil=round(s.geri_odeme_yil, 2),
            co2_ton=round(s.co2_ton, 2),
            statik=StatikSonucuDto.from_domain(s.statik),
            sebeke=SebekeSonucuDto.from_domain(s.sebeke),
            pil=PilSonucuDto.from_domain(s.pil) if s.pil is not None else None,
            kredi=KrediSonucuDto.from_domain(s.kredi) if s.kredi is not None else None,
            gunluk_profil=[
                SaatlikGunProfiliDto.from_domain(gp) for gp in s.gunluk_profil
            ],
        )


class VarsayimKaynagiDto(BaseModel):
    """Tek bir varsayımın kaynak ve tarih bilgisi DTO'su."""

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
    aciklama: str

    @classmethod
    def from_domain(cls, k: DomainVarsayimKaynagi) -> VarsayimKaynagiDto:
        return cls(
            anahtar=k.anahtar,
            ad=k.ad,
            deger=k.deger,
            sayisal_deger=k.sayisal_deger,
            birim=k.birim,
            aralik=k.aralik,
            min_deger=k.min_deger,
            max_deger=k.max_deger,
            kaynak=k.kaynak,
            tarih=k.tarih,
            aciklama=k.aciklama,
        )


class VarsayimlarYaniti(BaseModel):
    """GET `/varsayimlar` yanıt gövdesi."""

    varsayimlar: VarsayimlarDto
    kaynaklar: list[VarsayimKaynagiDto]


SiralamaOlcutuLiteral = Literal[
    "tasarruf_tl",
    "kwp",
    "uretim_mwh",
    "co2_ton",
    "geri_odeme_yil",
    "yatirim_tl",
]

# PROJE.md Bölüm 9'daki kısa DTO isimleri için eş anlamlı takma adlar
Varsayimlar = VarsayimlarDto
HesapSonucu = HesapSonucuDto
OsbOzeti = OsbOzetiDto
SimulasyonSonucu = SimulasyonSonucuDto
