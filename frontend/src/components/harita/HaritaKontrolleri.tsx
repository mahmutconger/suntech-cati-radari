"use client";

import { KATMANLAR, type KatmanTuru } from "@/lib/sabitler";
import { RENK_KADEMELERI } from "@/lib/renk";
import { useHaritaDurumu } from "@/store/harita";

export function KatmanSecici() {
  const katman = useHaritaDurumu((d) => d.katman);
  const degistir = useHaritaDurumu((d) => d.katmanDegistir);
  return (
    <div className="flex overflow-hidden rounded-full border border-white/15 bg-slate-900/85 p-0.5 text-xs shadow-lg backdrop-blur">
      {(Object.keys(KATMANLAR) as KatmanTuru[]).map((tur) => (
        <button
          key={tur}
          type="button"
          onClick={() => degistir(tur)}
          aria-pressed={katman === tur}
          className={`rounded-full px-3 py-1.5 font-medium transition ${
            katman === tur ? "bg-amber-400 text-slate-900" : "text-slate-200 hover:bg-white/10"
          }`}
        >
          {KATMANLAR[tur].ad}
        </button>
      ))}
    </div>
  );
}

export function Lejant({ kompakt = false }: { kompakt?: boolean }) {
  if (kompakt) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-900/85 px-3 py-1.5 text-[10px] text-slate-200 shadow-lg backdrop-blur">
        <span>Tasarruf: az</span>
        {RENK_KADEMELERI.map((k) => (
          <span key={k.alt} className="inline-block h-2.5 w-3 rounded-sm" style={{ backgroundColor: k.renk }} />
        ))}
        <span>çok</span>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/15 bg-slate-900/85 px-3 py-2 text-[11px] text-slate-200 shadow-lg backdrop-blur">
      <p className="mb-1 font-semibold text-slate-100">Yıllık tasarruf (TL)</p>
      <ul className="space-y-0.5">
        {RENK_KADEMELERI.map((k) => (
          <li key={k.alt} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-4 rounded-sm" style={{ backgroundColor: k.renk }} />
            {k.etiket}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrafoDugmesi() {
  const acik = useHaritaDurumu((d) => d.trafoKatmani);
  const ayarla = useHaritaDurumu((d) => d.trafoKatmaniAyarla);
  return (
    <button
      type="button"
      onClick={() => ayarla(!acik)}
      aria-pressed={acik}
      title="Trafo merkezlerini göster"
      className={`rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition ${
        acik
          ? "border-violet-300/60 bg-violet-400 text-slate-900"
          : "border-white/15 bg-slate-900/85 text-slate-200 hover:bg-slate-800"
      }`}
    >
      ⚡ Trafo
    </button>
  );
}
