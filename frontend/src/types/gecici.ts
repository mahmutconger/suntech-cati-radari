// GEÇİCİ TİPLER
// Backend'in OpenAPI şeması hazır olunca `npm run tipler` ile src/types/api.ts üretilir
// ve bu dosyadaki tipler oradan gelenlerle değiştirilir. Alan adları PROJE.md Bölüm 9'dan.

export type Konum = [lon: number, lat: number];

export interface BinaOzet {
  id: number;
  ad: string | null;
  alan_m2: number;
  merkez: Konum;
}

export interface Varsayimlar {
  kullanilabilir_oran: number;
  m2_kwp: number;
  tarife_tl_kwh: number;
  fazla_fiyat_tl_kwh: number;
  oz_tuketim_orani: number;
  maliyet_carpani: number;
  emisyon_faktoru: number;
}

export interface HesapSonucu {
  bina_id: number;
  kwp: number;
  uretim_mwh: number;
  tasarruf_tl: number;
  yatirim_tl: number;
  geri_odeme_yil: number;
  co2_ton: number;
}

export interface OsbOzeti {
  bina_sayisi: number;
  toplam_mwp: number;
  toplam_gwh: number;
  toplam_tasarruf_tl: number;
  toplam_yatirim_tl: number;
  toplam_co2_ton: number;
}

export interface TopluHesapYaniti {
  sonuclar: HesapSonucu[];
  ozet: OsbOzeti;
}

/** GeoJSON çokgen ya da çoklu çokgen; koordinatlar [lon, lat]. */
export type CokgenGeometri =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export interface BinaOzelligi {
  type: "Feature";
  id: number;
  geometry: CokgenGeometri;
  properties: BinaOzet;
}

export interface BinaKoleksiyonu {
  type: "FeatureCollection";
  features: BinaOzelligi[];
}

/** Backend hata biçimi: {"hata": {"kod": "...", "mesaj": "..."}} */
export interface ApiHatasiGovdesi {
  hata: { kod: string; mesaj: string };
}
