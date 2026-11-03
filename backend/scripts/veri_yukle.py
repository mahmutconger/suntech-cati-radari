"""
Bir OSB'nin sınırını ve içindeki binaları Overpass'tan çekip Firestore'a yükler (PROJE.md §7 adım 1-2, §22).
Kullanım (backend/ klasöründe):
    python -m scripts.veri_yukle --osb manisa            # ham veri varsa onu kullanır
    python -m scripts.veri_yukle --osb akhisar --yeniden # Overpass'tan tekrar çeker
    python -m scripts.veri_yukle --osb manisa --kuru     # Firestore'a yazmadan özet basar
Yeni OSB eklemek için OSBLAR sözlüğüne OSM kimliğini yaz.
"""
from __future__ import annotations

import json
import math
import sys
import time
from pathlib import Path

import httpx
from shapely.geometry import LineString, MultiPolygon, Polygon
from shapely.ops import polygonize, unary_union

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from app.core.firebase import get_firestore_client  # noqa: E402

HAM_KLASOR = BACKEND / "data" / "raw"
MIN_ALAN_M2 = 1000
# OSM'deki sınır parçaları ("way" ya da "relation", kimlik); birden çok parça birleştirilir.
# Yalnızca OSM'de sınırı "Organize Sanayi Bölgesi" olarak çizili OSB'ler. Akhisar, Turgutlu ve
# Alaşehir OSB'lerinin sınırı OSM'de yok (3 Kasım 2026); Soma OSB'de 1.000 m² üstü bina çizilmemiş.
OSBLAR: dict[str, dict] = {
    "manisa": {"ad": "Manisa OSB", "parcalar": [("way", 808798100)]},
    "muradiye": {"ad": "Muradiye OSB", "parcalar": [("way", 175275389), ("way", 923090976), ("way", 1356991939)]},
    "salihli": {"ad": "Salihli OSB", "parcalar": [("way", 390978909)]},
}
SUNUCULAR = [
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
# overpass-api.de varsayılan python-httpx UA'sını 406 ile reddediyor
USER_AGENT = "suntech-cati-radari/0.1 (github.com/nazimhikmetsasi/suntech-cati-radari)"


def arguman(ad: str, varsayilan: str | None = None) -> str | None:
    if ad in sys.argv:
        return sys.argv[sys.argv.index(ad) + 1]
    return varsayilan


def secili_osb() -> tuple[str, dict]:
    slug = arguman("--osb", "manisa")
    if slug not in OSBLAR:
        raise SystemExit(f"bilinmeyen OSB: {slug}; seçenekler: {', '.join(OSBLAR)}")
    return slug, OSBLAR[slug]


def overpass_cek(sorgu: str) -> dict:
    bekle = 5
    # trust_env=False: sistemdeki HTTPS_PROXY 503 döndürüyor
    with httpx.Client(trust_env=False, headers={"User-Agent": USER_AGENT}, timeout=200) as client:
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


def onbellekli(dosya: Path, sorgu: str, yeniden: bool) -> dict:
    if dosya.exists() and not yeniden:
        print(f"ham veri: {dosya}")
        return json.loads(dosya.read_text(encoding="utf-8"))
    veri = overpass_cek(sorgu)
    dosya.parent.mkdir(parents=True, exist_ok=True)
    dosya.write_text(json.dumps(veri, ensure_ascii=False), encoding="utf-8")
    return veri


def sinir_sekli(el: dict) -> Polygon | MultiPolygon:
    if el["type"] == "way":
        return Polygon([(p["lon"], p["lat"]) for p in el["geometry"]]).buffer(0)
    # relation: dış halkaları birleştir, iç halkaları çıkar
    cizgiler = lambda rol: [LineString([(p["lon"], p["lat"]) for p in m["geometry"]])  # noqa: E731
                            for m in el["members"] if m.get("role", "outer") == rol and m.get("geometry")]
    dis = unary_union(list(polygonize(cizgiler("outer"))))
    ic = list(polygonize(cizgiler("inner")))
    return dis.difference(unary_union(ic)) if ic else dis


def parcalari_birlestir(veri: dict, osb: dict):
    kimlikler = {k for _, k in osb["parcalar"]}
    parcalar = [sinir_sekli(e) for e in veri["elements"] if e["id"] in kimlikler and e["type"] in ("way", "relation")]
    assert len(parcalar) == len(kimlikler), f"sınır parçası eksik: {len(parcalar)}/{len(kimlikler)}"
    return unary_union(parcalar)


def sinir_oku(slug: str, osb: dict):
    """veri_yukle'nin kaydettiği ham sınırdan çokgen (pvgis ve trafo betikleri için)."""
    veri = json.loads((HAM_KLASOR / f"sinir_{slug}.json").read_text(encoding="utf-8"))
    return parcalari_birlestir(veri, osb)


def sinir_kutusu(sekil) -> dict:
    bati, guney, dogu, kuzey = sekil.bounds
    return {"guney": round(guney, 5), "bati": round(bati, 5), "kuzey": round(kuzey, 5), "dogu": round(dogu, 5)}


def ham_veri(slug: str, osb: dict, yeniden: bool) -> tuple[object, dict]:
    parca_sorgu = "".join(f"{tip}({k});" for tip, k in osb["parcalar"])
    ham_sinir = onbellekli(HAM_KLASOR / f"sinir_{slug}.json", f"[out:json][timeout:60];({parca_sorgu});out geom;", yeniden)
    sinir = parcalari_birlestir(ham_sinir, osb)
    k = sinir_kutusu(sinir)
    sorgu = f"[out:json][timeout:180];way[\"building\"]({k['guney']},{k['bati']},{k['kuzey']},{k['dogu']});out geom;"
    return sinir, onbellekli(HAM_KLASOR / f"binalar_{slug}.json", sorgu, yeniden)


def alan_m2(koord: list[tuple[float, float]]) -> float:
    # ponytail: yerel eşdikdörtgen izdüşüm, birkaç km'lik alanda hata %0,1 altı; il ölçeğinde pyproj Geod kullan
    lat0 = math.radians(sum(y for _, y in koord) / len(koord))
    k = 6_371_008.8 * math.pi / 180
    return Polygon([(x * k * math.cos(lat0), y * k) for x, y in koord]).area


def binalari_hazirla(slug: str, sinir, veri: dict) -> list[dict]:
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
        if not sinir.contains(merkez):
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
            "osb": slug,
        })
    return binalar


