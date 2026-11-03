"""Hesap dilimi okuma (sorgu) use case'leri (CQRS + Sonuc deseni, PROJE.md Bölüm 5.3-5.4 ve 22.3)."""

from __future__ import annotations

import inspect
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, Generic, Protocol, TypeVar, runtime_checkable

from app.domain.hesap import (
    SiralamaOlcutu,
    bina_finans_hesapla,
    bina_hesapla,
    bina_simulasyonu_hesapla,
    binalari_sirala,
    osb_binalarini_suz,
    toplu_hesapla,
)
from app.domain.varliklar import (
    Bina,
    FinansOzeti,
    HesapSonucu,
    KrediGirdisi,
    OsbOzeti,
    PilGirdisi,
    SebekeGirdisi,
    SimulasyonSonucu,
    VardiyaTipi,
    Varsayimlar,
    YillikNakitAkisi,
)
from app.domain.varsayilanlar import (
    VARSAYIM_KAYNAKLARI,
    VarsayimKaynagi,
    varsayilan_varsayimlar,
)

T = TypeVar("T")

try:
    from app.application.sonuc import Hata, Sonuc
except ImportError:

    @dataclass
    class Hata:
        """Use case hata bilgisi."""

        kod: str
        mesaj: str

    @dataclass
    class Sonuc(Generic[T]):
        """Use case dönüş zarfı (Result pattern)."""

        deger: T | None = None
        hata: Hata | None = None

        @property
        def basarili(self) -> bool:
            return self.hata is None

        @staticmethod
        def tamam(deger: T) -> Sonuc[T]:
            return Sonuc(deger=deger)

        @staticmethod
        def hatali(kod: str, mesaj: str) -> Sonuc:
            return Sonuc(hata=Hata(kod=kod, mesaj=mesaj))


try:
    from app.application.portlar import BinaDeposu  # type: ignore[import-not-found]
except ImportError:

    @runtime_checkable
    class BinaDeposu(Protocol):
        """Bina ve PVGIS saatlik üretim verisine erişim portu."""

        def hepsi(self) -> Sequence[Bina]: ...
        def getir(self, bina_id: int) -> Bina | None: ...
        def saatlik_uretim_wh_kwp(self, bina_id: int) -> Sequence[float] | None: ...


@dataclass(frozen=True)
class TopluHesapCiktisi:
    """Toplu hesap use case çıktısı: bina başına sonuçlar ve OSB özeti."""

    sonuclar: list[HesapSonucu]
    ozet: OsbOzeti

    @property
    def osb_ozeti(self) -> OsbOzeti:
        return self.ozet


@dataclass(frozen=True)
class VarsayimlarCiktisi:
    """Varsayılan değerler ve kaynak meta verileri çıktısı."""

    varsayilanlar: Varsayimlar
    kaynaklar: list[VarsayimKaynagi]


def _merkez_coz(merkez_ham: Any) -> tuple[float, float] | None:
    if merkez_ham is None:
        return None
    if isinstance(merkez_ham, dict):
        lon = merkez_ham.get("lon")
        lat = merkez_ham.get("lat")
        if lon is not None and lat is not None:
            return (float(lon), float(lat))
        return None
    if isinstance(merkez_ham, (list, tuple)) and len(merkez_ham) >= 2:
        return (float(merkez_ham[0]), float(merkez_ham[1]))
    return None


def _trafo_mesafe_coz(kayit: Any) -> float | None:
    """Kayıttan `trafo_mesafe_km` veya `en_yakin_trafo.mesafe_km` değerini çıkarır."""
    if isinstance(kayit, dict):
        dogrudan = kayit.get("trafo_mesafe_km")
        if dogrudan is not None:
            try:
                return float(dogrudan)
            except (TypeError, ValueError):
                pass
        en_yakin = kayit.get("en_yakin_trafo")
        if isinstance(en_yakin, dict) and en_yakin.get("mesafe_km") is not None:
            try:
                return float(en_yakin["mesafe_km"])
            except (TypeError, ValueError):
                pass
        return None

    dogrudan = getattr(kayit, "trafo_mesafe_km", None)
    if dogrudan is not None:
        try:
            return float(dogrudan)
        except (TypeError, ValueError):
            pass
    return None


