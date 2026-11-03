"""/binalar, /osblar ve /trafo-merkezleri yanıt şemaları; frontend tipleri bunlardan üretilir (npm run tipler)."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class Cokgen(BaseModel):
    type: Literal["Polygon"]
    coordinates: list[list[list[float]]]


class CokluCokgen(BaseModel):
    type: Literal["MultiPolygon"]
    coordinates: list[list[list[list[float]]]]


class BinaOzet(BaseModel):
    id: int
    ad: str
    alan_m2: float
    merkez: tuple[float, float]  # lon, lat
    osb: str
    trafo_mesafe_km: float | None = None


class YakinBina(BinaOzet):
    mesafe_km: float


class BinaOzelligi(BaseModel):
    type: Literal["Feature"]
    id: int
    geometry: Cokgen
    properties: BinaOzet


class BinaKoleksiyonu(BaseModel):
    type: Literal["FeatureCollection"]
    features: list[BinaOzelligi]


class EnYakinTrafo(BaseModel):
    id: int
    ad: str
    gerilim_kv: float | None
    mesafe_km: float


class BinaDetay(BinaOzet):
    verim_kwh_kwp: float | None
    mevcut_ges: bool
    pvgis_id: str | None
    geometri: Cokgen
    en_yakin_trafo: EnYakinTrafo | None


class TrafoNoktasi(BaseModel):
    type: Literal["Point"]
    coordinates: tuple[float, float]  # lon, lat


class TrafoOzellikleri(BaseModel):
    id: int
    ad: str
    isletmeci: str
    gerilim_kv: float | None
    kalan_kapasite_mw: float | None
    kaynak: str


class TrafoOzelligi(BaseModel):
    type: Literal["Feature"]
    id: int
    geometry: TrafoNoktasi
    properties: TrafoOzellikleri


class TrafoKoleksiyonu(BaseModel):
    type: Literal["FeatureCollection"]
    features: list[TrafoOzelligi]


class Nokta(BaseModel):
    lon: float
    lat: float


class OsbMerkezi(BaseModel):
    lat: float
    lon: float


class SinirKutusu(BaseModel):
    guney: float
    bati: float
    kuzey: float
    dogu: float


class Osb(BaseModel):
    id: str
    ad: str
    merkez: OsbMerkezi
    sinir_kutusu: SinirKutusu
    sinir: list[Nokta]  # en büyük parçanın halkası
    sinir_geojson: CokluCokgen  # bütün parçalar
    bina_sayisi: int
