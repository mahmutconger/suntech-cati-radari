// Yıllık tasarrufa göre çatı rengi. Sınırlar TL/yıl; açık sarıdan koyu turuncuya.
// Sınırlar gerçek veri gelince OSB dağılımına göre (çeyreklikler) güncellenebilir.

export const RENK_KADEMELERI: { alt: number; renk: string; etiket: string }[] = [
  { alt: 0, renk: "#fde68a", etiket: "< 1 milyon" },
  { alt: 1_000_000, renk: "#fbbf24", etiket: "1-2,5 milyon" },
  { alt: 2_500_000, renk: "#f59e0b", etiket: "2,5-5 milyon" },
  { alt: 5_000_000, renk: "#ea580c", etiket: "5-10 milyon" },
  { alt: 10_000_000, renk: "#b91c1c", etiket: "> 10 milyon" },
];

export const HESAPSIZ_RENK = "#94a3b8";

export function tasarrufRengi(tasarrufTl: number | undefined): string {
  if (tasarrufTl === undefined) return HESAPSIZ_RENK;
  let renk = RENK_KADEMELERI[0].renk;
  for (const kademe of RENK_KADEMELERI) {
    if (tasarrufTl >= kademe.alt) renk = kademe.renk;
  }
  return renk;
}
