// Seçili binanın çevresindeki beş düğme ve sağ paneldeki karşılık gelen bölümler.
// Her düğme bir hedef bölüme gider; birbiriyle ilişkili bölümler de "İlgili" olarak işaretlenir.

import { Calculator, DollarSign, FileChartColumn, Landmark, SlidersHorizontal, type LucideIcon } from "lucide-react";

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
