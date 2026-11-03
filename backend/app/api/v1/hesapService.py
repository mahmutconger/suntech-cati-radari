"""Hesap motoru ve varsayımlar FastAPI router'ı (PROJE.md Bölüm 5.4, 9 ve 22.1-22.3)."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Body, Depends, Query
from fastapi.responses import JSONResponse

from app.application.hesap import (
    BinaDeposu,
    BinaHesapSorgusu,
    FinansSorgusu,
    Hata,
    SimulasyonSorgusu,
    SiralamaSorgusu,
    TopluHesapSorgusu,
    VarsayimlariGetirSorgusu,
)
from app.core.firebase import get_firestore_client
from app.infrastructure.depo import VeritabaniHatasi, binalar as depo_binalar
from app.schemas.hesap import (
    BinaHesapIstegi,
    FinansIstegi,
    HesapSonucuDto,
    OsbOzetiDto,
    SimulasyonIstegi,
    SimulasyonSonucuDto,
    SiralamaOlcutuLiteral,
    TopluHesapIstegi,
    TopluHesapYaniti,
    VarsayimKaynagiDto,
    VarsayimlarDto,
    VarsayimlarYaniti,
    YillikNakitAkisiDto,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["hesap"])


class _OrtakBinaDeposu:
    """`app.infrastructure.depo` bellek önbelleğini ve `pvgis_izgara` saatlik serilerini kullanan BinaDeposu."""

    def __init__(self) -> None:
        self._pvgis_saatlik: dict[str, list[float]] = {}

    def hepsi(self) -> list[dict]:
        return depo_binalar()

    def getir(self, bina_id: int) -> dict | None:
        return next(
            (
                b
                for b in depo_binalar()
                if b.get("osm_id") == bina_id or b.get("id") == bina_id
            ),
            None,
        )

    def saatlik_uretim_wh_kwp(self, bina_id: int) -> list[float] | None:
        bina = self.getir(bina_id)
        if not bina:
            return None
        pvgis_id = bina.get("pvgis_id")
        if not pvgis_id:
            return None
        anahtar = str(pvgis_id)
        if anahtar in self._pvgis_saatlik:
            return self._pvgis_saatlik[anahtar]
        try:
            doc = (
                get_firestore_client()
                .collection("pvgis_izgara")
                .document(anahtar)
                .get()
            )
            if doc.exists:
                veri = doc.to_dict() or {}
                saatlik = veri.get("saatlik_wh")
                if isinstance(saatlik, list) and len(saatlik) == 8760:
                    dizi = [float(x) for x in saatlik]
                    self._pvgis_saatlik[anahtar] = dizi
                    return dizi
        except Exception as exc:
            logger.warning("PVGIS saatlik seri okunamadı (%s): %s", anahtar, exc)
        return None


_varsayilan_depo = _OrtakBinaDeposu()


def get_bina_deposu() -> BinaDeposu:
    """FastAPI Depends ile BinaDeposu sağlar."""
    return _varsayilan_depo


def _hata_yaniti(hata: Hata) -> JSONResponse:
    """Domain/Application `Hata` nesnesini PROJE.md Bölüm 9 HTTP hata biçimine çevirir."""
    durum_haritasi = {
        "bulunamadi": 404,
        "gecersiz": 400,
        "yetkisiz": 401,
        "yasak": 403,
        "kota": 429,
        "veritabani": 503,
    }
    durum = durum_haritasi.get(hata.kod, 400)
    return JSONResponse(
        status_code=durum,
        content={"hata": {"kod": hata.kod, "mesaj": hata.mesaj}},
    )


def _toplu_istegi_coz(
    istek: TopluHesapIstegi | VarsayimlarDto | dict[str, Any] | None,
) -> tuple[VarsayimlarDto, str]:
    """İstek gövdesinden `(VarsayimlarDto, osb)` ikilisini çıkarır."""
    if istek is None:
        return VarsayimlarDto(), "manisa"
    if isinstance(istek, TopluHesapIstegi):
        return istek.varsayimlar, istek.osb or "manisa"
    if isinstance(istek, VarsayimlarDto):
        return istek, "manisa"
    if isinstance(istek, dict):
        osb = str(istek.get("osb") or "manisa").strip() or "manisa"
        if "varsayimlar" in istek and isinstance(istek["varsayimlar"], dict):
            return VarsayimlarDto.model_validate(istek["varsayimlar"]), osb
        kopya = {k: v for k, v in istek.items() if k != "osb"}
        if not kopya:
            return VarsayimlarDto(), osb
        return VarsayimlarDto.model_validate(kopya), osb
    return VarsayimlarDto(), "manisa"


@router.post("/hesap/toplu", response_model=TopluHesapYaniti)
async def hesap_toplu(
    istek: TopluHesapIstegi | VarsayimlarDto | None = Body(default=None),
    depo: BinaDeposu = Depends(get_bina_deposu),
) -> TopluHesapYaniti | JSONResponse:
    """Seçilen OSB'deki bütün çatılar için yıllık güneş enerjisi hesabını, 25Y finansı, skoru ve OSB özetini döner."""
    varsayim_dto, osb = _toplu_istegi_coz(istek)
    try:
        sonuc = await TopluHesapSorgusu(depo).calistir(
            varsayim_dto.to_domain(), osb=osb
        )
    except VeritabaniHatasi:
        return _hata_yaniti(Hata(kod="veritabani", mesaj="Firestore'a ulaşılamadı"))

    if not sonuc.basarili or sonuc.deger is None:
        return _hata_yaniti(
            sonuc.hata or Hata(kod="hata", mesaj="Toplu hesap başarısız.")
        )

    ozet_dto = OsbOzetiDto.from_domain(sonuc.deger.ozet)
    return TopluHesapYaniti(
        sonuclar=[HesapSonucuDto.from_domain(s) for s in sonuc.deger.sonuclar],
        ozet=ozet_dto,
        osb_ozeti=ozet_dto,
    )


