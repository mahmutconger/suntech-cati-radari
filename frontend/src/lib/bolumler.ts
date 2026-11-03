// Seçili binanın çevresindeki beş düğme ve sağ paneldeki karşılık gelen bölümler.
// Her düğme bir hedef bölüme gider; birbiriyle ilişkili bölümler de "İlgili" olarak işaretlenir.

import {
  Calculator,
  DollarSign,
  FileChartColumn,
  Landmark,
  LayoutGrid,
  ListOrdered,
  Satellite,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

/** Haritadaki düğmelerin gittiği bölümler. */
export type Bolum = "finans" | "simulasyon" | "kredi" | "rapor" | "varsayim";

/** Paneldeki işaretlenebilir bütün bölümler. */
export type PanelBolumAdi =
  | Bolum
  | "ozet" // çatı kartının başı ve temel değerler
  | "nakit" // 25 yıllık kümülatif nakit akışı grafiği (simülasyon paneli)
  | "tuketim" // yıllık tüketim kutusu
  | "pil" // batarya
  | "sebeke" // şebeke ve trafo sınırı
  | "statik" // çatı statiği ön kontrolü
  | "uydu"; // uydu kontrolü

export interface BolumTanimi {
  etiket: string;
  /** Telefonda düğmenin altındaki kısa ad. */
  kisa: string;
  Ikon: LucideIcon;
  /** Bu bölümle birlikte işaretlenen bölümler ve nedeni. */
  ilgili: PanelBolumAdi[];
  aciklama: string;
}

export const BOLUMLER: Record<Bolum, BolumTanimi> = {
  finans: {
    etiket: "25 yıllık finans",
    kisa: "Finans",
    Ikon: DollarSign,
    ilgili: ["nakit", "kredi", "varsayim"],
    aciklama: "Net kazanç, NBD, İVO ve LCOE; nakit akışı grafiği ve gelişmiş varsayımlar bunu besler.",
  },
  simulasyon: {
    etiket: "Saatlik simülasyon",
    kisa: "Simülasyon",
    Ikon: Calculator,
    ilgili: ["tuketim", "pil", "sebeke"],
    aciklama: "Vardiyaya göre saatlik üretim-tüketim; tüketim, pil ve şebeke sınırı sonucu değiştirir.",
  },
  kredi: {
    etiket: "Kredi hesabı",
    kisa: "Kredi",
    Ikon: Landmark,
    ilgili: ["finans", "nakit"],
    aciklama: "Aylık taksit ile aylık tasarrufun karşılaştırması; 25 yıllık finansla birlikte okunur.",
  },
  rapor: {
    etiket: "Ön fizibilite raporu",
    kisa: "Rapor",
    Ikon: FileChartColumn,
    ilgili: ["ozet", "finans", "uydu"],
    aciklama: "Özet değerler, 25 yıllık finans ve uydu kontrolü tek sayfalık PDF rapora girer.",
  },
  varsayim: {
    etiket: "Varsayımları düzenle",
    kisa: "Varsayım",
    Ikon: SlidersHorizontal,
    ilgili: ["ozet", "finans", "nakit"],
    aciklama: "Tarife, kullanılabilir çatı, maliyet ve öz tüketim; değişince özet ve 25 yıllık finans yeniden hesaplanır.",
  },
};

/** Düğmelerin binanın çevresindeki sırası: sol üst, sağ üst, sağ alt, sol alt, alt orta. */
export const BOLUM_SIRASI: Bolum[] = ["finans", "simulasyon", "kredi", "rapor", "varsayim"];

// --- Panel sekmeleri ---
// Birbirinden bağımsız bölümler ayrı sekmelerde durur; panel tek seferde tek konuya odaklanır.

/** Çatı seçiliyken panelin sekmeleri. */
export type CatiSekmesi = "ozet" | "finans" | "simulasyon" | "uydu" | "rapor" | "varsayim";

/** Çatı seçili değilken (OSB özeti) panelin sekmeleri. */
export type OsbSekmesi = "ozet" | "liste" | "varsayim";

export interface SekmeTanimi<T extends string> {
  ad: T;
  etiket: string;
  /** Dar panelde (400 px) görünen kısa ad; yoksa etiket. */
  kisa?: string;
  Ikon: LucideIcon;
}

export const CATI_SEKMELERI: SekmeTanimi<CatiSekmesi>[] = [
  { ad: "ozet", etiket: "Özet", Ikon: LayoutGrid },
  { ad: "finans", etiket: "Finans", Ikon: DollarSign },
  { ad: "simulasyon", etiket: "Simülasyon", kisa: "Saatlik", Ikon: Calculator },
  { ad: "uydu", etiket: "Uydu", Ikon: Satellite },
  { ad: "rapor", etiket: "Rapor", Ikon: FileChartColumn },
  { ad: "varsayim", etiket: "Varsayım", Ikon: SlidersHorizontal },
];

export const OSB_SEKMELERI: SekmeTanimi<OsbSekmesi>[] = [
  { ad: "ozet", etiket: "Özet", Ikon: LayoutGrid },
  { ad: "liste", etiket: "İlk 20 çatı", kisa: "İlk 20", Ikon: ListOrdered },
  { ad: "varsayim", etiket: "Varsayımlar", Ikon: SlidersHorizontal },
];

/** Her bölüm hangi çatı sekmesinde duruyor (haritadaki düğmeler doğru sekmeyi açar). */
export const BOLUM_SEKMESI: Record<PanelBolumAdi, CatiSekmesi> = {
  ozet: "ozet",
  tuketim: "ozet",
  finans: "finans",
  simulasyon: "simulasyon",
  nakit: "simulasyon",
  pil: "simulasyon",
  sebeke: "simulasyon",
  kredi: "simulasyon",
  statik: "simulasyon",
  uydu: "uydu",
  rapor: "rapor",
  varsayim: "varsayim",
};
