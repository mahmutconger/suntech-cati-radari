"use client";

// Varsayım kaydırıcıları. Değişiklik 300 ms bekletilip /hesap/toplu ve /hesap/bina'ya gider
// (bekletme hooks/veri.ts içinde). Aralıklar PROJE.md Bölüm 16'dan.

import Link from "next/link";
import { useState } from "react";
import { useHaritaDurumu } from "@/store/harita";
import type { Varsayimlar } from "@/types/gecici";

interface KaydiriciTanimi {
  alan: keyof Varsayimlar;
  etiket: string;
  min: number;
  max: number;
  adim: number;
  bicim: (v: number) => string;
  aciklama: string;
}

const yuzde = (v: number) => `%${Math.round(v * 100)}`;

const KAYDIRICILAR: KaydiriciTanimi[] = [
  {
    alan: "kullanilabilir_oran",
    etiket: "Kullanılabilir çatı",
    min: 0.3,
    max: 0.7,
    adim: 0.01,
    bicim: yuzde,
    aciklama: "Çatının panel konabilecek kısmı (ışıklık, baca, yol payı düşülür)",
  },
  {
    alan: "tarife_tl_kwh",
    etiket: "Elektrik tarifesi",
    min: 3,
    max: 7,
    adim: 0.01,
    bicim: (v) => `${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL/kWh`,
    aciklama: "Sanayi tek zamanlı, vergisiz (EPDK)",
  },
  {
    alan: "maliyet_carpani",
    etiket: "Kurulum maliyeti",
    min: 0.7,
    max: 1.3,
    adim: 0.01,
    bicim: (v) => (Math.abs(v - 1) < 0.005 ? "liste fiyatı" : `${v > 1 ? "+" : "−"}%${Math.round(Math.abs(v - 1) * 100)}`),
    aciklama: "Kademeli liste fiyatına göre (≤250 kWp 31.500, >1.000 kWp 21.200 TL/kWp)",
  },
  {
    alan: "oz_tuketim_orani",
    etiket: "Öz tüketim",
    min: 0.5,
    max: 1,
    adim: 0.01,
    bicim: yuzde,
    aciklama: "Üretimin fabrikada anında kullanılan kısmı; kalanı şebekeye satılır",
  },
];

export function Kaydiricilar({ varsayilanAcik = false }: { varsayilanAcik?: boolean }) {
  const [acik, setAcik] = useState(varsayilanAcik);
  const varsayimlar = useHaritaDurumu((d) => d.varsayimlar);
  const guncelle = useHaritaDurumu((d) => d.varsayimGuncelle);
  const sifirla = useHaritaDurumu((d) => d.varsayimlariSifirla);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-100">Varsayımlar</span>
        <span className="text-xs text-slate-400">{acik ? "Gizle ▲" : "Değiştir ▼"}</span>
      </button>
      {acik && (
        <div className="space-y-4 px-4 pb-4">
          {KAYDIRICILAR.map((k) => (
            <label key={k.alan} className="block">
              <span className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-200">{k.etiket}</span>
                <span className="font-semibold tabular-nums text-amber-300">{k.bicim(varsayimlar[k.alan])}</span>
              </span>
              <input
                type="range"
                min={k.min}
                max={k.max}
                step={k.adim}
                value={varsayimlar[k.alan]}
                onChange={(e) => guncelle({ [k.alan]: Number(e.target.value) })}
                className="mt-1.5 w-full accent-amber-400"
              />
              <span className="block text-[11px] leading-snug text-slate-500">{k.aciklama}</span>
            </label>
          ))}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button type="button" onClick={sifirla} className="rounded-full px-2 py-1 text-slate-300 hover:bg-white/10">
              Varsayılana dön
            </button>
            <Link href="/varsayimlar" className="text-amber-300 hover:underline">
              Kaynaklar ve tarihler →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
