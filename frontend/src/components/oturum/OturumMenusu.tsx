"use client";

// Başlıktaki profil alanı: profil ikonu ve "Hesabım" etiketi; açılınca e-posta, Kayıtlarım ve çıkış.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronDown, LogOut, SlidersHorizontal, UserRound } from "lucide-react";
import { BASLIK_ETIKETI, BASLIK_YUKSEKLIGI } from "@/components/harita/HaritaKontrolleri";
import { cikisYap } from "@/lib/oturum";
import { useOturum } from "@/store/oturum";

export function OturumMenusu() {
  const { kullanici, yukleniyor } = useOturum();
  const [acik, setAcik] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);

  // Menü dışına tıklanınca kapansın.
  useEffect(() => {
    if (!acik) return;
    const kapat = (e: PointerEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("pointerdown", kapat);
    return () => document.removeEventListener("pointerdown", kapat);
  }, [acik]);

  if (yukleniyor || !kullanici) return null;

  return (
    <div ref={kutu} className="relative">
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        aria-haspopup="menu"
        aria-label="Profil ve hesap menüsü"
        className={`cam flex shrink-0 items-center gap-2 rounded-full p-1 text-murekkep ${BASLIK_YUKSEKLIGI}`}
      >
        <span className="flex aspect-square h-full items-center justify-center rounded-full bg-gradient-to-br from-limon to-seftali">
          <UserRound className="h-5 w-5" strokeWidth={2.2} aria-hidden />
        </span>
        <span className={`pr-1 text-sm font-semibold ${BASLIK_ETIKETI}`}>Profil</span>
        <ChevronDown className={`mr-2 hidden h-4 w-4 text-murekkep/55 transition-transform 2xl:block ${acik ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {acik && (
        <div role="menu" className="cam absolute right-0 top-full z-[1200] mt-2 w-64 overflow-hidden rounded-2xl text-sm">
          <div className="flex items-center gap-3 border-b border-murekkep/10 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-limon to-seftali">
              <UserRound className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-murekkep/50">Oturum açık</p>
              <p className="truncate font-medium text-murekkep">{kullanici.eposta}</p>
            </div>
          </div>
          <Link role="menuitem" href="/kayitlarim" className="flex items-center gap-3 px-4 py-2.5 text-murekkep hover:bg-limon/30">
            <Bookmark className="h-4 w-4 text-murekkep/60" aria-hidden />
            Kayıtlarım
          </Link>
          <Link role="menuitem" href="/varsayimlar" className="flex items-center gap-3 px-4 py-2.5 text-murekkep hover:bg-limon/30">
            <SlidersHorizontal className="h-4 w-4 text-murekkep/60" aria-hidden />
            Varsayımlar ve kaynaklar
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setAcik(false);
              void cikisYap();
            }}
            className="flex w-full items-center gap-3 border-t border-murekkep/10 px-4 py-2.5 text-left text-mercan-koyu hover:bg-mercan/10"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}
