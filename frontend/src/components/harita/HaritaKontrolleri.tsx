"use client";

import { KATMANLAR, type KatmanTuru } from "@/lib/sabitler";
import { useSkorVar } from "@/hooks/veri";
import { RENK_KADEMELERI, SKOR_KADEMELERI } from "@/lib/renk";
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

/** Renk modu düğmeleri; skor yalnızca backend uygunluk skorunu döndürüyorsa görünür. */
function RenkModuSecici({ kucuk = false }: { kucuk?: boolean }) {
  const mod = useHaritaDurumu((d) => d.renkModu);
  const ayarla = useHaritaDurumu((d) => d.renkModuAyarla);
  const skorVar = useSkorVar();
  if (!skorVar) return null;
  return (
    <div className={`flex rounded-full bg-white/5 p-0.5 ${kucuk ? "text-[10px]" : "text-[11px]"}`}>
      {(
        [
          ["tasarruf", "Tasarruf"],
          ["skor", "Uygunluk"],
        ] as const
      ).map(([deger, etiket]) => (
        <button
          key={deger}
          type="button"
          onClick={() => ayarla(deger)}
          aria-pressed={mod === deger}
          className={`rounded-full px-2.5 py-0.5 font-medium ${
            mod === deger ? "bg-amber-400 text-slate-900" : "text-slate-300 hover:bg-white/10"
          }`}
        >
          {etiket}
        </button>
      ))}
    </div>
  );
}

export function Lejant({ kompakt = false }: { kompakt?: boolean }) {
  const skorVar = useSkorVar();
  const mod = useHaritaDurumu((d) => (skorVar ? d.renkModu : "tasarruf"));
  const kademeler = mod === "skor" ? SKOR_KADEMELERI : RENK_KADEMELERI;

  if (kompakt) {
    return (
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/85 px-3 py-1.5 text-[10px] text-slate-200 shadow-lg backdrop-blur">
        <RenkModuSecici kucuk />
        <span>{mod === "skor" ? "düşük" : "az"}</span>
        {kademeler.map((k) => (
          <span key={k.alt} className="inline-block h-2.5 w-3 rounded-sm" style={{ backgroundColor: k.renk }} />
        ))}
        <span>{mod === "skor" ? "yüksek" : "çok"}</span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5 rounded-xl border border-white/15 bg-slate-900/85 px-3 py-2 text-[11px] text-slate-200 shadow-lg backdrop-blur">
      <RenkModuSecici />
      <p className="font-semibold text-slate-100">{mod === "skor" ? "Uygunluk skoru (0-100)" : "Yıllık tasarruf (TL)"}</p>
      <ul className="space-y-0.5">
        {kademeler.map((k) => (
          <li key={k.alt} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-4 rounded-sm" style={{ backgroundColor: k.renk }} />
            {k.etiket}
          </li>
        ))}
      </ul>
      {mod === "skor" && (
        <p className="max-w-[180px] text-[10px] leading-snug text-slate-400">
          Geri ödeme, güneş verimi, sistem büyüklüğü, trafoya uzaklık ve mevcut panel durumundan.
        </p>
      )}
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
