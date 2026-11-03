from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.core.firebase import get_firestore_client
from app.core.geo import haversine_km

router = APIRouter(tags=["binalar"])

# ponytail: süreç içi önbellek (~400 bina, ~10 trafo); veri hattı yeniden çalışınca sunucu yeniden başlatılmalı
_onbellek: dict[str, list[dict]] = {}


def _koleksiyon(ad: str) -> list[dict]:
    if ad not in _onbellek:
        try:
            _onbellek[ad] = [d.to_dict() for d in get_firestore_client().collection(ad).stream()]
        except Exception:
            raise HTTPException(503, detail={"kod": "veritabani", "mesaj": "Firestore'a ulaşılamadı"})
    return _onbellek[ad]


def binalar() -> list[dict]:
    return _koleksiyon("binalar")


def trafolar() -> list[dict]:
    return _koleksiyon("trafo_merkezleri")


def _ozet(b: dict) -> dict:
    return {
        "id": b["osm_id"],
        "ad": b.get("ad", ""),
        "alan_m2": b["alan_m2"],
        "merkez": [b["merkez"]["lon"], b["merkez"]["lat"]],
    }


def _cokgen(b: dict) -> dict:
    return {"type": "Polygon", "coordinates": [[[p["lon"], p["lat"]] for p in b["geom"]]]}


def _mesafe(b: dict, nokta: dict) -> float:
    return haversine_km(b["merkez"]["lat"], b["merkez"]["lon"], nokta["lat"], nokta["lon"])


def _kucuk_harf(s: str) -> str:
    return s.replace("I", "ı").replace("İ", "i").lower()


@router.get("/binalar")
def binalar_listele() -> dict:
    """OSB'deki bütün binalar, GeoJSON FeatureCollection (bbox filtresi istemcide)."""
    return {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "id": b["osm_id"], "geometry": _cokgen(b), "properties": _ozet(b)}
            for b in binalar()
        ],
    }


@router.get("/binalar/ara")
def binalar_ara(q: str = Query(min_length=1, max_length=100)) -> list[dict]:
    """Ada ya da OSM kimliğine göre arama, en çok 20 sonuç."""
    aranan = _kucuk_harf(q.strip())
    sonuc = [b for b in binalar() if aranan in _kucuk_harf(b.get("ad", "")) or aranan == str(b["osm_id"])]
    sonuc.sort(key=lambda b: -b["alan_m2"])
    return [_ozet(b) for b in sonuc[:20]]


@router.get("/binalar/yakin")
def binalar_yakin(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
    r: float = Query(1.0, gt=0, le=20, description="km"),
) -> list[dict]:
    """Noktaya r km içindeki binalar, yakından uzağa, en çok 50 sonuç."""
    nokta = {"lat": lat, "lon": lon}
    yakinlar = [_ozet(b) | {"mesafe_km": round(_mesafe(b, nokta), 3)} for b in binalar()]
    yakinlar = sorted((y for y in yakinlar if y["mesafe_km"] <= r), key=lambda y: y["mesafe_km"])
    return yakinlar[:50]


@router.get("/binalar/{bina_id}")
def bina_detay(bina_id: int) -> dict:
    b = next((b for b in binalar() if b["osm_id"] == bina_id), None)
    if b is None:
        raise HTTPException(404, detail={"kod": "bina_yok", "mesaj": "Bina bulunamadı"})
    trafo = min(trafolar(), key=lambda t: _mesafe(b, t["nokta"]), default=None)
    return _ozet(b) | {
        "verim_kwh_kwp": b.get("verim_kwh_kwp"),
        "mevcut_ges": b.get("mevcut_ges", False),
        "pvgis_id": b.get("pvgis_id"),
        "geometri": _cokgen(b),
        "en_yakin_trafo": trafo and {
            "id": trafo["osm_id"],
            "ad": trafo["ad"],
            "gerilim_kv": trafo["gerilim_kv"],
            "mesafe_km": round(_mesafe(b, trafo["nokta"]), 3),
        },
    }


@router.get("/trafo-merkezleri")
def trafo_merkezleri() -> dict:
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": t["osm_id"],
                "geometry": {"type": "Point", "coordinates": [t["nokta"]["lon"], t["nokta"]["lat"]]},
                "properties": {k: t[k] for k in ("ad", "isletmeci", "gerilim_kv", "kalan_kapasite_mw", "kaynak")}
                | {"id": t["osm_id"]},
            }
            for t in trafolar()
        ],
    }
