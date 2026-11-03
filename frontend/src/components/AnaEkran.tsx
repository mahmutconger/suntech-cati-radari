"use client";

// Ana sayfa düzeni: tam ekran harita; üstte iki satırlık cam başlık (geri, logo, katman, trafo, QR, profil;
// altında OSB ve arama). Masaüstünde sağda yan panel, telefonda alt çekmece.

import { useRouter } from "next/navigation";
import { AramaCubugu } from "@/components/arama/AramaCubugu";
import { KatmanSecici, Lejant, QrDugmesi, TrafoDugmesi } from "@/components/harita/HaritaKontrolleri";
import { HaritaYukleyici } from "@/components/harita/HaritaYukleyici";
import { OsbSecici } from "@/components/harita/OsbSecici";
import { VeriHatasi } from "@/components/harita/VeriHatasi";
import { GeriDugmesi } from "@/components/ortak/GeriDugmesi";
import { Logo } from "@/components/ortak/Logo";
import { OturumMenusu } from "@/components/oturum/OturumMenusu";
import { AltCekmece } from "@/components/panel/AltCekmece";
import { PanelIcerigi } from "@/components/panel/PanelIcerigi";
import { SohbetKutusu } from "@/components/sohbet/SohbetKutusu";
import { useMasaustu } from "@/hooks/useMasaustu";
import { DASH_ZEMINI } from "@/lib/stil";
import { useHaritaDurumu } from "@/store/harita";

export function AnaEkran() {
  const router = useRouter();
  const seciliId = useHaritaDurumu((d) => d.seciliBinaId);
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  // Telefonda çekmece açıkken asistan düğmesi içeriğin üstüne binmesin.
  const cekmeceAcik = useHaritaDurumu((d) => d.cekmece !== "kapali");
  // Panel içeriği tek yerde render edilir: masaüstünde yan panel, telefonda çekmece.
  const masaustu = useMasaustu();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-zemin">
      <div className="absolute inset-0 md:right-[400px]">
        <HaritaYukleyici />
      </div>

      {/* Üst başlık: geniş ekranda (xl, 1280 px+) tek satır; daha dar ekranda ikinci satırda OSB ve arama */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:right-[400px] md:p-4">
        <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
          <div className="pointer-events-auto order-1 flex shrink-0 items-center gap-2">
            <GeriDugmesi
              etiket={seciliId !== null ? "Seçimi kapat, OSB özetine dön" : "Tanıtıma dön"}
              onClick={() => (seciliId !== null ? binaSec(null) : router.push("/tanitim"))}
            />
            <Logo cam adSinifi="hidden min-[400px]:inline xl:hidden 2xl:inline" />
          </div>
          <div className="pointer-events-auto order-3 flex w-full min-w-0 gap-2 xl:order-2 xl:w-auto xl:flex-1">
            <OsbSecici />
            <div className="min-w-0 flex-1">
              <AramaCubugu />
            </div>
          </div>
          <div className="pointer-events-auto order-2 ml-auto flex shrink-0 items-center gap-2 xl:order-3 xl:ml-0">
            <KatmanSecici />
            <TrafoDugmesi />
            <QrDugmesi />
            <OturumMenusu />
          </div>
        </div>
      </header>

      {/* Veri hatası: başlığın altında, ortada */}
      <div className="pointer-events-none absolute inset-x-0 top-[124px] z-[1000] flex justify-center px-3 md:right-[400px] md:top-[136px] xl:top-[80px]">
        <VeriHatasi />
      </div>

      {/* Lejant: masaüstünde sol alt; telefonda çekmecenin üstünde tek satır */}
      <div className="pointer-events-none absolute bottom-6 left-4 z-[900] hidden md:block">
        <div className="pointer-events-auto">
          <Lejant />
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-[176px] left-3 z-[900] md:hidden">
        <Lejant kompakt />
      </div>

      {/* Asistan: masaüstünde haritanın sağ altı, telefonda çekmecenin üstü */}
      <div
        className={`pointer-events-none absolute bottom-[124px] right-3 z-[1100] md:bottom-6 md:right-[416px] ${
          cekmeceAcik ? "max-md:hidden" : ""
        }`}
      >
        <SohbetKutusu />
      </div>

      {/* Masaüstü yan panel (dash) */}
      <aside className={`absolute inset-y-0 right-0 z-[1000] hidden w-[400px] overflow-y-auto border-l border-murekkep/15 p-5 md:block ${DASH_ZEMINI}`}>
        {masaustu && <PanelIcerigi />}
      </aside>

      {/* Telefon alt çekmece */}
      <AltCekmece baslik={seciliId !== null ? "Çatı bilgisi" : "OSB özeti ve ilk 20 çatı"}>
        {masaustu === false && <PanelIcerigi />}
      </AltCekmece>
    </main>
  );
}
