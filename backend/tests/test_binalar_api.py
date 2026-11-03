"""/binalar, /osblar ve /trafo-merkezleri sözleşmesi: sahte depo ile, ağa çıkmadan."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.infrastructure import depo
from app.main import app


def _bina(osm_id: int, osb: str, trafo_km: float | None = 1.5) -> dict:
    return {
        "osm_id": osm_id,
        "ad": f"Fabrika {osm_id}",
        "alan_m2": 2000.0,
        "merkez": {"lat": 38.6, "lon": 27.3},
        "geom": [{"lon": 27.3, "lat": 38.6}, {"lon": 27.31, "lat": 38.6}, {"lon": 27.31, "lat": 38.61}, {"lon": 27.3, "lat": 38.6}],
        "osb": osb,
        "trafo_mesafe_km": trafo_km,
        "verim_kwh_kwp": 1340.0,
        "mevcut_ges": False,
        "pvgis_id": "38.605_27.295",
    }


def _trafo(osm_id: int, osblar: list[str]) -> dict:
    return {
        "osm_id": osm_id,
        "ad": "TM",
        "isletmeci": "",
        "gerilim_kv": 154.0,
        "nokta": {"lat": 38.61, "lon": 27.31},
        "kalan_kapasite_mw": None,
        "kaynak": "OSM",
        "osblar": osblar,
    }


def _osb(kimlik: str, adet: int) -> dict:
    halka = [{"lon": 27.3, "lat": 38.6}, {"lon": 27.4, "lat": 38.6}, {"lon": 27.4, "lat": 38.7}, {"lon": 27.3, "lat": 38.6}]
    return {
        "id": kimlik,
        "ad": f"{kimlik} OSB",
        "osm": [{"tip": "way", "id": 1}],
        "merkez": {"lat": 38.65, "lon": 27.35},
        "sinir_kutusu": {"guney": 38.6, "bati": 27.3, "kuzey": 38.7, "dogu": 27.4},
        "sinir": [{"noktalar": halka}],
        "bina_sayisi": adet,
    }


@pytest.fixture
def istemci(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setattr(
        depo,
        "_onbellek",
        {
            "binalar": [_bina(1, "manisa"), _bina(2, "muradiye", trafo_km=None)],
            "trafo_merkezleri": [_trafo(10, ["manisa", "muradiye"]), _trafo(11, ["muradiye"])],
            "osblar": [_osb("muradiye", 1), _osb("manisa", 1)],
        },
    )
    return TestClient(app)


def test_osblar_sinir_liste_ve_geojson(istemci: TestClient) -> None:
    yanit = istemci.get("/api/v1/osblar")
    assert yanit.status_code == 200
    osb = yanit.json()[0]
    assert isinstance(osb["sinir"], list) and osb["sinir"][0] == {"lon": 27.3, "lat": 38.6}
    assert osb["sinir_geojson"]["type"] == "MultiPolygon"
    assert "osm" not in osb


def test_binalar_osbye_gore_suzulur_ve_trafo_uzakligi_gelir(istemci: TestClient) -> None:
    varsayilan = istemci.get("/api/v1/binalar").json()["features"]
    assert [f["id"] for f in varsayilan] == [1]
    assert varsayilan[0]["properties"]["trafo_mesafe_km"] == 1.5
    assert varsayilan[0]["properties"]["merkez"] == [27.3, 38.6]

    muradiye = istemci.get("/api/v1/binalar", params={"osb": "muradiye"}).json()["features"]
    assert [f["id"] for f in muradiye] == [2]
    assert muradiye[0]["properties"]["trafo_mesafe_km"] is None


def test_bina_detayi_ve_hatalar(istemci: TestClient) -> None:
    detay = istemci.get("/api/v1/binalar/2")
    assert detay.status_code == 200
    govde = detay.json()
    assert govde["osb"] == "muradiye" and govde["en_yakin_trafo"]["id"] in (10, 11)

    assert istemci.get("/api/v1/binalar/99").status_code == 404
    bilinmeyen = istemci.get("/api/v1/binalar", params={"osb": "yok"})
    assert bilinmeyen.status_code == 404 and bilinmeyen.json()["hata"]["kod"] == "osb_yok"


def test_trafolar_osb_listesine_gore_suzulur(istemci: TestClient) -> None:
    manisa = istemci.get("/api/v1/trafo-merkezleri").json()["features"]
    muradiye = istemci.get("/api/v1/trafo-merkezleri", params={"osb": "muradiye"}).json()["features"]
    assert [f["id"] for f in manisa] == [10]
    assert sorted(f["id"] for f in muradiye) == [10, 11]
    assert manisa[0]["geometry"]["coordinates"] == [27.31, 38.61]


def test_arama_ve_yakin(istemci: TestClient) -> None:
    assert [b["id"] for b in istemci.get("/api/v1/binalar/ara", params={"q": "fabrika"}).json()] == [1]
    yakin = istemci.get("/api/v1/binalar/yakin", params={"lat": 38.6, "lon": 27.3, "r": 1}).json()
    assert {b["id"] for b in yakin} == {1, 2} and yakin[0]["mesafe_km"] == 0