def _bina_nesnesine_cevir(kayit: Any) -> Bina:
    """Depodan gelen nesneyi (Bina, Firestore dict veya model) domain Bina varlığına çevirir."""
    if isinstance(kayit, Bina):
        return kayit
    if isinstance(kayit, dict):
        ham_id = kayit.get("id") if kayit.get("id") is not None else kayit.get("osm_id")
        if ham_id is None:
            raise ValueError("Bina kaydında 'id' veya 'osm_id' alanı bulunamadı.")
        bina_id = int(ham_id)
        osm_id = int(kayit["osm_id"]) if kayit.get("osm_id") is not None else bina_id
        ad_ham = kayit.get("ad")
        ad = str(ad_ham).strip() if ad_ham else None
        osb_ham = kayit.get("osb")
        osb = str(osb_ham).strip().lower() if osb_ham else "manisa"
        return Bina(
            id=bina_id,
            alan_m2=float(kayit.get("alan_m2", 0.0)),
            verim_kwh_kwp=float(kayit.get("verim_kwh_kwp") or 1340.0),
            ad=ad or None,
            mevcut_ges=bool(kayit.get("mevcut_ges", False)),
            merkez=_merkez_coz(kayit.get("merkez")),
            osm_id=osm_id,
            osb_id=None,
            osb=osb or "manisa",
            trafo_mesafe_km=_trafo_mesafe_coz(kayit),
        )

    ham_id = getattr(kayit, "id", None)
    if ham_id is None:
        ham_id = getattr(kayit, "osm_id")
    bina_id = int(ham_id)
    ad_ham = getattr(kayit, "ad", None)
    osb_ham = getattr(kayit, "osb", None)
    osb = str(osb_ham).strip().lower() if osb_ham else "manisa"
    return Bina(
        id=bina_id,
        alan_m2=float(getattr(kayit, "alan_m2", 0.0)),
        verim_kwh_kwp=float(getattr(kayit, "verim_kwh_kwp", 1340.0) or 1340.0),
        ad=str(ad_ham).strip() if ad_ham else None,
        mevcut_ges=bool(getattr(kayit, "mevcut_ges", False)),
        merkez=_merkez_coz(getattr(kayit, "merkez", None)),
        osm_id=int(getattr(kayit, "osm_id", bina_id) or bina_id),
        osb_id=None,
        osb=osb or "manisa",
        trafo_mesafe_km=_trafo_mesafe_coz(kayit),
    )


async def _depo_cagir(depo: Any, aday_adlar: tuple[str, ...], *args: Any) -> Any:
    """Deponun senkron ya da asenkron metodunu esnek isimlerle çağırır."""
    for ad in aday_adlar:
        metot = getattr(depo, ad, None)
        if callable(metot):
            sonuc = metot(*args)
            if inspect.isawaitable(sonuc):
                return await sonuc
            return sonuc
    raise AttributeError(f"Depoda {aday_adlar} metotlarından hiçbiri bulunamadı.")


async def _tum_binalari_al(depo: Any, osb: str | None = None) -> list[Bina]:
    # Depo `hepsi(osb)` destekliyorsa doğrudan geçir, desteklemiyorsa parametresiz çağırıp süz
    hepsi_metot = getattr(depo, "hepsi", None)
    ham_liste: Any = None
    if callable(hepsi_metot) and osb is not None:
        try:
            sig = inspect.signature(hepsi_metot)
            if len(sig.parameters) >= 1:
                sonuc = hepsi_metot(osb)
                ham_liste = await sonuc if inspect.isawaitable(sonuc) else sonuc
        except (TypeError, ValueError):
            ham_liste = None

    if ham_liste is None:
        ham_liste = await _depo_cagir(
            depo, ("hepsi", "tum_binalar", "listele", "binalari_getir")
        )

    if not ham_liste:
        return []
    binalar = [_bina_nesnesine_cevir(k) for k in ham_liste]
    if osb is not None:
        return osb_binalarini_suz(binalar, osb)
    return binalar


async def _tek_bina_al(depo: Any, bina_id: int) -> Bina | None:
    ham = await _depo_cagir(
        depo, ("getir", "bina_getir", "id_ile_getir", "bul"), bina_id
    )
    if ham is None:
        return None
    return _bina_nesnesine_cevir(ham)


async def _saatlik_profil_al(depo: Any, bina_id: int) -> Sequence[float] | None:
    for ad in (
        "saatlik_uretim_wh_kwp",
        "saatlik_profil_getir",
        "saatlik_wh_getir",
        "pvgis_saatlik_getir",
    ):
        metot = getattr(depo, ad, None)
        if callable(metot):
            sonuc = metot(bina_id)
            if inspect.isawaitable(sonuc):
                sonuc = await sonuc
            return sonuc
    return None


class TopluHesapSorgusu:
    """Bütün binalar için yıllık hesap ve OSB özeti use case'i (`POST /hesap/toplu` ve asistan `osb_ozeti`)."""

    def __init__(self, bina_deposu: BinaDeposu) -> None:
        self._depo = bina_deposu

    async def calistir(
        self,
        varsayimlar: Varsayimlar | None = None,
        osb: str = "manisa",
    ) -> Sonuc[TopluHesapCiktisi]:
        binalar = await _tum_binalari_al(self._depo, osb=osb)
        sonuclar, ozet = toplu_hesapla(binalar, varsayimlar)
        return Sonuc.tamam(TopluHesapCiktisi(sonuclar=sonuclar, ozet=ozet))


