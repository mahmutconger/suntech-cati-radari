from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.firebase import get_firestore_client

router = APIRouter(tags=["binalar"])

# ponytail: süreç içi önbellek, veri hattı yeniden çalışınca sunucu yeniden başlatılmalı
_onbellek: dict | None = None


def _feature(b: dict) -> dict:
    halka = [[p["lon"], p["lat"]] for p in b["geom"]]
    return {
        "type": "Feature",
        "id": b["osm_id"],
        "geometry": {"type": "Polygon", "coordinates": [halka]},
        "properties": {
            "id": b["osm_id"],
            "ad": b.get("ad", ""),
            "alan_m2": b["alan_m2"],
            "merkez": [b["merkez"]["lon"], b["merkez"]["lat"]],
        },
    }


@router.get("/binalar")
def binalar_listele() -> dict:
    """OSB'deki bütün binalar, GeoJSON FeatureCollection (bbox filtresi istemcide)."""
    global _onbellek
    if _onbellek is None:
        try:
            docs = get_firestore_client().collection("binalar").stream()
            _onbellek = {"type": "FeatureCollection", "features": [_feature(d.to_dict()) for d in docs]}
        except Exception:
            raise HTTPException(503, detail={"kod": "veritabani", "mesaj": "Firestore'a ulaşılamadı"})
    return _onbellek