@router.post("/hesap/bina/{bina_id}", response_model=HesapSonucuDto)
async def hesap_bina(
    bina_id: int,
    istek: BinaHesapIstegi | None = Body(default=None),
    depo: BinaDeposu = Depends(get_bina_deposu),
) -> HesapSonucuDto | JSONResponse:
    """Tek bir bina için yıllık yatırım analizini, 25 yıllık finans metriklerini ve uygunluk skorunu döner."""
    girdi = istek or BinaHesapIstegi()
    try:
        sonuc = await BinaHesapSorgusu(depo).calistir(
            bina_id=bina_id,
            varsayimlar=girdi.varsayimlar.to_domain(),
            yillik_tuketim_kwh=girdi.yillik_tuketim_kwh,
        )
    except VeritabaniHatasi:
        return _hata_yaniti(Hata(kod="veritabani", mesaj="Firestore'a ulaşılamadı"))

    if not sonuc.basarili or sonuc.deger is None:
        return _hata_yaniti(
            sonuc.hata or Hata(kod="bulunamadi", mesaj="Bina bulunamadı.")
        )

    return HesapSonucuDto.from_domain(sonuc.deger)


@router.post("/hesap/finans/{bina_id}", response_model=list[YillikNakitAkisiDto])
async def hesap_finans(
    bina_id: int,
    istek: FinansIstegi | None = Body(default=None),
    depo: BinaDeposu = Depends(get_bina_deposu),
) -> list[YillikNakitAkisiDto] | JSONResponse:
    """Tek bir bina için 25 yılın her yılına ait üretim, tasarruf, bakım, net ve kümülatif nakit akışını döner."""
    girdi = istek or FinansIstegi()
    try:
        sonuc = await FinansSorgusu(depo).calistir(
            bina_id=bina_id,
            varsayimlar=girdi.varsayimlar.to_domain(),
            yillik_tuketim_kwh=girdi.yillik_tuketim_kwh,
        )
    except VeritabaniHatasi:
        return _hata_yaniti(Hata(kod="veritabani", mesaj="Firestore'a ulaşılamadı"))

    if not sonuc.basarili or sonuc.deger is None:
        return _hata_yaniti(
            sonuc.hata or Hata(kod="bulunamadi", mesaj="Finans hesabı için bina bulunamadı.")
        )

    return [YillikNakitAkisiDto.from_domain(y) for y in sonuc.deger]


