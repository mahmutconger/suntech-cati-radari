"use client";

// Paneldeki işaretlenebilir bölüm. Haritadaki bina düğmesiyle hedef olunca panel buraya kayar,
// bölüm şeftali halkayla parlar ve başlığında düğmenin ikonu görünür. İlgili bölümler kesik çizgiyle işaretlenir.

import { useEffect, useRef, type ReactNode } from "react";
import { BOLUMLER, type PanelBolumAdi } from "@/lib/bolumler";
import { useHaritaDurumu } from "@/store/harita";

export function PanelBolumu({ ad, children, className = "" }: { ad: PanelBolumAdi; children: ReactNode; className?: string }) {
  const odak = useHaritaDurumu((d) => d.odak);
  const ref = useRef<HTMLDivElement>(null);
  const hedef = odak?.bolum === ad;
  const ilgili = !hedef && odak !== null && BOLUMLER[odak.bolum].ilgili.includes(ad);
  const sayac = odak?.sayac;

  // Hedef olunca (ya da hedefken sonradan yüklenince) bölüme kay.
  useEffect(() => {
    if (hedef) ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hedef, sayac]);

  const tanim = odak ? BOLUMLER[odak.bolum] : null;

  return (
    <div
      ref={ref}
      id={`bolum-${ad}`}
      className={`relative scroll-mt-4 rounded-2xl transition-[outline-color,box-shadow] ${
        hedef
          ? "ring-2 ring-seftali ring-offset-2 ring-offset-zemin"
          : ilgili
            ? "outline-2 outline-offset-2 outline-dashed outline-seftali/70"
            : ""
      } ${className}`}
    >
      {hedef && tanim && (
        <>
          {/* key ile her basışta yeniden takılır, parlama baştan oynar */}
          <span key={sayac} aria-hidden className="bolum-hedef pointer-events-none absolute inset-0 rounded-2xl" />
          <span className="absolute -top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-limon to-seftali px-2.5 py-0.5 text-[10px] font-bold text-murekkep shadow-sm">
            <tanim.Ikon className="h-3 w-3" aria-hidden />
            {tanim.etiket}
          </span>
        </>
      )}
      {ilgili && tanim && (
        <span className="absolute -top-2.5 right-3 z-10 rounded-full border border-seftali/60 bg-zemin px-2 py-0.5 text-[10px] font-semibold text-murekkep/70">
          İlgili: {tanim.kisa}
        </span>
      )}
      {children}
    </div>
  );
}
