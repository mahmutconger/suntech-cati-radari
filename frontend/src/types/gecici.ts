// GEÇİCİ TİPLER
// Backend'in OpenAPI şeması hazır olunca `npm run tipler` ile src/types/api.ts üretilir
// ve bu dosyadaki tipler oradan gelenlerle değiştirilir. Alan adları PROJE.md Bölüm 9'dan.

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

/** Firmanın girdiği tüketim. Saatlik profil (vardiya) Mehmet'in simülasyonunda. */
export interface Tuketim {
  yillik_kwh: number;
}

/** POST /hesap/bina/{id} gövdesi (Mehmet'in BinaHesapIstegi şeması) */
export interface BinaHesapIstegi {
  varsayimlar: Varsayimlar;
  yillik_tuketim_kwh: number | null;
}

/** POST /sohbet (Nazım'ın SohbetIstegi şeması) */
export interface SohbetMesaji {
  rol: "kullanici" | "asistan";
  /** 1-2000 karakter */
  metin: string;
}

export interface SohbetIstegi {
  /** En çok 20 mesaj; sonuncusu kullanıcının olmalı */
  mesajlar: SohbetMesaji[];
  bina_id: number | null;
}

export interface KullanilanArac {
  ad: string;
  girdi: Record<string, unknown>;
}

export interface SohbetYaniti {
  cevap: string;
  araclar: KullanilanArac[];
  /** Cevabı üreten Gemini modeli */
  model: string;
}

/** /kayitlar */
export interface KayitIstegi {
  bina_id: number;
  varsayimlar: Varsayimlar;
  tuketim: Tuketim | null;
  sonuc: HesapSonucu;
}

export interface Kayit extends KayitIstegi {
  id: string;
  bina_ad?: string;
  olusturma: string;
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

/** POST /uydu/{bina_id} */
export interface UyduSonucu {
  bina_id: number;
  panel: "var" | "yok" | "belirsiz";
  /** 0-1 */
  kaplama_orani: number;
  /** 0-1 */
  guven: number;
}