@router.post("/hesap/simulasyon/{bina_id}", response_model=SimulasyonSonucuDto)
async def hesap_simulasyon(
    bina_id: int,
    istek: SimulasyonIstegi | None = Body(default=None),
    depo: BinaDeposu = Depends(get_bina_deposu),
) -> SimulasyonSonucuDto | JSONResponse:
    """Bina için 8.760 saatlik mahsuplaşma, vardiya, pil, kredi, statik ve şebeke simülasyonunu döner."""
    girdi = istek or SimulasyonIstegi()
    try:
        sonuc = await SimulasyonSorgusu(depo).calistir(
            bina_id=bina_id,
            varsayimlar=girdi.varsayimlar.to_domain(),
            vardiya=girdi.vardiya,
            yillik_tuketim_kwh=girdi.yillik_tuketim_kwh,
            pil_girdisi=girdi.pil.to_domain() if girdi.pil is not None else None,
            kredi_girdisi=girdi.kredi.to_domain() if girdi.kredi is not None else None,
            sebeke_girdisi=girdi.sebeke.to_domain(),
        )
    except VeritabaniHatasi:
        return _hata_yaniti(Hata(kod="veritabani", mesaj="Firestore'a ulaşılamadı"))

    if not sonuc.basarili or sonuc.deger is None:
        return _hata_yaniti(
            sonuc.hata
            or Hata(kod="bulunamadi", mesaj="Simülasyon için bina bulunamadı.")
        )

    return SimulasyonSonucuDto.from_domain(sonuc.deger)


@router.get("/hesap/sirala", response_model=list[HesapSonucuDto])
async def hesap_sirala(
    olcut: SiralamaOlcutuLiteral = Query(default="tasarruf_tl"),
    adet: int = Query(default=20, ge=1, le=1000),
    osb: str = Query(default="manisa"),
    depo: BinaDeposu = Depends(get_bina_deposu),
) -> list[HesapSonucuDto] | JSONResponse:
    """Seçilen OSB binalarını belirtilen ölçüte göre (tasarruf_tl, uygunluk_skoru, nbd_tl vb.) sıralı döner."""
    try:
        sonuc = await SiralamaSorgusu(depo).calistir(
            olcut=olcut, adet=adet, osb=osb
        )
    except VeritabaniHatasi:
        return _hata_yaniti(Hata(kod="veritabani", mesaj="Firestore'a ulaşılamadı"))

    if not sonuc.basarili or sonuc.deger is None:
        return _hata_yaniti(
            sonuc.hata or Hata(kod="gecersiz", mesaj="Sıralama yapılamadı.")
        )

    return [HesapSonucuDto.from_domain(s) for s in sonuc.deger]


@router.get("/varsayimlar", response_model=VarsayimlarYaniti)
async def varsayimlari_getir() -> VarsayimlarYaniti:
    """Varsayılan hesap parametrelerini, kaydırıcı aralıklarını, kaynaklarını ve tarihlerini döner."""
    sonuc = VarsayimlariGetirSorgusu().calistir()
    cikti = sonuc.deger
    assert cikti is not None
    return VarsayimlarYaniti(
        varsayimlar=VarsayimlarDto.from_domain(cikti.varsayilanlar),
        kaynaklar=[VarsayimKaynagiDto.from_domain(k) for k in cikti.kaynaklar],
    )
