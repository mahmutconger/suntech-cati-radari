"""
PVGIS ızgarasını çekip Firestore'a yazar, her binaya en yakın noktanın verimini ekler (PROJE.md §7, adım 3).
Önce scripts.veri_yukle çalışmış olmalı.
Kullanım (backend/ klasöründe):
    python -m scripts.pvgis_yukle          # ham yanıtlar varsa onları kullanır
    python -m scripts.pvgis_yukle --kuru   # Firestore'a yazmadan özet basar
"""
from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from app.core.firebase import get_firestore_client  # noqa: E402
from app.core.geo import haversine_km  # noqa: E402

HAM_KLASOR = BACKEND / "data" / "raw" / "pvgis"
TABAN = "https://re.jrc.ec.europa.eu/api/v5_3"
ORTAK = {"peakpower": 1, "loss": 14, "angle": 0, "aspect": 0,
         "raddatabase": "PVGIS-SARAH3", "outputformat": "json"}
USER_AGENT = "suntech-cati-radari/0.1 (github.com/nazimhikmetsasi/suntech-cati-radari)"

# OSB sınırı: enlem 38.6075-38.6367, boylam 27.2947-27.3766; 0,01°'lik hücre merkezleri, 4 x 9 = 36 nokta
ENLEMLER = [round(38.605 + 0.01 * i, 3) for i in range(4)]
BOYLAMLAR = [round(27.295 + 0.01 * j, 3) for j in range(9)]


def nokta_id(lat: float, lon: float) -> str:
    return f"{lat:.3f}_{lon:.3f}"


def pvgis_getir(client: httpx.Client, uc: str, lat: float, lon: float, ek: dict) -> dict:
    dosya = HAM_KLASOR / f"{uc}_{nokta_id(lat, lon)}.json"
    if dosya.exists():
        return json.loads(dosya.read_text(encoding="utf-8"))
    bekle = 2
    for deneme in range(5):
        try:
            r = client.get(f"{TABAN}/{uc}", params={"lat": lat, "lon": lon, **ORTAK, **ek})
            if r.status_code == 200:
                dosya.write_text(r.text, encoding="utf-8")
                time.sleep(0.2)  # PVGIS sınırı saniyede 30 istek
                return r.json()
            print(f"  {uc} {nokta_id(lat, lon)}: HTTP {r.status_code}")
        except httpx.HTTPError as e:
            print(f"  {uc} {nokta_id(lat, lon)}: {e}")
        time.sleep(bekle)
        bekle *= 2
    raise RuntimeError(f"PVGIS {uc} {nokta_id(lat, lon)} alınamadı")


def izgara_cek() -> list[dict]:
    HAM_KLASOR.mkdir(parents=True, exist_ok=True)
    noktalar = []
    # trust_env=False: sistemdeki HTTPS_PROXY 503 döndürüyor
    with httpx.Client(trust_env=False, headers={"User-Agent": USER_AGENT}, timeout=120) as client:
        for lat in ENLEMLER:
            for lon in BOYLAMLAR:
                yillik = pvgis_getir(client, "PVcalc", lat, lon, {})
                seri = pvgis_getir(client, "seriescalc", lat, lon,
                                   {"pvcalculation": 1, "startyear": 2023, "endyear": 2023})
                saatlik = [round(h["P"], 1) for h in seri["outputs"]["hourly"]]
                assert len(saatlik) == 8760, f"{nokta_id(lat, lon)}: {len(saatlik)} saat"
                noktalar.append({
                    "id": nokta_id(lat, lon),
                    "nokta": {"lat": lat, "lon": lon},
                    "yillik_kwh_kwp": yillik["outputs"]["totals"]["fixed"]["E_y"],
                    "saatlik_wh": saatlik,  # 1 kWp, UTC, 2023
                })
                print(f"{nokta_id(lat, lon)}: {noktalar[-1]['yillik_kwh_kwp']} kWh/kWp")
    return noktalar


def en_yakin(merkez: dict, noktalar: list[dict]) -> dict:
    return min(noktalar, key=lambda n: haversine_km(merkez["lat"], merkez["lon"], n["nokta"]["lat"], n["nokta"]["lon"]))


def firestore_yaz(noktalar: list[dict]) -> None:
    db = get_firestore_client()
    simdi = datetime.now(timezone.utc)
    izgara = db.collection("pvgis_izgara")
    for n in noktalar:
        izgara.document(n["id"]).set({k: v for k, v in n.items() if k != "id"} | {"cekilme_tarihi": simdi})
    print(f"{len(noktalar)} ızgara noktası yazıldı")

    binalar = db.collection("binalar")
    docs = list(binalar.select(["merkez"]).stream())
    assert docs, "binalar boş, önce scripts.veri_yukle çalıştır"
    for i in range(0, len(docs), 400):
        batch = db.batch()
        for d in docs[i : i + 400]:
            n = en_yakin(d.to_dict()["merkez"], noktalar)
            batch.update(d.reference, {"verim_kwh_kwp": n["yillik_kwh_kwp"], "pvgis_id": n["id"]})
        batch.commit()
    print(f"{len(docs)} binaya verim yazıldı")


if __name__ == "__main__":
    assert abs(haversine_km(38.62, 27.33, 38.63, 27.33) - 1.112) < 0.001
    noktalar = izgara_cek()
    degerler = [n["yillik_kwh_kwp"] for n in noktalar]
    print(f"{len(noktalar)} nokta, verim {min(degerler)}-{max(degerler)} kWh/kWp")
    if "--kuru" not in sys.argv:
        firestore_yaz(noktalar)
