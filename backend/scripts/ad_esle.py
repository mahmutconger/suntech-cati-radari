"""
OSM'deki işletme adlarını adsız çatılara yazar; veri_yukle binaya yalnızca kendi name etiketini verir.
Önce scripts.veri_yukle aynı --osb ile çalışmış olmalı. veri_yukle yeniden çalışırsa adları sıfırlar, bu betik de yeniden çalıştırılır.
Sonra Cloud Run yeniden başlatılmalı (süreç içi önbellek), en kolayı deploy.
Kullanım (backend/ klasöründe):
    python -m scripts.ad_esle --osb manisa --kuru   # yazmadan listeler
    python -m scripts.ad_esle --osb manisa
Kaynaklar (ad_kaynak alanı):
    osm_nokta: işletme noktası çatının içinde
    osm_yakin: nokta en çok 25 m uzakta ve ona en yakın bina bu çatı
    osm_alan:  çatı, adlı bir sanayi alanının içinde (ör. Bosch yerleşkesi)
"""
from __future__ import annotations

import json
import math
import re
import sys

from shapely.geometry import Point, Polygon
from shapely.ops import transform

from scripts.veri_yukle import HAM_KLASOR, binalari_hazirla, onbellekli, secili_osb, sinir_kutusu, sinir_oku, sinir_sekli

from app.core.firebase import get_firestore_client  # noqa: E402

YAKIN_M = 25
EN_BUYUK_NOKTA_M2 = 3000  # bundan küçük adlı şekil nokta sayılır
EN_BUYUK_ALAN_M2 = 500_000  # bundan büyüğü firma değil, OSB gibi genel alan
GENEL = re.compile(r"organize sanayi|\bosb\b|sanayi sitesi|yönetim binası|yemekhane|kantin|lisesi|okul|cami", re.I)
YORUM = re.compile(r"\s*\d,\d·\d+ yorum$")  # bazı OSM adlarına harita yorumu karışmış


def ad_temizle(ad: str) -> str:
    return YORUM.sub("", ad.strip())


def isletme_mi(t: dict) -> bool:
    return (t.get("man_made") == "works" or t.get("landuse") == "industrial"
            or "office" in t or "industrial" in t or "craft" in t or "building" in t)


def adli_sekiller(veri: dict, cati_kimlikleri: set[int], metre) -> tuple[list, list]:
    noktalar, alanlar = [], []
    for e in veri["elements"]:
        t = e.get("tags", {})
        if "name" not in t or e["id"] in cati_kimlikleri or not isletme_mi(t) or GENEL.search(t["name"]):
            continue
        try:
            if e["type"] == "node":
                s = Point(e["lon"], e["lat"])
            elif e["type"] == "way" and len(e.get("geometry", [])) >= 4 and e["geometry"][0] == e["geometry"][-1]:
                s = Polygon([(p["lon"], p["lat"]) for p in e["geometry"]]).buffer(0)
            elif e["type"] == "relation":
                s = sinir_sekli(e)
            else:
                continue
        except Exception:  # bozuk OSM geometrisi: bu adı atla
            continue
        s = transform(metre, s)
        ad = ad_temizle(t["name"])
        if s.geom_type == "Point" or s.area < EN_BUYUK_NOKTA_M2:
            noktalar.append((ad, s.representative_point()))
        elif s.area < EN_BUYUK_ALAN_M2:
            alanlar.append((ad, s))
    return noktalar, alanlar


def esle(catilar: list, kucukler: list, noktalar: list, alanlar: list) -> dict[int, tuple[str, str]]:
    atanan: dict[int, tuple[str, str]] = {}
    en_yakin = lambda p: min(((r.distance(p), b["osm_id"], b["ad"]) for b, r in catilar), key=lambda x: x[0])  # noqa: E731
    for ad, p in noktalar:
        d, i, mevcut = en_yakin(p)
        if not mevcut and d == 0 and i not in atanan:
            atanan[i] = (ad, "osm_nokta")
    for ad, p in noktalar:
        d, i, mevcut = en_yakin(p)
        # Noktaya başka bir küçük bina daha yakınsa işletme o binadadır, komşu büyük çatıya yazılmaz
        if not mevcut and 0 < d <= YAKIN_M and i not in atanan and not any(u.distance(p) < d for u in kucukler):
            atanan[i] = (ad, "osm_yakin")
    for ad, a in sorted(alanlar, key=lambda x: x[1].area):  # küçük (özel) alan önce
        for b, r in catilar:
            if not b["ad"] and b["osm_id"] not in atanan and a.contains(r.representative_point()):
                atanan[b["osm_id"]] = (ad, "osm_alan")
    return atanan


if __name__ == "__main__":
    assert ad_temizle("X Ltd. Şti. 5,0·4 yorum") == "X Ltd. Şti." and GENEL.search("Manisa OSB Yönetim Binası")
    slug, osb = secili_osb()
    sinir = sinir_oku(slug, osb)
    k = sinir_kutusu(sinir)
    ham = json.loads((HAM_KLASOR / f"binalar_{slug}.json").read_text(encoding="utf-8"))
    binalar = binalari_hazirla(slug, sinir, ham)
    pay = 0.002
    sorgu = f'[out:json][timeout:120];nwr["name"]({k["guney"]-pay},{k["bati"]-pay},{k["kuzey"]+pay},{k["dogu"]+pay});out geom;'
    veri = onbellekli(HAM_KLASOR / f"adlar_{slug}.json", sorgu, "--yeniden" in sys.argv)

    lat0 = math.radians((k["guney"] + k["kuzey"]) / 2)
    metre = lambda x, y, z=None: (x * 111320 * math.cos(lat0), y * 110540)  # noqa: E731
    catilar = [(b, transform(metre, Polygon([(p["lon"], p["lat"]) for p in b["geom"]]).buffer(0))) for b in binalar]
    kimlikler = {b["osm_id"] for b in binalar}
    kucukler = [transform(metre, Polygon([(p["lon"], p["lat"]) for p in e["geometry"]]).buffer(0))
                for e in ham["elements"]
                if e["type"] == "way" and "building" in e.get("tags", {}) and e["id"] not in kimlikler
                and len(e.get("geometry", [])) >= 4]
    atanan = esle(catilar, kucukler, *adli_sekiller(veri, kimlikler, metre))
    temizlenen = {b["osm_id"]: ad_temizle(b["ad"]) for b in binalar if b["ad"] and ad_temizle(b["ad"]) != b["ad"]}

    for i, (ad, kaynak) in sorted(atanan.items(), key=lambda x: x[1]):
        print(f"  {i}: {ad} [{kaynak}]")
    print(f"{slug}: {len(atanan)} çatıya ad, {len(temizlenen)} ad temizlendi, toplam adlı {sum(1 for b in binalar if b['ad']) + len(atanan)}/{len(binalar)}")
    if "--kuru" not in sys.argv:
        db = get_firestore_client()
        batch = db.batch()
        for i, (ad, kaynak) in atanan.items():
            batch.update(db.collection("binalar").document(str(i)), {"ad": ad, "ad_kaynak": kaynak})
        for i, ad in temizlenen.items():
            batch.update(db.collection("binalar").document(str(i)), {"ad": ad})
        batch.commit()
        print("yazıldı")
