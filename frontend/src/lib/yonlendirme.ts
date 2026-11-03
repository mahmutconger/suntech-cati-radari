// Giriş ve tanıtım ekranlarının "?sonra=" parametresi için ortak yardımcılar.

/** Yalnızca site içi yollara dönülür (açık yönlendirme olmasın). */
export function guvenliYol(yol: string | null | undefined): string {
  return yol && yol.startsWith("/") && !yol.startsWith("//") ? yol : "/";
}

/** Giriş ekranının adresi; mod verilirse ekran o modda açılır. */
export function girisAdresi(sonra: string, mod?: "kayit"): string {
  const parametreler = new URLSearchParams({ sonra: guvenliYol(sonra) });
  if (mod) parametreler.set("mod", mod);
  return `/giris?${parametreler}`;
}
