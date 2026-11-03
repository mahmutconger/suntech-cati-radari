"use client";

// "Yıllık tüketiminiz" kutusu. Girilirse sistem tüketime göre boyutlanır:
// kWp en çok tüketim ÷ verim olur (PROJE.md Bölüm 8).

import { useState } from "react";
import { Gauge, X } from "lucide-react";
import { GIRDI, KART } from "@/lib/stil";
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
    <div className={`${KART} p-3`}>
      <label htmlFor={`tuketim-${binaId}`} className="flex items-center gap-2 text-sm font-semibold text-murekkep">
        <Gauge className="h-4 w-4 text-murekkep/60" aria-hidden />
        Yıllık tüketiminiz
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id={`tuketim-${binaId}`}
          inputMode="decimal"
          value={metin}
          onChange={(e) => degisti(e.target.value)}
          placeholder="Örn. 2.500"
          className={`w-full ${GIRDI}`}
        />
        <span className="shrink-0 text-xs text-murekkep/55">MWh/yıl</span>
        {metin && (
          <button
            type="button"
            onClick={() => degisti("")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-murekkep/55 hover:bg-murekkep/5"
            aria-label="Tüketimi temizle"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-murekkep/50">
        Faturadaki yıllık toplam. Girerseniz sistem, üretim tüketiminizi aşmayacak şekilde boyutlanır.
      </p>
    </div>
  );
}
