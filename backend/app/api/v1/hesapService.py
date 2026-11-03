"""Hesap motoru ve varsayımlar FastAPI router'ı (PROJE.md Bölüm 5.4 ve 9)."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Body, Depends, Query
from fastapi.responses import JSONResponse

from app.application.hesap import (
    BinaDeposu,
    BinaHesapSorgusu,
    Hata,
    SimulasyonSorgusu,
    SiralamaSorgusu,
    TopluHesapSorgusu,
    VarsayimlariGetirSorgusu,
)
from app.core.firebase import get_firestore_client
from app.domain.varliklar import Bina
from app.schemas.hesap import (
    BinaHesapIstegi,
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
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["hesap"])


class _FirestoreBellekBinaDeposu:
    """Firestore `binalar` koleksiyonunu süreç içi önbellekle okuyan BinaDeposu uygulaması."""

    def __init__(self) -> None:
        self._binalar: dict[int, Bina] | None = None
        self._saatlik_onbellek: dict[int, list[float]] = {}

    def _yukle(self) -> dict[int, Bina]:
        if self._binalar is not None:
            return self._binalar

        try:
            db = get_firestore_client()
            docs = db.collection("binalar").stream()
            sozluk: dict[int, Bina] = {}
            for doc in docs:
                veri = doc.to_dict() or {}
                if veri.get("osb", "manisa") != "manisa":  # geçici: osb parametresi gelene kadar yalnız Manisa (§22.3)
                    continue
                ham_id = veri.get("id") if veri.get("id") is not None else veri.get("osm_id", doc.id)
                if ham_id is None:
                    continue
                bina_id = int(ham_id)
                merkez_ham = veri.get("merkez")
                merkez = None
                if isinstance(merkez_ham, dict) and "lon" in merkez_ham and "lat" in merkez_ham:
                    merkez = (float(merkez_ham["lon"]), float(merkez_ham["lat"]))
                elif isinstance(merkez_ham, (list, tuple)) and len(merkez_ham) >= 2:
                    merkez = (float(merkez_ham[0]), float(merkez_ham[1]))

                ad_ham = veri.get("ad")
                sozluk[bina_id] = Bina(
                    id=bina_id,
                    alan_m2=float(veri.get("alan_m2", 0.0)),
                    verim_kwh_kwp=float(veri.get("verim_kwh_kwp") or 1340.0),
                    ad=str(ad_ham).strip() if ad_ham else None,
                    mevcut_ges=bool(veri.get("mevcut_ges", False)),
                    merkez=merkez,
                    osm_id=int(veri.get("osm_id", bina_id)),
                )
            self._binalar = sozluk
            return self._binalar
        except Exception as exc:
            logger.warning("Firestore'dan binalar okunamadı: %s", exc)
            return {}

    def hepsi(self) -> list[Bina]:
        return list(self._yukle().values())

    def getir(self, bina_id: int) -> Bina | None:
        return self._yukle().get(bina_id)

    def saatlik_uretim_wh_kwp(self, bina_id: int) -> list[float] | None:
        if bina_id in self._saatlik_onbellek:
            return self._saatlik_onbellek[bina_id]
        return None


_varsayilan_depo = _FirestoreBellekBinaDeposu()


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


def _varsayimlari_coz(
    istek: TopluHesapIstegi | VarsayimlarDto | dict[str, Any] | None,
) -> VarsayimlarDto:
    """İstek gövdesinden (`{varsayimlar: ...}` ya da doğrudan `{kullanilabilir_oran: ...}`) VarsayimlarDto çıkarır."""
    if istek is None:
        return VarsayimlarDto()
    if isinstance(istek, TopluHesapIstegi):
        return istek.varsayimlar
    if isinstance(istek, VarsayimlarDto):
        return istek
    if isinstance(istek, dict):
        if "varsayimlar" in istek and isinstance(istek["varsayimlar"], dict):
            return VarsayimlarDto.model_validate(istek["varsayimlar"])
        if not istek:
            return VarsayimlarDto()
        return VarsayimlarDto.model_validate(istek)
    return VarsayimlarDto()


@router.post("/hesap/toplu", response_model=TopluHesapYaniti)
async def hesap_toplu(
    istek: TopluHesapIstegi | VarsayimlarDto | None = Body(default=None),
    depo: BinaDeposu = Depends(get_bina_deposu),
) -> TopluHesapYaniti | JSONResponse:
    """OSB'deki bütün çatılar için yıllık güneş enerjisi hesabını ve OSB özetini döner."""
    varsayim_dto = _varsayimlari_coz(istek)
    sonuc = await TopluHesapSorgusu(depo).calistir(varsayim_dto.to_domain())
    if not sonuc.basarili or sonuc.deger is None:
        return _hata_yaniti(sonuc.hata or Hata(kod="hata", mesaj="Toplu hesap başarısız."))

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
    """Tek bir bina için (varsa yıllık tüketim sınırı dahil) yıllık yatırım analizini döner."""
    girdi = istek or BinaHesapIstegi()
    sonuc = await BinaHesapSorgusu(depo).calistir(
        bina_id=bina_id,
        varsayimlar=girdi.varsayimlar.to_domain(),
        yillik_tuketim_kwh=girdi.yillik_tuketim_kwh,
    )
    if not sonuc.basarili or sonuc.deger is None:
        return _hata_yaniti(sonuc.hata or Hata(kod="bulunamadi", mesaj="Bina bulunamadı."))

    return HesapSonucuDto.from_domain(sonuc.deger)


@router.post("/hesap/simulasyon/{bina_id}", response_model=SimulasyonSonucuDto)
async def hesap_simulasyon(
    bina_id: int,
    istek: SimulasyonIstegi | None = Body(default=None),
    depo: BinaDeposu = Depends(get_bina_deposu),
) -> SimulasyonSonucuDto | JSONResponse:
    """Bina için 8.760 saatlik mahsuplaşma, vardiya, pil, kredi, statik ve şebeke simülasyonunu döner."""
    girdi = istek or SimulasyonIstegi()
    sonuc = await SimulasyonSorgusu(depo).calistir(
        bina_id=bina_id,
        varsayimlar=girdi.varsayimlar.to_domain(),
        vardiya=girdi.vardiya,
        yillik_tuketim_kwh=girdi.yillik_tuketim_kwh,
        pil_girdisi=girdi.pil.to_domain() if girdi.pil is not None else None,
        kredi_girdisi=girdi.kredi.to_domain() if girdi.kredi is not None else None,
        sebeke_girdisi=girdi.sebeke.to_domain(),
    )
    if not sonuc.basarili or sonuc.deger is None:
        return _hata_yaniti(
            sonuc.hata or Hata(kod="bulunamadi", mesaj="Simülasyon için bina bulunamadı.")
        )

    return SimulasyonSonucuDto.from_domain(sonuc.deger)


@router.get("/hesap/sirala", response_model=list[HesapSonucuDto])
async def hesap_sirala(
    olcut: SiralamaOlcutuLiteral = Query(default="tasarruf_tl"),
    adet: int = Query(default=20, ge=1, le=1000),
    depo: BinaDeposu = Depends(get_bina_deposu),
) -> list[HesapSonucuDto] | JSONResponse:
    """OSB binalarını seçilen ölçüte göre (varsayılan: yıllık tasarruf, ilk 20) sıralı döner."""
    sonuc = await SiralamaSorgusu(depo).calistir(olcut=olcut, adet=adet)
    if not sonuc.basarili or sonuc.deger is None:
        return _hata_yaniti(sonuc.hata or Hata(kod="gecersiz", mesaj="Sıralama yapılamadı."))

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
