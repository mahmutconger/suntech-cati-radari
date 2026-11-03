"use client";

// Masaüstü yan panelin sol kenarının tam ortasındaki çentik: panele dokununca panel animasyonla genişler,
// yeniden dokununca daralır. Geniş halde haritaya en az 440 px kalır (globals.css: --panel-genis).
// Yalnızca lg (1024 px) ve üstünde görünür; daha dar ekranda genişleyecek yer yok.

import { ChevronLeft } from "lucide-react";
import { useHaritaDurumu } from "@/store/harita";

export function PanelCentigi() {
  const genis = useHaritaDurumu((d) => d.panelGenis);
  const ayarla = useHaritaDurumu((d) => d.panelGenisAyarla);
  const etiket = genis ? "Paneli daralt" : "Paneli genişlet";

  return (
    <button
      type="button"
      onClick={() => ayarla(!genis)}
      aria-expanded={genis}
      aria-controls="yan-panel"
      aria-label={etiket}
      title={`${etiket} (haritayı ${genis ? "büyüt" : "küçült"})`}
      className="group absolute left-0 top-1/2 z-20 hidden -translate-x-full -translate-y-1/2 items-center lg:flex"
    >
      {/* Üzerine gelince sola doğru açılan kısa etiket */}
      <span
        aria-hidden
        className="pointer-events-none mr-2 translate-x-2 whitespace-nowrap rounded-full bg-murekkep px-3 py-1.5 text-xs font-semibold text-limon opacity-0 shadow-lg transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
      >
        {etiket}
      </span>
      <span className="relative flex h-20 w-6 flex-col items-center justify-center gap-1.5 rounded-l-2xl border border-r-0 border-murekkep/15 bg-[#f3efe5] text-murekkep/70 shadow-[-6px_0_16px_-8px_rgb(28_26_23/0.35)] transition-[width,color,background-color] duration-200 group-hover:w-7 group-hover:bg-white group-hover:text-murekkep group-focus-visible:ring-2 group-focus-visible:ring-seftali">
        <span aria-hidden className="h-1 w-1 rounded-full bg-murekkep/25" />
        <ChevronLeft
          aria-hidden
          className={`h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.22,0.8,0.2,1)] ${genis ? "rotate-180" : ""}`}
          strokeWidth={2.6}
        />
        <span aria-hidden className="h-1 w-1 rounded-full bg-murekkep/25" />
        {/* Geniş halde limon şerit: panelin genişlediğini belli eder */}
        <span
          aria-hidden
          className={`absolute inset-y-3 left-0 w-[3px] rounded-full bg-gradient-to-b from-limon to-seftali transition-opacity duration-300 ${genis ? "opacity-100" : "opacity-0"}`}
        />
      </span>
    </button>
  );
}
