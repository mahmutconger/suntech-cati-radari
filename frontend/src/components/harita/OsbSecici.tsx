"use client";

// OSB seçici (§22.4). GET /osblar en az iki OSB döndürünce görünür; seçilince harita o OSB'ye
// uçar, sınırını çizer ve bütün sorgular ?osb= ile tekrarlanır.

import { useOsblar } from "@/hooks/veri";
import { sayi } from "@/lib/bicim";
import { useHaritaDurumu } from "@/store/harita";

export function OsbSecici() {
  const { data: osblar } = useOsblar();
  const secili = useHaritaDurumu((d) => d.seciliOsb);
  const sec = useHaritaDurumu((d) => d.osbSec);

  if (!osblar || osblar.length < 2) return null;

  return (
    <label className="relative flex min-w-0 max-w-[44%] shrink-0 items-center md:max-w-none rounded-full border border-white/15 bg-slate-900/90 shadow-lg backdrop-blur focus-within:border-amber-400">
      <span className="sr-only">OSB seç</span>
      <select
        value={secili}
        onChange={(e) => sec(e.target.value)}
        className="w-full cursor-pointer appearance-none truncate bg-transparent py-2.5 pl-3 pr-7 text-sm font-medium text-slate-100 outline-none md:pl-4 md:pr-8"
      >
        {osblar.map((o) => (
          <option key={o.id} value={o.id} className="bg-slate-900">
            {o.ad} · {sayi(o.bina_sayisi)} çatı
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-3 text-xs text-slate-400">
        ▼
      </span>
    </label>
  );
}
