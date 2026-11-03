// Sayıları Türkçe biçimde gösteren yardımcılar (1.234,5 gibi).

const tamSayi = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const birOndalik = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function sayi(deger: number, ondalik = 0): string {
  return ondalik === 1 ? birOndalik.format(deger) : tamSayi.format(deger);
}

/** TL tutarını büyüklüğüne göre kısaltır: 5,96 milyon TL, 1,87 milyar TL. */
export function tl(deger: number): string {
  const mutlak = Math.abs(deger);
  if (mutlak >= 1e9) return `${(deger / 1e9).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} milyar TL`;
  if (mutlak >= 1e6) return `${(deger / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} milyon TL`;
  if (mutlak >= 1e3) return `${(deger / 1e3).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} bin TL`;
  return `${tamSayi.format(deger)} TL`;
}

export function alan(m2: number): string {
  return `${tamSayi.format(m2)} m²`;
}
