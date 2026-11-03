"use client";

// Ana sayfa düzeni: tam ekran harita; üstte arama ve katman seçici;
// masaüstünde sağda yan panel, telefonda alt çekmece.

import { AramaCubugu } from "@/components/arama/AramaCubugu";
import { KatmanSecici, Lejant } from "@/components/harita/HaritaKontrolleri";
import { HaritaYukleyici } from "@/components/harita/HaritaYukleyici";
import { OturumMenusu } from "@/components/oturum/OturumMenusu";
import { AltCekmece } from "@/components/panel/AltCekmece";
import { PanelIcerigi } from "@/components/panel/PanelIcerigi";
import { SohbetKutusu } from "@/components/sohbet/SohbetKutusu";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useHaritaDurumu } from "@/store/harita";

export function AnaEkran() {
  const seciliId = useHaritaDurumu((d) => d.seciliBinaId);
  // Panel içeriği tek yerde render edilir: masaüstünde yan panel, telefonda çekmece.
  const masaustu = useMasaustu();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-slate-950">
      <div className="absolute inset-0 md:right-[400px]">
        <HaritaYukleyici />
      </div>

      {/* Üst çubuk: telefonda logo + katman üstte, arama altta; masaüstünde tek satır */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-wrap items-center gap-2 p-3 md:right-[400px] md:flex-nowrap md:p-4">
        <div className="pointer-events-auto order-1 flex items-center gap-2 rounded-full bg-slate-900/85 px-3 py-2 shadow-lg backdrop-blur">
          <span aria-hidden className="text-base">☀️</span>
          <span className="text-sm font-bold tracking-tight text-amber-300">Çatı Radarı</span>
        </div>
        <div className="pointer-events-auto order-2 ml-auto flex items-center gap-2 md:order-3 md:ml-0">
          <KatmanSecici />
          <OturumMenusu />
        </div>
        <div className="pointer-events-auto order-3 w-full md:order-2 md:max-w-md">
          <AramaCubugu />
        </div>
      </div>

      {/* Lejant: masaüstünde sol alt; telefonda çekmecenin üstünde tek satır */}
      <div className="pointer-events-none absolute bottom-6 left-4 z-[900] hidden md:block">
        <div className="pointer-events-auto">
          <Lejant />
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-[128px] left-3 z-[900] md:hidden">
        <Lejant kompakt />
      </div>

      {/* Asistan: masaüstünde haritanın sağ altı, telefonda çekmecenin üstü */}
      <div className="pointer-events-none absolute bottom-[124px] right-3 z-[1100] md:bottom-6 md:right-[416px]">
        <SohbetKutusu />
      </div>

      {/* Masaüstü yan panel */}
      <aside className="absolute inset-y-0 right-0 z-[1000] hidden w-[400px] overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 backdrop-blur md:block">
        {masaustu && <PanelIcerigi />}
      </aside>

      {/* Telefon alt çekmece */}
      <AltCekmece baslik={seciliId !== null ? "Çatı bilgisi" : "OSB özeti ve ilk 20 çatı"}>
        {masaustu === false && <PanelIcerigi />}
      </AltCekmece>
    </main>
  );
}
