// Türkçe Excel'de doğrudan açılan CSV: ayraç ";", ondalık virgül, başta BOM.

type Hucre = string | number | null | undefined;

function hucre(deger: Hucre): string {
  if (deger === null || deger === undefined) return "";
  if (typeof deger === "number") return String(deger).replace(".", ",");
  // OSM adlarını herkes düzenleyebilir: "=..." Excel'de formül olarak çalışmasın.
  const metin = /^[=+\-@\t\r]/.test(deger) ? `'${deger}` : deger;
  return /[";\r\n]/.test(metin) ? `"${metin.replaceAll('"', '""')}"` : metin;
}

export function csvIndir(dosyaAdi: string, satirlar: Hucre[][]): void {
  const metin = "﻿" + satirlar.map((s) => s.map(hucre).join(";")).join("\r\n");
  const adres = URL.createObjectURL(new Blob([metin], { type: "text/csv;charset=utf-8" }));
  const bag = document.createElement("a");
  bag.href = adres;
  bag.download = dosyaAdi;
  bag.click();
  URL.revokeObjectURL(adres);
}
