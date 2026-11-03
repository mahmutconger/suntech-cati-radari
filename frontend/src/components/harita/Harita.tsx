"use client";

// Leaflet haritası. Sunucuda çalışmadığı için yalnızca HaritaYukleyici üzerinden,
// istemcide yüklenir. preferCanvas ile çatılar canvas'a çizilir (600 çokgen için hızlı).

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useRef } from "react";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useBinalar, useHesapSozlugu, useTrafolar } from "@/hooks/veri";
import { SAHTE_VERI } from "@/lib/api";
import { sayi } from "@/lib/bicim";
import { KATMANLAR } from "@/lib/sabitler";
import { tasarrufRengi } from "@/lib/renk";
import { SAHTE_OSB_SINIRI } from "@/mocks/veri";
import { useHaritaDurumu } from "@/store/harita";
import type { BinaOzelligi } from "@/types/gecici";

/** Açılışta bütün OSB sınırı ekrana sığar (telefonda da). */
const OSB_ACILIS_SINIRI = L.geoJSON(SAHTE_OSB_SINIRI).getBounds();

/**
 * Gerçek veride OSB sınırı için henüz uç yok; sahte sınır yanlış yerde durmasın diye
 * açılışta harita binaların kapsadığı alana sığdırılır.
 */
function BinalaraSigdir() {
  const harita = useMap();
  const { data } = useBinalar();
  const sigdirildi = useRef(false);
  useEffect(() => {
    if (SAHTE_VERI || sigdirildi.current || !data?.features.length) return;
    harita.fitBounds(L.geoJSON(data as GeoJSON.FeatureCollection).getBounds(), { padding: [16, 16] });
    sigdirildi.current = true;
  }, [data, harita]);
  return null;
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
  const katmanRef = useRef<L.GeoJSON>(null);

  const stil = useCallback(
    (ozellik?: GeoJSON.Feature): L.PathOptions => {
      const id = (ozellik as BinaOzelligi | undefined)?.properties.id;
      const secili = id !== undefined && id === seciliId;
      return {
        color: secili ? "#0ea5e9" : "#1f2937",
        weight: secili ? 3 : 0.8,
        fillColor: tasarrufRengi(id === undefined ? undefined : hesaplar.get(id)?.tasarruf_tl),
        fillOpacity: secili ? 0.85 : 0.7,
      };
    },
    [hesaplar, seciliId],
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
      bounds={OSB_ACILIS_SINIRI}
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
      {SAHTE_VERI && (
        <GeoJSON
          data={SAHTE_OSB_SINIRI}
          interactive={false}
          style={{ color: "#38bdf8", weight: 2.5, dashArray: "6 6", fillOpacity: 0.04 }}
        />
      )}
      <Catilar />
      <TrafoKatmani />
      <BinalaraSigdir />
      <Odaklayici />
      <SecimTemizleyici />
    </MapContainer>
  );
}
