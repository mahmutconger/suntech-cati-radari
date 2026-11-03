from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.application import bina
from app.infrastructure.depo import binalar, trafolar

router = APIRouter(tags=["binalar"])


@router.get("/binalar")
def binalar_listele() -> dict:
    """OSB'deki bütün binalar, GeoJSON FeatureCollection (bbox filtresi istemcide)."""
    return {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "id": b["osm_id"], "geometry": bina.cokgen(b), "properties": bina.ozet(b)}
            for b in binalar()
        ],
    }


@router.get("/binalar/ara")
def binalar_ara(q: str = Query(min_length=1, max_length=100)) -> list[dict]:
    """Ada ya da OSM kimliğine göre arama, en çok 20 sonuç."""
    return bina.ara(q)


@router.get("/binalar/yakin")
def binalar_yakin(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
    r: float = Query(1.0, gt=0, le=20, description="km"),
) -> list[dict]:
    """Noktaya r km içindeki binalar, yakından uzağa, en çok 50 sonuç."""
    return bina.yakin(lat, lon, r)


@router.get("/binalar/{bina_id}")
def bina_detay(bina_id: int) -> dict:
    sonuc = bina.detay(bina_id)
    if sonuc is None:
        raise HTTPException(404, detail={"kod": "bina_yok", "mesaj": "Bina bulunamadı"})
    return sonuc


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
