"use client";

// Telefonda alttan açılan çekmece. Üç durum: kapalı (yalnızca tutamaç ve başlık),
// yarım ve tam. Tutamaca dokununca sıradaki duruma geçer; yukarı/aşağı kaydırma da çalışır.

import { useRef, type ReactNode } from "react";
import { DASH_ZEMINI } from "@/lib/stil";
import { useHaritaDurumu, type CekmeceDurumu } from "@/store/harita";

const YUKSEKLIK: Record<CekmeceDurumu, string> = {
  kapali: "h-[72px]",
  yarim: "h-[48dvh]",
  tam: "h-[88dvh]",
};

const SIRA: CekmeceDurumu[] = ["kapali", "yarim", "tam"];

export function AltCekmece({ baslik, children }: { baslik: string; children: ReactNode }) {
  const durum = useHaritaDurumu((d) => d.cekmece);
  const ayarla = useHaritaDurumu((d) => d.cekmeceAyarla);
  const baslangicY = useRef<number | null>(null);

  function kaydir(yon: 1 | -1) {
    const i = SIRA.indexOf(durum) + yon;
    ayarla(SIRA[Math.min(Math.max(i, 0), SIRA.length - 1)]);
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[1000] flex flex-col rounded-t-3xl border-t border-white/80 ${DASH_ZEMINI} shadow-[0_-12px_32px_-12px_rgb(28_26_23/0.3)] transition-[height] duration-300 md:hidden ${YUKSEKLIK[durum]}`}
    >
      <button
        type="button"
        aria-label="Paneli büyüt ya da küçült"
        onClick={() => ayarla(durum === "tam" ? "kapali" : SIRA[SIRA.indexOf(durum) + 1])}
        onTouchStart={(e) => (baslangicY.current = e.touches[0].clientY)}
        onTouchEnd={(e) => {
          if (baslangicY.current === null) return;
          const fark = e.changedTouches[0].clientY - baslangicY.current;
          if (Math.abs(fark) > 30) kaydir(fark < 0 ? 1 : -1);
          baslangicY.current = null;
        }}
        className="flex shrink-0 flex-col items-center gap-2 px-4 pb-2 pt-2.5"
      >
        <span className="h-1.5 w-10 rounded-full bg-murekkep/20" />
        <span className="text-sm font-semibold text-murekkep">{baslik}</span>
      </button>
      <div className="@container min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] [--panel-pay:1rem]">
        {children}
      </div>
    </div>
  );
}
