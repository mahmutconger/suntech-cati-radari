"use client";

// Kayıtlarım ve Varsayımlar sayfalarının dash düzeni: masaüstünde solda sabit kenar çubuğu,
// sağda tam genişlik içerik (ortalanmış değil). Telefonda üstte geri düğmesi ve sekme çipleri.

import Link from "next/link";
import type { ReactNode } from "react";
import { Bookmark, LogOut, Map as HaritaIkonu, SlidersHorizontal, UserRound, type LucideIcon } from "lucide-react";
import { GeriDugmesi } from "@/components/ortak/GeriDugmesi";
import { Logo } from "@/components/ortak/Logo";
import { cikisYap } from "@/lib/oturum";
import { SECILI_CIP } from "@/lib/stil";
import { useOturum } from "@/store/oturum";

type Sayfa = "harita" | "kayitlarim" | "varsayimlar";

const MENU: { sayfa: Sayfa; etiket: string; href: string; Ikon: LucideIcon }[] = [
  { sayfa: "harita", etiket: "Harita", href: "/", Ikon: HaritaIkonu },
  { sayfa: "kayitlarim", etiket: "Kayıtlarım", href: "/kayitlarim", Ikon: Bookmark },
  { sayfa: "varsayimlar", etiket: "Varsayımlar", href: "/varsayimlar", Ikon: SlidersHorizontal },
];

export function DashKabugu({
  aktif,
  ust,
  baslik,
  aciklama,
  sag,
  children,
}: {
  aktif: Exclude<Sayfa, "harita">;
  ust: string;
  baslik: string;
  aciklama?: string;
  sag?: ReactNode;
  children: ReactNode;
}) {
  const kullanici = useOturum((d) => d.kullanici);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-zemin via-zemin to-limon/30 lg:flex">
      {/* Kenar çubuğu (masaüstü) */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-murekkep/10 bg-white/60 p-5 backdrop-blur lg:flex">
        <Logo />
        <nav aria-label="Sayfalar" className="mt-8 space-y-1">
          {MENU.map(({ sayfa, etiket, href, Ikon }) => (
            <Link
              key={sayfa}
              href={href}
              aria-current={aktif === sayfa ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                aktif === sayfa ? SECILI_CIP : "text-murekkep/70 hover:bg-murekkep/5 hover:text-murekkep"
              }`}
            >
              <Ikon className="h-5 w-5" aria-hidden />
              {etiket}
            </Link>
          ))}
        </nav>
        {kullanici && (
          <div className="mt-auto space-y-2 rounded-2xl border border-murekkep/10 bg-white/80 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-limon to-seftali">
                <UserRound className="h-4 w-4 text-murekkep" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-murekkep/50">Profil</p>
                <p className="truncate text-sm font-medium text-murekkep">{kullanici.eposta}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void cikisYap()}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-mercan-koyu hover:bg-mercan/10"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Çıkış yap
            </button>
          </div>
        )}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-4 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pt-8">
          <GeriDugmesi etiket="Haritaya dön" href="/" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mercan-koyu">{ust}</p>
            <h1 className="text-2xl font-bold tracking-tight text-murekkep md:text-3xl">{baslik}</h1>
            {aciklama && <p className="mt-0.5 max-w-3xl text-sm text-murekkep/60">{aciklama}</p>}
          </div>
          {sag && <div className="flex w-full items-center gap-2 sm:w-auto">{sag}</div>}
        </header>

        {/* Telefonda sayfa çipleri */}
        <nav aria-label="Sayfalar" className="flex gap-2 overflow-x-auto px-4 pb-4 lg:hidden">
          {MENU.map(({ sayfa, etiket, href, Ikon }) => (
            <Link
              key={sayfa}
              href={href}
              aria-current={aktif === sayfa ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ${
                aktif === sayfa ? SECILI_CIP : "border border-murekkep/10 bg-white/80 text-murekkep/70"
              }`}
            >
              <Ikon className="h-4 w-4" aria-hidden />
              {etiket}
            </Link>
          ))}
        </nav>

        <main className="px-4 pb-10 md:px-8">{children}</main>
      </div>
    </div>
  );
}
