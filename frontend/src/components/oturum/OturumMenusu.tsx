"use client";

import Link from "next/link";
import { useState } from "react";
import { cikisYap } from "@/lib/oturum";
import { useOturum } from "@/store/oturum";

export function OturumMenusu() {
  const { kullanici, yukleniyor } = useOturum();
  const [acik, setAcik] = useState(false);

  if (yukleniyor) return null;

  if (!kullanici) {
    return (
      <Link
        href="/giris"
        className="rounded-full border border-white/15 bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-lg backdrop-blur hover:bg-slate-800"
      >
        Giriş
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        aria-label="Hesap menüsü"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold uppercase text-slate-900 shadow-lg"
      >
        {kullanici.eposta?.[0] ?? "?"}
      </button>
      {acik && (
        <div className="absolute right-0 top-full z-[1200] mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 text-sm shadow-xl backdrop-blur">
          <p className="truncate border-b border-white/10 px-4 py-2.5 text-xs text-slate-400">{kullanici.eposta}</p>
          <Link href="/kayitlarim" className="block px-4 py-2.5 text-slate-100 hover:bg-white/10">
            Kayıtlarım
          </Link>
          <button
            type="button"
            onClick={() => {
              setAcik(false);
              void cikisYap();
            }}
            className="block w-full px-4 py-2.5 text-left text-slate-300 hover:bg-white/10"
          >
            Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}
