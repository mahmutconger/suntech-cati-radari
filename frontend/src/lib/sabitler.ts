import type { Varsayimlar } from "@/types/gecici";

/** Manisa OSB çevresi (Overpass sorgusundaki dikdörtgen): güney, batı, kuzey, doğu. */
export const OSB_SINIR_KUTUSU = {
  guney: 38.6075,
  bati: 27.2947,
  kuzey: 38.6367,
  dogu: 27.3766,
} as const;

/**
 * Varsayılan değerler PROJE.md Bölüm 16'dan. Asıl kaynak backend'in /varsayimlar ucu;
 * bu değerler yalnızca kaydırıcıların ilk konumu ve sahte veri içindir.
 */
export const VARSAYILAN_VARSAYIMLAR: Varsayimlar = {
  kullanilabilir_oran: 0.45,
  m2_kwp: 6.5,
  tarife_tl_kwh: 4.81,
  fazla_fiyat_tl_kwh: 2.99,
  oz_tuketim_orani: 0.8,
  maliyet_carpani: 1,
  emisyon_faktoru: 0.6242,
};

/** Harita katmanları. Esri World Imagery atfı haritada görünür kalmalı. */
export const KATMANLAR = {
  sokak: {
    ad: "Sokak",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    atif: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları',
    maksimumYakinlastirma: 19,
  },
  uydu: {
    ad: "Uydu",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    atif: "Görüntü: Esri, Maxar, Earthstar Geographics ve GIS kullanıcı topluluğu · Powered by Esri",
    maksimumYakinlastirma: 19,
  },
} as const;

export type KatmanTuru = keyof typeof KATMANLAR;
