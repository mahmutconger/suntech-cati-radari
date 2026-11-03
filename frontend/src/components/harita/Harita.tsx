"use client";

// Leaflet haritası. Sunucuda çalışmadığı için yalnızca HaritaYukleyici üzerinden,
// istemcide yüklenir. preferCanvas ile çatılar canvas'a çizilir (600 çokgen için hızlı).

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useRef } from "react";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useBinalar, useHesapSozlugu, useSeciliOsb, useTrafolar } from "@/hooks/veri";
import { sayi } from "@/lib/bicim";
import { KATMANLAR, OSB_SINIR_KUTUSU as K } from "@/lib/sabitler";
import { catiRengi } from "@/lib/renk";
import { useHaritaDurumu } from "@/store/harita";
import type { BinaOzelligi, Osb } from "@/types/gecici";

/** Açılış görünümü: Manisa OSB çevresi. Seçili OSB yüklenince ona sığdırılır. */
const ACILIS_SINIRI = L.latLngBounds([K.guney, K.bati], [K.kuzey, K.dogu]);

/**
 * Seçili OSB değişince (ve ilk açılışta) harita o OSB'ye sığar: OSB'nin sınır kutusu varsa ona,
 * yoksa (GET /osblar henüz yayında değilse) binaların kapsadığı alana.
 */
function OsbGorunumu() {
  const harita = useMap();
  const osbId = useHaritaDurumu((d) => d.seciliOsb);
  const osb = useSeciliOsb();
  const { data: binalar } = useBinalar();
  const sigdirilan = useRef<string | null>(null);

  useEffect(() => {
    if (sigdirilan.current === osbId) return;
    let sinir: L.LatLngBounds | null = null;
    if (osb) {
      const k = osb.sinir_kutusu;
      sinir = L.latLngBounds([k.guney, k.bati], [k.kuzey, k.dogu]);
    } else if (binalar?.features.length) {
      sinir = L.geoJSON(binalar as GeoJSON.FeatureCollection).getBounds();
    }
    if (!sinir?.isValid()) return;
    harita.flyToBounds(sinir, { padding: [24, 24], duration: sigdirilan.current === null ? 0 : 0.9 });
    sigdirilan.current = osbId;
  }, [osbId, osb, binalar, harita]);

  return null;
}

/** Backend'in `sinir` alanını GeoJSON geometriye çevirir (MultiPolygon/Polygon ya da {lon, lat} listesi). */
function sinirGeometrisi(sinir: Osb["sinir"]): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  if (Array.isArray(sinir)) {
    if (sinir.length < 3) return null;
    const halka = sinir.map((n) => [n.lon, n.lat]);
    const [ilk, son] = [halka[0], halka[halka.length - 1]];
    if (ilk[0] !== son[0] || ilk[1] !== son[1]) halka.push(ilk);
    return { type: "Polygon", coordinates: [halka] };
  }
  if (sinir && (sinir.type === "Polygon" || sinir.type === "MultiPolygon") && Array.isArray(sinir.coordinates)) {
    return sinir as GeoJSON.Polygon | GeoJSON.MultiPolygon;
  }
  return null;
}

/** Seçili OSB'nin sınırı (GET /osblar'daki `sinir`). */
function OsbSiniri() {
  const osb = useSeciliOsb();
  // Önce bütün parçalar (sinir_geojson), yoksa sinir.
  const geometri = osb ? ((osb.sinir_geojson && sinirGeometrisi(osb.sinir_geojson)) ?? sinirGeometrisi(osb.sinir)) : null;
  if (!osb || !geometri) return null;
  const ozellik: GeoJSON.Feature = { type: "Feature", properties: { ad: osb.ad }, geometry: geometri };
  return (
    <GeoJSON
      key={osb.id}
      data={ozellik}
      interactive={false}
      style={{ color: "#38bdf8", weight: 2.5, dashArray: "6 6", fillOpacity: 0.04 }}
    />
  );
}

