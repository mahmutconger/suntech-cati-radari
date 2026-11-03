// Giriş ve tanıtım ekranlarının "?sonra=" parametresi için ortak yardımcılar.

/**
 * Yalnızca site içi yollara dönülür (açık yönlendirme olmasın). "//site" ve "/\\site" reddedilir:
 * tarayıcılar ters eğik çizgiyi düz çizgi sayar, ikisi de başka siteye gider.
 */
export function guvenliYol(yol: string | null | undefined): string {
  if (!yol || !yol.startsWith("/") || yol.startsWith("//") || yol.startsWith("/\\")) return "/";
  return yol;
}

/** Giriş ekranının adresi; mod verilirse ekran o modda açılır. */
export function girisAdresi(sonra: string, mod?: "kayit"): string {
  const parametreler = new URLSearchParams({ sonra: guvenliYol(sonra) });
  if (mod) parametreler.set("mod", mod);
  return `/giris?${parametreler}`;
}
