from __future__ import annotations

from app.core.geo import haversine_km
from app.infrastructure.depo import VARSAYILAN_OSB, binalar, osblar, trafolar


def ozet(b: dict) -> dict:
    return {
        "id": b["osm_id"],
        "ad": b.get("ad", ""),
        "alan_m2": b["alan_m2"],
        "merkez": [b["merkez"]["lon"], b["merkez"]["lat"]],
        "osb": b.get("osb", VARSAYILAN_OSB),
    }


def osb_var_mi(osb: str) -> bool:
    return any(o["id"] == osb for o in osblar())


def osb_listesi() -> list[dict]:
    """Bina sayısı çoktan aza; Firestore'daki parçalar GeoJSON MultiPolygon'a çevrilir."""
    def geojson(o: dict) -> dict:
        halkalar = [[[[p["lon"], p["lat"]] for p in parca["noktalar"]]] for parca in o["sinir"]]
        return {"type": "MultiPolygon", "coordinates": halkalar}
    return sorted((o | {"sinir": geojson(o)} for o in osblar()), key=lambda o: -o["bina_sayisi"])


def cokgen(b: dict) -> dict:
    return {"type": "Polygon", "coordinates": [[[p["lon"], p["lat"]] for p in b["geom"]]]}


def _mesafe(b: dict, nokta: dict) -> float:
    return haversine_km(b["merkez"]["lat"], b["merkez"]["lon"], nokta["lat"], nokta["lon"])


def _kucuk_harf(s: str) -> str:
    return s.replace("I", "ı").replace("İ", "i").lower()


def ara(q: str, n: int = 20, osb: str | None = None) -> list[dict]:
    """Ada ya da OSM kimliğine göre, büyük çatı önce. osb verilmezse bütün OSB'lerde arar."""
    aranan = _kucuk_harf(q.strip())
    sonuc = [b for b in binalar(osb) if aranan in _kucuk_harf(b.get("ad", "")) or aranan == str(b["osm_id"])]
    sonuc.sort(key=lambda b: -b["alan_m2"])
    return [ozet(b) for b in sonuc[:n]]


def yakin(lat: float, lon: float, r_km: float, n: int = 50) -> list[dict]:
    nokta = {"lat": lat, "lon": lon}
    liste = [ozet(b) | {"mesafe_km": round(_mesafe(b, nokta), 3)} for b in binalar()]
    return sorted((y for y in liste if y["mesafe_km"] <= r_km), key=lambda y: y["mesafe_km"])[:n]


def detay(bina_id: int) -> dict | None:
    b = next((b for b in binalar() if b["osm_id"] == bina_id), None)
    if b is None:
        return None
    trafo = min(trafolar(b.get("osb", VARSAYILAN_OSB)), key=lambda t: _mesafe(b, t["nokta"]), default=None)
    return ozet(b) | {
        "verim_kwh_kwp": b.get("verim_kwh_kwp"),
        "mevcut_ges": b.get("mevcut_ges", False),
        "pvgis_id": b.get("pvgis_id"),
        "trafo_mesafe_km": b.get("trafo_mesafe_km"),
        "geometri": cokgen(b),
        "en_yakin_trafo": trafo and {
            "id": trafo["osm_id"],
            "ad": trafo["ad"],
            "gerilim_kv": trafo["gerilim_kv"],
            "mesafe_km": round(_mesafe(b, trafo["nokta"]), 3),
        },
    }
