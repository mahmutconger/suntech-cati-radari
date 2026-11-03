"use client";

// "Yıllık tüketiminiz" kutusu. Girilirse sistem tüketime göre boyutlanır:
// kWp en çok tüketim ÷ verim olur (PROJE.md Bölüm 8).

import { useState } from "react";
import { useHaritaDurumu } from "@/store/harita";

export function TuketimKutusu({ binaId }: { binaId: number }) {
  const kayitli = useHaritaDurumu((d) => d.tuketimler[binaId]);
  const ayarla = useHaritaDurumu((d) => d.tuketimAyarla);
  const [metin, setMetin] = useState(kayitli ? String(kayitli.yillik_kwh / 1000) : "");

  function degisti(deger: string) {
    setMetin(deger);
    const mwh = Number(deger.replace(/\./g, "").replace(",", "."));
    ayarla(binaId, Number.isFinite(mwh) && mwh > 0 ? { yillik_kwh: mwh * 1000 } : null);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <label htmlFor={`tuketim-${binaId}`} className="text-xs font-semibold text-slate-200">
        Yıllık tüketiminiz
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id={`tuketim-${binaId}`}
          inputMode="decimal"
          value={metin}
          onChange={(e) => degisti(e.target.value)}
          placeholder="Örn. 2.500"
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-400"
        />
        <span className="shrink-0 text-xs text-slate-400">MWh/yıl</span>
        {metin && (
          <button
            type="button"
            onClick={() => degisti("")}
            className="shrink-0 rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-white/10"
            aria-label="Tüketimi temizle"
          >
            ✕
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
        Faturadaki yıllık toplam. Girerseniz sistem, üretim tüketiminizi aşmayacak şekilde boyutlanır.
      </p>
    </div>
  );
}
