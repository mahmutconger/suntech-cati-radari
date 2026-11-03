"""
OSM'den trafo merkezlerini ve güneş paneli alanlarını çekip Firestore'a yazar (PROJE.md §7, adım 4).
Önce scripts.veri_yukle çalışmış olmalı.
Kullanım (backend/ klasöründe):
    python -m scripts.trafo_yukle            # ham veri varsa onu kullanır
    python -m scripts.trafo_yukle --yeniden  # Overpass'tan tekrar çeker
    python -m scripts.trafo_yukle --kuru     # Firestore'a yazmadan özet basar
"""
from __future__ import annotations

import json
import sys

from shapely.geometry import Point, Polygon

from scripts.veri_yukle import BACKEND, overpass_cek

from app.core.firebase import get_firestore_client  # noqa: E402

HAM_DOSYA = BACKEND / "data" / "raw" / "trafo_gunes.json"
OSB_KUTU = "38.6075,27.2947,38.6367,27.3766"
SORGU = (
    "[out:json][timeout:120];("
    'nwr["power"="substation"](38.57,27.24,38.67,27.44);'  # OSB ve çevresi
    f'nwr["generator:source"="solar"]({OSB_KUTU});'
    f'nwr["plant:source"="solar"]({OSB_KUTU});'
    ");out geom;"
)


def ham_veri(yeniden: bool) -> dict:
    if HAM_DOSYA.exists() and not yeniden:
        print(f"ham veri: {HAM_DOSYA}")
        return json.loads(HAM_DOSYA.read_text(encoding="utf-8"))
    veri = overpass_cek(SORGU)
    HAM_DOSYA.parent.mkdir(parents=True, exist_ok=True)
    HAM_DOSYA.write_text(json.dumps(veri, ensure_ascii=False), encoding="utf-8")
    return veri


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


def trafolari_hazirla(veri: dict) -> list[dict]:
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


def gunes_sekilleri(veri: dict) -> list:
    return [sekil(el) for el in veri["elements"]
            if {"generator:source", "plant:source"} & {k for k, v in el.get("tags", {}).items() if v == "solar"}]


def firestore_yaz(trafolar: list[dict], gunes: list) -> None:
    db = get_firestore_client()
    col = db.collection("trafo_merkezleri")
    for t in trafolar:
        col.document(str(t["osm_id"])).set(t)
    print(f"{len(trafolar)} trafo yazıldı")

    docs = list(db.collection("binalar").select(["geom"]).stream())
    assert docs, "binalar boş, önce scripts.veri_yukle çalıştır"
    panelli = 0
    for i in range(0, len(docs), 400):
        batch = db.batch()
        for d in docs[i : i + 400]:
            cati = Polygon([(p["lon"], p["lat"]) for p in d.to_dict()["geom"]]).buffer(0)
            var = any(cati.intersects(g) for g in gunes)
            panelli += var
            batch.update(d.reference, {"mevcut_ges": var})
        batch.commit()
    print(f"{len(docs)} binaya mevcut_ges yazıldı, {panelli} tanesi panelli")


if __name__ == "__main__":
    assert gerilim_kv({"voltage": "34500;380"}) == 34.5 and gerilim_kv({}) is None
    veri = ham_veri("--yeniden" in sys.argv)
    trafolar = trafolari_hazirla(veri)
    gunes = gunes_sekilleri(veri)
    for t in trafolar:
        print(f"  {t['osm_id']}: {t['ad'] or '(isimsiz)'} {t['gerilim_kv']} kV")
    print(f"{len(trafolar)} trafo, {len(gunes)} güneş paneli alanı")
    if "--kuru" not in sys.argv:
        firestore_yaz(trafolar, gunes)