class BinaHesapSorgusu:
    """Tek bir bina için yıllık hesap use case'i (`POST /hesap/bina/{id}` ve asistan `bina_detayi`)."""

    def __init__(self, bina_deposu: BinaDeposu) -> None:
        self._depo = bina_deposu

    async def calistir(
        self,
        bina_id: int,
        varsayimlar: Varsayimlar | None = None,
        yillik_tuketim_kwh: float | None = None,
    ) -> Sonuc[HesapSonucu]:
        if bina_id <= 0:
            return Sonuc.hatali(
                "gecersiz", "Bina kimliği pozitif bir tam sayı olmalıdır."
            )

        bina = await _tek_bina_al(self._depo, bina_id)
        if bina is None:
            return Sonuc.hatali("bulunamadi", f"Bina bulunamadı: {bina_id}")

        hesap = bina_hesapla(
            bina=bina,
            varsayimlar=varsayimlar,
            yillik_tuketim_kwh=yillik_tuketim_kwh,
        )
        return Sonuc.tamam(hesap)


class FinansSorgusu:
    """Tek bir bina için 25 yıllık nakit akışı ve finansal özet use case'i (`POST /hesap/finans/{id}`)."""

    def __init__(self, bina_deposu: BinaDeposu) -> None:
        self._depo = bina_deposu

    async def calistir(
        self,
        bina_id: int,
        varsayimlar: Varsayimlar | None = None,
        yillik_tuketim_kwh: float | None = None,
    ) -> Sonuc[list[YillikNakitAkisi]]:
        if bina_id <= 0:
            return Sonuc.hatali(
                "gecersiz", "Bina kimliği pozitif bir tam sayı olmalıdır."
            )

        bina = await _tek_bina_al(self._depo, bina_id)
        if bina is None:
            return Sonuc.hatali("bulunamadi", f"Bina bulunamadı: {bina_id}")

        ozet: FinansOzeti = bina_finans_hesapla(
            bina=bina,
            varsayimlar=varsayimlar,
            yillik_tuketim_kwh=yillik_tuketim_kwh,
        )
        return Sonuc.tamam(ozet.yillik_akislar)


class SimulasyonSorgusu:
    """Saatlik mahsuplaşma, pil, kredi, statik ve şebeke simülasyonu use case'i (`POST /hesap/simulasyon/{id}`)."""

    def __init__(self, bina_deposu: BinaDeposu) -> None:
        self._depo = bina_deposu

    async def calistir(
        self,
        bina_id: int,
        varsayimlar: Varsayimlar | None = None,
        vardiya: VardiyaTipi = "iki",
        yillik_tuketim_kwh: float | None = None,
        pil_girdisi: PilGirdisi | None = None,
        kredi_girdisi: KrediGirdisi | None = None,
        sebeke_girdisi: SebekeGirdisi | None = None,
    ) -> Sonuc[SimulasyonSonucu]:
        if bina_id <= 0:
            return Sonuc.hatali(
                "gecersiz", "Bina kimliği pozitif bir tam sayı olmalıdır."
            )

        bina = await _tek_bina_al(self._depo, bina_id)
        if bina is None:
            return Sonuc.hatali("bulunamadi", f"Bina bulunamadı: {bina_id}")

        saatlik_wh = await _saatlik_profil_al(self._depo, bina_id)
        sonuc = bina_simulasyonu_hesapla(
            bina=bina,
            saatlik_wh_kwp=saatlik_wh,
            varsayimlar=varsayimlar,
            vardiya=vardiya,
            yillik_tuketim_kwh=yillik_tuketim_kwh,
            pil_girdisi=pil_girdisi,
            kredi_girdisi=kredi_girdisi,
            sebeke_girdisi=sebeke_girdisi,
        )
        return Sonuc.tamam(sonuc)


class SiralamaSorgusu:
    """Binaları seçilen ölçüte göre sıralama use case'i (`GET /hesap/sirala` ve asistan `sirala`)."""

    def __init__(self, bina_deposu: BinaDeposu) -> None:
        self._depo = bina_deposu

    async def calistir(
        self,
        olcut: SiralamaOlcutu = "tasarruf_tl",
        adet: int = 20,
        varsayimlar: Varsayimlar | None = None,
        osb: str = "manisa",
    ) -> Sonuc[list[HesapSonucu]]:
        if adet <= 0 or adet > 1000:
            return Sonuc.hatali(
                "gecersiz", "Sıralama adedi 1 ile 1000 arasında olmalıdır."
            )

        binalar = await _tum_binalari_al(self._depo, osb=osb)
        sirali = binalari_sirala(
            binalar=binalar,
            varsayimlar=varsayimlar,
            olcut=olcut,
            adet=adet,
        )
        return Sonuc.tamam(sirali)


class VarsayimlariGetirSorgusu:
    """Varsayılan hesap değerlerini ve kaynaklarını getiren use case (`GET /varsayimlar`)."""

    def calistir(self) -> Sonuc[VarsayimlarCiktisi]:
        return Sonuc.tamam(
            VarsayimlarCiktisi(
                varsayilanlar=varsayilan_varsayimlar(),
                kaynaklar=list(VARSAYIM_KAYNAKLARI),
            )
        )
