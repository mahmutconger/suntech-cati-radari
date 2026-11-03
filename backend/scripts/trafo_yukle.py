"""
Bir OSB için OSM'den trafo merkezlerini ve güneş paneli alanlarını çekip Firestore'a yazar (PROJE.md §7 adım 4, §22).
Her binaya mevcut_ges ve en yakın trafoya uzaklık (trafo_mesafe_km) yazılır.
Önce scripts.veri_yukle aynı --osb ile çalışmış olmalı.
Kullanım (backend/ klasöründe):
    python -m scripts.trafo_yukle --osb manisa            # ham veri varsa onu kullanır
    python -m scripts.trafo_yukle --osb manisa --yeniden  # Overpass'tan tekrar çeker
    python -m scripts.trafo_yukle --osb manisa --kuru     # Firestore'a yazmadan özet basar
"""
from __future__ import annotations

import sys

from google.cloud.firestore_v1 import DELETE_FIELD, ArrayUnion
from google.cloud.firestore_v1.base_query import FieldFilter
from shapely.geometry import Point, Polygon

from scripts.veri_yukle import HAM_KLASOR, onbellekli, secili_osb, sinir_kutusu, sinir_oku

from app.core.firebase import get_firestore_client  # noqa: E402
from app.core.geo import haversine_km  # noqa: E402

CEVRE_DERECE = 0.05  # trafo OSB'nin dışında olabilir; kutu her yönde ~5 km büyütülür


def sorgu(k: dict) -> str:
    osb = f"{k['guney']},{k['bati']},{k['kuzey']},{k['dogu']}"
    c = CEVRE_DERECE
    cevre = f"{k['guney'] - c},{k['bati'] - c},{k['kuzey'] + c},{k['dogu'] + c}"
    return (
        "[out:json][timeout:120];("
        f'nwr["power"="substation"]({cevre});'
        f'nwr["generator:source"="solar"]({osb});'
        f'nwr["plant:source"="solar"]({osb});'
        ");out geom;"
    )


def sekil(el: dict):
    if el["type"] == "node":
        return Point(el["lon"], el["lat"])
    if "geometry" in el and len(el["geometry"]) >= 4:
        return Polygon([(p["lon"], p["lat"]) for p in el["geometry"]]).buffer(0)
    b = el["bounds"]  # relation: kutunun merkezi yeter
    return Point((b["minlon"] + b["maxlon"]) / 2, (b["minlat"] + b["maxlat"]) / 2)


def gerilim_kv(tags: dict) -> float | None:
    degerler = [int(v) for v in tags.get("voltage", "").split(";") if v.strip().isdigit()]
    return max(degerler) / 1000 if degerler else None


def trafolari_hazirla(veri: dict, slug: str) -> list[dict]:
    trafolar = []
    for el in veri["elements"]:
        tags = el.get("tags", {})
        if tags.get("power") != "substation" or tags.get("substation") == "minor_distribution":
            continue
        kv = gerilim_kv(tags)
        if not tags.get("name") and kv is None:
            continue  # isimsiz, gerilimsiz küçük dağıtım trafoları
        merkez = sekil(el).representative_point()
        trafolar.append({
            "osm_id": el["id"],
            "ad": tags.get("name", ""),
            "isletmeci": tags.get("operator", ""),
            "gerilim_kv": kv,
            "nokta": {"lat": merkez.y, "lon": merkez.x},
            "kalan_kapasite_mw": None,  # TEİAŞ bağlantı kapasitesi tablosundan elle girilecek
            "kaynak": "OSM",
        })
    return trafolar


def en_yakin_km(merkez: dict, trafolar: list[dict]) -> float | None:
    if not trafolar:
        return None
    return round(min(haversine_km(merkez["lat"], merkez["lon"], t["nokta"]["lat"], t["nokta"]["lon"]) for t in trafolar), 2)


def gunes_sekilleri(veri: dict) -> list:
    return [sekil(el) for el in veri["elements"]
            if {"generator:source", "plant:source"} & {k for k, v in el.get("tags", {}).items() if v == "solar"}]


def firestore_yaz(slug: str, trafolar: list[dict], gunes: list) -> None:
    db = get_firestore_client()
    col = db.collection("trafo_merkezleri")
    for t in trafolar:
        # Komşu OSB'ler (Manisa ve Muradiye) aynı trafoları paylaşır; her trafo birden çok OSB'ye ait olabilir
        col.document(str(t["osm_id"])).set(t | {"osblar": ArrayUnion([slug]), "osb": DELETE_FIELD}, merge=True)
    print(f"{len(trafolar)} trafo yazıldı")

    sorgu_ = db.collection("binalar").where(filter=FieldFilter("osb", "==", slug))
    docs = list(sorgu_.select(["geom", "merkez"]).stream())
    assert docs, f"{slug} binası yok, önce scripts.veri_yukle --osb {slug} çalıştır"
    # Uydu tespiti panel gördüyse OSM'de panel olmasa da mevcut GES sayılır
    uydu_var = {d.id for d in db.collection("uydu_sonuclari").where(filter=FieldFilter("panel", "==", "var")).stream()}
    panelli = 0
    for i in range(0, len(docs), 400):
        batch = db.batch()
        for d in docs[i : i + 400]:
            v = d.to_dict()
            cati = Polygon([(p["lon"], p["lat"]) for p in v["geom"]]).buffer(0)
            var = d.id in uydu_var or any(cati.intersects(g) for g in gunes)
            panelli += var
            batch.update(d.reference, {"mevcut_ges": var, "trafo_mesafe_km": en_yakin_km(v["merkez"], trafolar)})
        batch.commit()
    print(f"{len(docs)} binaya mevcut_ges ve trafo_mesafe_km yazıldı, {panelli} tanesi panelli")


if __name__ == "__main__":
    assert gerilim_kv({"voltage": "34500;380"}) == 34.5 and gerilim_kv({}) is None
    assert en_yakin_km({"lat": 38.62, "lon": 27.33}, [{"nokta": {"lat": 38.63, "lon": 27.33}}]) == 1.11
    slug, osb = secili_osb()
    kutu = sinir_kutusu(sinir_oku(slug, osb))
    veri = onbellekli(HAM_KLASOR / f"trafo_gunes_{slug}.json", sorgu(kutu), "--yeniden" in sys.argv)
    trafolar = trafolari_hazirla(veri, slug)
    gunes = gunes_sekilleri(veri)
    for t in trafolar:
        print(f"  {t['osm_id']}: {t['ad'] or '(isimsiz)'} {t['gerilim_kv']} kV")
    print(f"{slug}: {len(trafolar)} trafo, {len(gunes)} güneş paneli alanı")
    if "--kuru" not in sys.argv:
        firestore_yaz(slug, trafolar, gunes)
