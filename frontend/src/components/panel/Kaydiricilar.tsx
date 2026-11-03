"use client";

// Varsayım kaydırıcıları. Değişiklik 300 ms bekletilip hesap uçlarına gider (bekletme hooks/veri.ts içinde).
// Aralıklar backend'in /varsayimlar kaynaklarından (min_deger, max_deger) alınır; yoksa PROJE.md Bölüm 16'dan.
// "Gelişmiş" kaydırıcılar (§22) yalnızca backend o alanları bildiriyorsa görünür.

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBackendVarsayimlari } from "@/hooks/veri";
import { useHaritaDurumu } from "@/store/harita";
import type { Varsayimlar } from "@/types/gecici";

type Alan = keyof Varsayimlar;

interface KaydiriciTanimi {
  alan: Alan;
  etiket: string;
  min: number;
  max: number;
  adim: number;
  bicim: (v: number) => string;
  aciklama: string;
}

const yuzde = (v: number) => `%${Math.round(v * 100)}`;
const yuzdeOndalik = (v: number) =>
  `%${(v * 100).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;

const TEMEL: KaydiriciTanimi[] = [
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

const GELISMIS: KaydiriciTanimi[] = [
  {
    alan: "omur_yil",
    etiket: "Sistem ömrü",
    min: 15,
    max: 30,
    adim: 1,
    bicim: (v) => `${Math.round(v)} yıl`,
    aciklama: "NBD ve 25 yıllık hesabın süresi",
  },
  {
    alan: "degradasyon",
    etiket: "Yıllık verim kaybı",
    min: 0,
    max: 0.01,
    adim: 0.0005,
    bicim: yuzdeOndalik,
    aciklama: "Panellerin her yıl kaybettiği üretim",
  },
  {
    alan: "bakim_orani",
    etiket: "Yıllık bakım",
    min: 0,
    max: 0.03,
    adim: 0.001,
    bicim: (v) => `yatırımın ${yuzdeOndalik(v)}'i`,
    aciklama: "Temizlik, sigorta, inverter değişimi payı",
  },
  {
    alan: "iskonto_orani",
    etiket: "İskonto oranı (reel)",
    min: 0,
    max: 0.2,
    adim: 0.005,
    bicim: yuzdeOndalik,
    aciklama: "Gelecekteki paranın bugünkü değerini hesaplamak için",
  },
  {
    alan: "tarife_artisi",
    etiket: "Tarife artışı (reel)",
    min: -0.02,
    max: 0.05,
    adim: 0.0025,
    bicim: yuzdeOndalik,
    aciklama: "Elektrik fiyatının enflasyonun üstünde yıllık artışı",
  },
];

/** Backend kaynaklarındaki aralık varsa onu kullan (doğrulama sınırlarıyla aynı kalsın). */
function useAraliklar(): Map<string, { min: number; max: number }> {
  const { data } = useBackendVarsayimlari();
  return useMemo(() => {
    const m = new Map<string, { min: number; max: number }>();
    for (const k of data?.kaynaklar ?? []) {
      if (typeof k.min_deger === "number" && typeof k.max_deger === "number" && k.min_deger < k.max_deger) {
        m.set(k.anahtar, { min: k.min_deger, max: k.max_deger });
      }
    }
    return m;
  }, [data]);
}

function Kaydirici({ tanim }: { tanim: KaydiriciTanimi }) {
  const deger = useHaritaDurumu((d) => d.varsayimlar[tanim.alan]);
  const guncelle = useHaritaDurumu((d) => d.varsayimGuncelle);
  const aralik = useAraliklar().get(tanim.alan);
  if (typeof deger !== "number") return null;
  const min = aralik?.min ?? tanim.min;
  const max = aralik?.max ?? tanim.max;

  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-200">{tanim.etiket}</span>
        <span className="font-semibold tabular-nums text-amber-300">{tanim.bicim(deger)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={tanim.adim}
        value={Math.min(max, Math.max(min, deger))}
        onChange={(e) => guncelle({ [tanim.alan]: Number(e.target.value) })}
        className="mt-1.5 w-full accent-amber-400"
      />
      <span className="block text-[11px] leading-snug text-slate-500">{tanim.aciklama}</span>
    </label>
  );
}

export function Kaydiricilar({ varsayilanAcik = false }: { varsayilanAcik?: boolean }) {
  const [acik, setAcik] = useState(varsayilanAcik);
  const [gelismisAcik, setGelismisAcik] = useState(false);
  const varsayimlar = useHaritaDurumu((d) => d.varsayimlar);
  const sifirla = useHaritaDurumu((d) => d.varsayimlariSifirla);
  const gelismisler = GELISMIS.filter((t) => typeof varsayimlar[t.alan] === "number");

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
          {TEMEL.map((t) => (
            <Kaydirici key={t.alan} tanim={t} />
          ))}

          {gelismisler.length > 0 && (
            <div className="rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setGelismisAcik(!gelismisAcik)}
                aria-expanded={gelismisAcik}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs"
              >
                <span className="font-semibold text-slate-200">Gelişmiş (25 yıllık finans)</span>
                <span className="text-slate-400">{gelismisAcik ? "▲" : "▼"}</span>
              </button>
              {gelismisAcik && (
                <div className="space-y-4 px-3 pb-3">
                  {gelismisler.map((t) => (
                    <Kaydirici key={t.alan} tanim={t} />
                  ))}
                </div>
              )}
            </div>
          )}

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
