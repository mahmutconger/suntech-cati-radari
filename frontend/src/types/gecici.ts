// UYGULAMA TİPLERİ
// Hesap, sohbet, kayıt, uydu ve finans tipleri backend'in OpenAPI şemasından üretilen
// src/types/api.ts'ten gelir (`npm run tipler`). /binalar, /trafo-merkezleri ve /osblar uçları
// şemada yanıt modeli tanımlamadığı için onların tipleri burada elle tutuluyor (PROJE.md Bölüm 9).

import type { components } from "@/types/api";

type Sema = components["schemas"];

// --- Üretilen şemadan (Mehmet: hesap ve finans; Nazım: sohbet, kayıtlar, uydu) ---
export type Varsayimlar = Sema["VarsayimlarDto"];
export type HesapSonucu = Sema["HesapSonucuDto"];
export type OsbOzeti = Sema["OsbOzetiDto"];
export type TopluHesapYaniti = Sema["TopluHesapYaniti"];
export type VarsayimKaynagi = Sema["VarsayimKaynagiDto"];
export type VarsayimlarYaniti = Sema["VarsayimlarYaniti"];
export type BinaHesapIstegi = Sema["BinaHesapIstegi"];
export type SohbetMesaji = Sema["Mesaj"];
export type SohbetIstegi = Sema["SohbetIstegi"];
export type KullanilanArac = Sema["KullanilanArac"];
export type SohbetYaniti = Sema["SohbetYaniti"];
export type Tuketim = Sema["Tuketim"];
export type KayitIstegi = Sema["KayitIstegi"];
export type Kayit = Sema["Kayit"];
export type UyduSonucu = Sema["UyduSonucu"];

// --- Artık şemadan gelen tipler (yanıt modeli eklendi) ---
export type BinaOzet = Sema["BinaOzet"];
export type EnYakinTrafo = Sema["EnYakinTrafo"];
export type BinaDetay = Sema["BinaDetay"];
export type BinaOzelligi = Sema["BinaOzelligi"];
export type BinaKoleksiyonu = Sema["BinaKoleksiyonu"];
export type TrafoOzellikleri = Sema["TrafoOzellikleri"];
export type TrafoKoleksiyonu = Sema["TrafoKoleksiyonu"];
export type Osb = Sema["Osb"];

// --- Elle tutulanlar (şemada karşılığı yok) ---

export type Konum = [lon: number, lat: number];

/** GeoJSON çokgen ya da çoklu çokgen; koordinatlar [lon, lat]. */
export type CokgenGeometri =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

/** Backend hata biçimi: {"hata": {"kod": "...", "mesaj": "..."}} */
export interface ApiHatasiGovdesi {
  hata: { kod: string; mesaj: string };
}

/** POST /hesap/finans/{bina_id}: 25 yılın her yılı (§22.1, Mehmet'in YillikNakitAkisiDto şeması) */
export type FinansYili = Sema["YillikNakitAkisiDto"];
