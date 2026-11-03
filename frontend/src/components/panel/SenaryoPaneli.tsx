"use client";

// OSB yönetimi için senaryo: en uygun çatılardan başlayarak kurulum yapılırsa OSB toplamı.
// Çatısında zaten GES olan (skor 0) sayılmaz. Veri toplu hesaptan gelir, ek istek gitmez.

import { useMemo, useState } from "react";
import { Deger } from "@/components/ortak/Deger";
import { sayi, tl } from "@/lib/bicim";
import { KART, SECILI_CIP } from "@/lib/stil";
import type { HesapSonucu } from "@/types/gecici";

const SECENEKLER = [
  { oran: 0.25, etiket: "%25" },
  { oran: 0.5, etiket: "%50" },
  { oran: 1, etiket: "Hepsi" },
];

function senaryo(sonuclar: HesapSonucu[], oran: number) {
  const adaylar = sonuclar.filter((s) => s.uygunluk_skoru > 0).sort((a, b) => b.uygunluk_skoru - a.uygunluk_skoru);
  const secilen = adaylar.slice(0, Math.ceil(adaylar.length * oran));
  const topla = (alan: (s: HesapSonucu) => number) => secilen.reduce((toplam, s) => toplam + alan(s), 0);
  return {
    cati: secilen.length,
    mwp: topla((s) => s.kwp) / 1000,
    tasarruf: topla((s) => s.tasarruf_tl),
    co2: topla((s) => s.co2_ton),
    yatirim: topla((s) => s.yatirim_tl),
  };
}

export function SenaryoPaneli({ sonuclar }: { sonuclar: HesapSonucu[] }) {
  const [oran, setOran] = useState(0.25);
  const s = useMemo(() => senaryo(sonuclar, oran), [sonuclar, oran]);
  return (
    <div className={`${KART} space-y-2 p-3`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-murekkep">Çatıların ne kadarı kurarsa?</h3>
        <div className="flex rounded-full bg-murekkep/5 p-0.5 text-[11px]">
          {SECENEKLER.map((x) => (
            <button
              key={x.oran}
              type="button"
              onClick={() => setOran(x.oran)}
              aria-pressed={oran === x.oran}
              className={`rounded-full px-2.5 py-0.5 font-medium ${oran === x.oran ? SECILI_CIP : "text-murekkep/60 hover:bg-murekkep/5"}`}
            >
              {x.etiket}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-murekkep/55">En uygundan başlayarak {sayi(s.cati)} çatı kurarsa</p>
      <div className="grid grid-cols-2 gap-2">
        <Deger etiket="Kurulu güç" deger={`${sayi(s.mwp, 1)} MWp`} vurgu />
        <Deger etiket="Yıllık tasarruf" deger={`${tl(s.tasarruf)}/yıl`} vurgu />
        <Deger etiket="Önlenen CO₂" deger={`${sayi(s.co2)} t/yıl`} />
        <Deger etiket="Yatırım" deger={tl(s.yatirim)} />
      </div>
    </div>
  );
}
