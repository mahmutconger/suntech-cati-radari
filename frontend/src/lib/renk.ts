// Haritadaki çatı renkleri. İki mod: yıllık tasarruf (TL/yıl) ya da uygunluk skoru (0-100).
// Sınırlar gerçek veri gelince OSB dağılımına göre (çeyreklikler) güncellenebilir.

import type { HesapSonucu } from "@/types/gecici";
import type { RenkModu } from "@/store/harita";

export interface RenkKademesi {
  alt: number;
  renk: string;
  etiket: string;
}

/** Yıllık tasarruf, TL: paletteki limondan şeftaliye, oradan mercana (az → çok). */
export const RENK_KADEMELERI: RenkKademesi[] = [
  { alt: 0, renk: "#e1eb71", etiket: "< 1 milyon" },
  { alt: 1_000_000, renk: "#e7cb6d", etiket: "1-2,5 milyon" },
  { alt: 2_500_000, renk: "#ecab69", etiket: "2,5-5 milyon" },
  { alt: 5_000_000, renk: "#e88665", etiket: "5-10 milyon" },
  { alt: 10_000_000, renk: "#e36161", etiket: "> 10 milyon" },
];

/** Uygunluk skoru, 0-100: soluk yeşilden koyu yeşile. */
export const SKOR_KADEMELERI: RenkKademesi[] = [
  { alt: 0, renk: "#e2e8f0", etiket: "0-40" },
  { alt: 40, renk: "#bbf7d0", etiket: "40-55" },
  { alt: 55, renk: "#4ade80", etiket: "55-70" },
  { alt: 70, renk: "#16a34a", etiket: "70-85" },
  { alt: 85, renk: "#14532d", etiket: "85-100" },
];

export const HESAPSIZ_RENK = "#b8b2a7";

function kademeRengi(deger: number | undefined, kademeler: RenkKademesi[]): string {
  if (deger === undefined || !Number.isFinite(deger)) return HESAPSIZ_RENK;
  let renk = kademeler[0].renk;
  for (const kademe of kademeler) {
    if (deger >= kademe.alt) renk = kademe.renk;
  }
  return renk;
}

export function tasarrufRengi(tasarrufTl: number | undefined): string {
  return kademeRengi(tasarrufTl, RENK_KADEMELERI);
}

export function skorRengi(skor: number | undefined): string {
  return kademeRengi(skor, SKOR_KADEMELERI);
}

export function catiRengi(hesap: HesapSonucu | undefined, mod: RenkModu): string {
  return mod === "skor" ? skorRengi(hesap?.uygunluk_skoru) : tasarrufRengi(hesap?.tasarruf_tl);
}