function TrafoKatmani() {
  const acik = useHaritaDurumu((d) => d.trafoKatmani);
  const { data } = useTrafolar(acik);
  if (!acik || !data) return null;
  return (
    <>
      {data.features.map((t) => {
        const [lon, lat] = t.geometry.coordinates;
        const p = t.properties;
        return (
          <CircleMarker
            key={t.id}
            center={[lat, lon]}
            radius={8}
            pathOptions={{ color: "#0f172a", weight: 2, fillColor: "#a78bfa", fillOpacity: 0.95 }}
          >
            <Popup>
              <strong>{p.ad || "Adsız trafo merkezi"}</strong>
              <br />
              {p.gerilim_kv ? `${sayi(p.gerilim_kv)} kV` : "Gerilim bilinmiyor"}
              {p.isletmeci && ` · ${p.isletmeci}`}
              <br />
              Kalan kapasite:{" "}
              {p.kalan_kapasite_mw !== null ? `${sayi(p.kalan_kapasite_mw, 1)} MW` : "girilmedi (TEİAŞ tablosu)"}
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

/** Arama ya da listeden seçilen binaya uçar. */
function Odaklayici() {
  const harita = useMap();
  const hedef = useHaritaDurumu((d) => d.odaklanilacakBinaId);
  const bitti = useHaritaDurumu((d) => d.odaklanmaBitti);
  const { data } = useBinalar();

  useEffect(() => {
    if (hedef === null || !data) return;
    const bina = data.features.find((f) => f.properties.id === hedef);
    if (bina) {
      const sinir = L.geoJSON(bina as GeoJSON.Feature).getBounds();
      harita.flyToBounds(sinir, { maxZoom: 17, padding: [80, 80], duration: 0.8 });
    }
    bitti();
  }, [hedef, data, harita, bitti]);

  return null;
}

function Catilar() {
  const { data } = useBinalar();
  const hesaplar = useHesapSozlugu();
  const seciliId = useHaritaDurumu((d) => d.seciliBinaId);
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  const renkModu = useHaritaDurumu((d) => d.renkModu);
  const osb = useHaritaDurumu((d) => d.seciliOsb);
  const katmanRef = useRef<L.GeoJSON>(null);

  const stil = useCallback(
    (ozellik?: GeoJSON.Feature): L.PathOptions => {
      const id = (ozellik as BinaOzelligi | undefined)?.properties.id;
      const secili = id !== undefined && id === seciliId;
      return {
        color: secili ? "#0ea5e9" : "#1f2937",
        weight: secili ? 3 : 0.8,
        fillColor: catiRengi(id === undefined ? undefined : hesaplar.get(id), renkModu),
        fillOpacity: secili ? 0.85 : 0.7,
      };
    },
    [hesaplar, seciliId, renkModu],
  );

  // Hesap ya da seçim değişince katmanı yeniden oluşturmadan yalnızca renkleri güncelle.
  useEffect(() => {
    const katman = katmanRef.current;
    if (!katman) return;
    katman.setStyle(stil as L.StyleFunction);
    katman.eachLayer((l) => {
      const id = ((l as L.Polygon).feature as BinaOzelligi | undefined)?.properties.id;
      if (id === seciliId) (l as L.Polygon).bringToFront();
    });
  }, [stil, seciliId]);

  if (!data) return null;

  return (
    <GeoJSON
      // OSB değişince katman yeniden kurulur (react-leaflet `data` değişimini izlemez).
      key={osb}
      ref={katmanRef}
      data={data as GeoJSON.FeatureCollection}
      style={stil}
      onEachFeature={(ozellik, katman) => {
        const bina = ozellik as BinaOzelligi;
        katman.on("click", (olay) => {
          L.DomEvent.stopPropagation(olay);
          binaSec(bina.properties.id);
        });
      }}
    />
  );
}

function SecimTemizleyici() {
  const harita = useMap();
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  useEffect(() => {
    const temizle = () => binaSec(null);
    harita.on("click", temizle);
    return () => {
      harita.off("click", temizle);
    };
  }, [harita, binaSec]);
  return null;
}

export default function Harita() {
  const katman = KATMANLAR[useHaritaDurumu((d) => d.katman)];

  return (
    <MapContainer
      bounds={ACILIS_SINIRI}
      boundsOptions={{ padding: [16, 16] }}
      preferCanvas
      zoomSnap={0.25}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        key={katman.url}
        url={katman.url}
        attribution={katman.atif}
        maxZoom={katman.maksimumYakinlastirma}
      />
      <OsbSiniri />
      <Catilar />
      <TrafoKatmani />
      <OsbGorunumu />
      <Odaklayici />
      <SecimTemizleyici />
    </MapContainer>
  );
}
