"""
Manisa OSB binalarını Overpass'tan çekip Firestore'a yükler (PROJE.md §7, adım 1-2).
Kullanım (backend/ klasöründe):
    python -m scripts.veri_yukle            # ham veri varsa onu kullanır
    python -m scripts.veri_yukle --yeniden  # Overpass'tan tekrar çeker
    python -m scripts.veri_yukle --kuru     # Firestore'a yazmadan özet basar
"""
from __future__ import annotations

import json
import math
import sys
import time
from pathlib import Path

import httpx
from shapely.geometry import Polygon

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from app.core.firebase import get_firestore_client  # noqa: E402

HAM_DOSYA = BACKEND / "data" / "raw" / "binalar.json"
OSB_WAY_ID = 808798100
MIN_ALAN_M2 = 1000
SORGU = (
    "[out:json][timeout:120];"
    f"(way({OSB_WAY_ID});way[\"building\"](38.6075,27.2947,38.6367,27.3766););"
    "out geom;"
)
SUNUCULAR = [
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
# overpass-api.de varsayılan python-httpx UA'sını 406 ile reddediyor
USER_AGENT = "suntech-cati-radari/0.1 (github.com/nazimhikmetsasi/suntech-cati-radari)"


def overpass_cek(sorgu: str = SORGU) -> dict:
    bekle = 5
    # trust_env=False: sistemdeki HTTPS_PROXY 503 döndürüyor
    with httpx.Client(trust_env=False, headers={"User-Agent": USER_AGENT}, timeout=150) as client:
        for deneme in range(1, 6):
            for url in SUNUCULAR:
                try:
                    print(f"deneme {deneme}: {url}")
                    r = client.post(url, data={"data": sorgu})
                    if r.status_code == 200:
                        return r.json()
                    print(f"  HTTP {r.status_code}")
                except httpx.HTTPError as e:
                    print(f"  hata: {e}")
            time.sleep(bekle)
            bekle *= 2
    raise RuntimeError("Overpass sunucularının hepsi başarısız")


def ham_veri(yeniden: bool) -> dict:
    if HAM_DOSYA.exists() and not yeniden:
        print(f"ham veri: {HAM_DOSYA}")
        return json.loads(HAM_DOSYA.read_text(encoding="utf-8"))
    veri = overpass_cek()
    HAM_DOSYA.parent.mkdir(parents=True, exist_ok=True)
    HAM_DOSYA.write_text(json.dumps(veri, ensure_ascii=False), encoding="utf-8")
    return veri


def alan_m2(koord: list[tuple[float, float]]) -> float:
    # ponytail: yerel eşdikdörtgen izdüşüm, ~3 km'lik alanda hata %0,1 altı; geniş alanda pyproj Geod kullan
    lat0 = math.radians(sum(y for _, y in koord) / len(koord))
    k = 6_371_008.8 * math.pi / 180
    return Polygon([(x * k * math.cos(lat0), y * k) for x, y in koord]).area


def binalari_hazirla(veri: dict) -> list[dict]:
    osb_el = next(e for e in veri["elements"] if e["id"] == OSB_WAY_ID)
    osb = Polygon([(p["lon"], p["lat"]) for p in osb_el["geometry"]])

    binalar = []
    for el in veri["elements"]:
        tags = el.get("tags", {})
        if el["type"] != "way" or "building" not in tags or "geometry" not in el:
            continue
        koord = [(p["lon"], p["lat"]) for p in el["geometry"]]
        if len(koord) < 4:
            continue
        poly = Polygon(koord)
        if not poly.is_valid:
            poly = poly.buffer(0)
        merkez = poly.representative_point()
        if not osb.contains(merkez):
            continue
        alan = alan_m2(koord)
        if alan < MIN_ALAN_M2:
            continue
        binalar.append({
            "osm_id": el["id"],
            "ad": tags.get("name", ""),
            "alan_m2": round(alan, 1),
            "geom": [{"lon": x, "lat": y} for x, y in koord],
            "merkez": {"lat": merkez.y, "lon": merkez.x},
            "osb_id": str(OSB_WAY_ID),
        })
    return binalar


def firestore_yaz(binalar: list[dict]) -> None:
    db = get_firestore_client()
    col = db.collection("binalar")
    for i in range(0, len(binalar), 400):
        batch = db.batch()
        for b in binalar[i : i + 400]:
            batch.set(col.document(str(b["osm_id"])), b, merge=True)
        batch.commit()
        print(f"  {min(i + 400, len(binalar))}/{len(binalar)} yazıldı")


if __name__ == "__main__":
    binalar = binalari_hazirla(ham_veri("--yeniden" in sys.argv))
    toplam = sum(b["alan_m2"] for b in binalar)
    print(f"{len(binalar)} bina (OSB içinde, >= {MIN_ALAN_M2} m²), toplam {toplam / 1e6:.2f} km²")
    assert binalar, "bina çıkmadı"
    if "--kuru" not in sys.argv:
        firestore_yaz(binalar)
