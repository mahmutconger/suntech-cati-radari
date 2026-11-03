// Uygulama genelinde tekrar eden açık tema sınıfları (palet: globals.css).
// Ağırlık sırası: zemin > limon > şeftali > mercan. Arka planlı yüzeylerde degrade tercih edilir.

/** Panel ve sayfalardaki beyaz kart; panelin sıcak gri zemininden belirgin ayrılır. */
export const KART = "rounded-2xl border border-murekkep/[0.12] bg-white shadow-[0_1px_3px_rgb(28_26_23/0.08)]";

/** Dash zemini (harita yanındaki panel ve telefon çekmecesi): kartlar üstünde belirgin dursun diye sıcak gri. */
export const DASH_ZEMINI = "bg-[#f3efe5] bg-gradient-to-b from-[#f3efe5] via-[#f4f0e2] to-limon/40";

/** Değer kutucuğu: beyaz, ince çerçeveli. */
export const DEGER_YUZEY = "bg-white ring-1 ring-murekkep/[0.12] shadow-[0_1px_2px_rgb(28_26_23/0.06)]";

/** Vurgulu kart ya da kutucuk: limondan şeftaliye hafif degrade. */
export const VURGU_YUZEY = "bg-gradient-to-br from-limon via-limon/70 to-seftali/70 ring-1 ring-seftali/70 shadow-[0_1px_2px_rgb(28_26_23/0.08)]";

/** Ana eylem düğmesi (giriş ekranıyla aynı limon). */
export const ANA_DUGME =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-limon px-4 py-2.5 text-sm font-semibold text-murekkep transition-colors hover:bg-limon/80 disabled:opacity-50";

/** İkincil düğme: çerçeveli. */
export const IKINCIL_DUGME =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-murekkep/15 bg-white/70 px-4 py-2.5 text-sm font-semibold text-murekkep transition-colors hover:bg-murekkep/5 disabled:opacity-50";

/** Seçili sekme / çip: degrade dolgu. */
export const SECILI_CIP = "bg-gradient-to-r from-limon to-seftali text-murekkep shadow-sm";

/** Metin bağlantısı: şeftali alt çizgi. */
export const BAG =
  "font-semibold text-murekkep underline decoration-seftali decoration-2 underline-offset-4 transition-colors hover:decoration-mercan";

/** Form girdisi. */
export const GIRDI =
  "rounded-lg border border-murekkep/15 bg-white px-3 py-2 text-sm text-murekkep outline-none placeholder:text-murekkep/35 focus:border-seftali focus:ring-2 focus:ring-limon/40";

/** Küçük form girdisi (simülasyon paneli). */
export const GIRDI_KUCUK =
  "rounded-lg border border-murekkep/15 bg-white px-2 py-1 text-xs text-murekkep outline-none placeholder:text-murekkep/35 focus:border-seftali focus:ring-2 focus:ring-limon/40";

/** Hata kutusu. */
export const HATA = "rounded-xl bg-mercan/10 px-3 py-2 text-sm text-mercan-koyu";

/** Recharts araç ipucu (açık tema). */
export const GRAFIK_IPUCU = {
  backgroundColor: "#ffffff",
  borderColor: "rgba(28,26,23,0.12)",
  borderRadius: "0.75rem",
  fontSize: "11px",
  color: "#1c1a17",
} as const;

/** Grafik eksen ve ızgara renkleri. */
export const GRAFIK = { eksen: "#8a847a", izgara: "rgba(28,26,23,0.08)", sifir: "rgba(28,26,23,0.35)" } as const;
