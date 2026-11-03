// UYGULAMA TİPLERİ
// Hesap ve sohbet tipleri backend'in OpenAPI şemasından üretilen src/types/api.ts'ten gelir
// (`npm run tipler`). /binalar ve /trafo-merkezleri uçları şemada yanıt modeli tanımlamadığı
// için onların tipleri burada elle tutuluyor (PROJE.md Bölüm 9).

import type { components } from "@/types/api";

type Sema = components["schemas"];

// --- Üretilen şemadan (Mehmet: hesap; Nazım: sohbet, kayıtlar, uydu) ---
export type Varsayimlar = Sema["VarsayimlarDto"];
export type HesapSonucu = Sema["HesapSonucuDto"];
export type OsbOzeti = Sema["OsbOzetiDto"];
export type TopluHesapYaniti = Sema["TopluHesapYaniti"];
export type BinaHesapIstegi = Sema["BinaHesapIstegi"];
export type SohbetMesaji = Sema["Mesaj"];
export type SohbetIstegi = Sema["SohbetIstegi"];
export type KullanilanArac = Sema["KullanilanArac"];
export type SohbetYaniti = Sema["SohbetYaniti"];
export type Tuketim = Sema["Tuketim"];
export type KayitIstegi = Sema["KayitIstegi"];
export type Kayit = Sema["Kayit"];
export type UyduSonucu = Sema["UyduSonucu"];

// --- Elle tutulanlar (şemada yanıt modeli yok) ---

export type Konum = [lon: number, lat: number];

export interface BinaOzet {
  /** OSM kimliği */
  id: number;
  /** Adı olmayan binada boş metin */
  ad: string;
  alan_m2: number;
  merkez: Konum;
}

export interface EnYakinTrafo {
  id: number;
  ad: string;
  gerilim_kv: number | null;
  mesafe_km: number;
}

/** GET /binalar/{id} */
export interface BinaDetay extends BinaOzet {
  verim_kwh_kwp: number | null;
  mevcut_ges: boolean;
  pvgis_id: string | null;
  geometri: CokgenGeometri;
  en_yakin_trafo: EnYakinTrafo | null;
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

/** GET /trafo-merkezleri: GeoJSON noktaları */
export interface TrafoOzellikleri {
  id: number;
  ad: string;
  isletmeci: string;
  gerilim_kv: number | null;
  /** TEİAŞ tablosundan elle girilir; yoksa null */
  kalan_kapasite_mw: number | null;
  kaynak: string;
}

export interface TrafoKoleksiyonu {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    id: number;
    geometry: { type: "Point"; coordinates: Konum };
    properties: TrafoOzellikleri;
  }[];
}