def osb_dokumani(slug: str, osb: dict, sinir, bina_sayisi: int) -> dict:
    # Firestore doküman sınırı 1 MB ve iç içe dizi yok: her parçanın dış halkası ayrı map'te, ~10 m hassasiyet
    sade = sinir.simplify(0.0001)
    parcalar = [{"noktalar": [{"lon": round(x, 6), "lat": round(y, 6)} for x, y in p.exterior.coords]}
                for p in getattr(sade, "geoms", [sade])]
    merkez = sinir.representative_point()
    return {
        "id": slug,
        "ad": osb["ad"],
        "osm": [{"tip": tip, "id": k} for tip, k in osb["parcalar"]],
        "merkez": {"lat": merkez.y, "lon": merkez.x},
        "sinir_kutusu": sinir_kutusu(sinir),
        "sinir": parcalar,
        "bina_sayisi": bina_sayisi,
    }


def firestore_yaz(binalar: list[dict], osb_doc: dict) -> None:
    db = get_firestore_client()
    db.collection("osblar").document(osb_doc["id"]).set(osb_doc)
    col = db.collection("binalar")
    for i in range(0, len(binalar), 400):
        batch = db.batch()
        for b in binalar[i : i + 400]:
            batch.set(col.document(str(b["osm_id"])), b, merge=True)
        batch.commit()
        print(f"  {min(i + 400, len(binalar))}/{len(binalar)} yazıldı")


if __name__ == "__main__":
    slug, osb = secili_osb()
    sinir, veri = ham_veri(slug, osb, "--yeniden" in sys.argv)
    assert sinir.area > 0, "sınır çokgeni boş"
    binalar = binalari_hazirla(slug, sinir, veri)
    toplam = sum(b["alan_m2"] for b in binalar)
    print(f"{slug}: {len(binalar)} bina (OSB içinde, >= {MIN_ALAN_M2} m²), toplam {toplam / 1e6:.2f} km²")
    assert binalar, "bina çıkmadı"
    if "--kuru" not in sys.argv:
        firestore_yaz(binalar, osb_dokumani(slug, osb, sinir, len(binalar)))
