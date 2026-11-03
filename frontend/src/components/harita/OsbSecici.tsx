"use client";

// OSB seçici (§22.4). GET /osblar en az iki OSB döndürünce görünür; seçilince harita o OSB'ye
// uçar, sınırını çizer ve bütün sorgular ?osb= ile tekrarlanır.
// Tarayıcının kendi <select> menüsü yerine her zaman aşağı doğru açılan bir liste kullanılır.

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Factory } from "lucide-react";
import { BASLIK_YUKSEKLIGI } from "@/components/harita/HaritaKontrolleri";
import { useOsblar } from "@/hooks/veri";
import { sayi } from "@/lib/bicim";
import { useHaritaDurumu } from "@/store/harita";

export function OsbSecici() {
  const { data: osblar } = useOsblar();
  const secili = useHaritaDurumu((d) => d.seciliOsb);
  const sec = useHaritaDurumu((d) => d.osbSec);
  const [acik, setAcik] = useState(false);
  const [etkin, setEtkin] = useState(0);
  const kutu = useRef<HTMLDivElement>(null);
  const listeId = useId();

  // Dışarı tıklanınca kapansın.
  useEffect(() => {
    if (!acik) return;
    const kapat = (e: PointerEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("pointerdown", kapat);
    return () => document.removeEventListener("pointerdown", kapat);
  }, [acik]);

  if (!osblar || osblar.length < 2) return null;
  const seciliOsb = osblar.find((o) => o.id === secili) ?? osblar[0];

  function ac() {
    setEtkin(Math.max(0, osblar!.findIndex((o) => o.id === secili)));
    setAcik(true);
  }

  function secVeKapat(id: string) {
    if (id !== secili) sec(id);
    setAcik(false);
  }

  function tus(e: KeyboardEvent) {
    if (!acik && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      ac();
      return;
    }
    if (!acik) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setAcik(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setEtkin((i) => Math.min(i + 1, osblar!.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setEtkin((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      secVeKapat(osblar![etkin].id);
    }
  }

  return (
    <div ref={kutu} className="relative min-w-0 max-w-[46%] shrink-0 xl:max-w-[40%]">
      <button
        type="button"
        onClick={() => (acik ? setAcik(false) : ac())}
        onKeyDown={tus}
        aria-haspopup="listbox"
        aria-expanded={acik}
        aria-controls={listeId}
        aria-label={`OSB seç: ${seciliOsb.ad}`}
        className={`cam flex w-full items-center gap-2 rounded-full pl-3 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seftali/60 ${BASLIK_YUKSEKLIGI}`}
      >
        <Factory className="h-5 w-5 shrink-0 text-murekkep/60" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-murekkep">{seciliOsb.ad}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-murekkep/55 transition-transform ${acik ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {acik && (
        <ul
          id={listeId}
          role="listbox"
          aria-label="OSB'ler"
          className="cam absolute left-0 top-full z-[1200] mt-2 max-h-[60dvh] w-max min-w-full max-w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl p-1.5"
        >
          {osblar.map((o, i) => {
            const seciliMi = o.id === secili;
            return (
              <li
                key={o.id}
                id={`${listeId}-${i}`}
                role="option"
                aria-selected={seciliMi}
                onMouseEnter={() => setEtkin(i)}
                onClick={() => secVeKapat(o.id)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  i === etkin ? "bg-limon/40" : ""
                } ${seciliMi ? "font-semibold" : ""}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-limon/70 to-seftali/60">
                  <Factory className="h-4 w-4 text-murekkep" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-murekkep">{o.ad}</span>
                  <span className="block text-[11px] font-normal text-murekkep/55">{sayi(o.bina_sayisi)} çatı</span>
                </span>
                {seciliMi && <Check className="h-4 w-4 shrink-0 text-murekkep" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
