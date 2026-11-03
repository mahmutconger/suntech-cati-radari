"use client";

// Ana sayfa düzeni: tam ekran harita; üstte iki satırlık cam başlık (geri, logo, katman, trafo, QR, profil;
// altında OSB ve arama). Masaüstünde sağda yan panel, telefonda alt çekmece.
// Yan panel çentik düğmesiyle animasyonla genişler/daralır (--panel); harita, başlık ve asistan birlikte kayar.
// Panel genişken başlık iki satıra iner ve düğme yazıları kapanır (baslikDar, store/harita.ts).

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { AramaCubugu } from "@/components/arama/AramaCubugu";
import { KatmanSecici, Lejant, QrDugmesi, TrafoDugmesi } from "@/components/harita/HaritaKontrolleri";
import { HaritaYukleyici } from "@/components/harita/HaritaYukleyici";
import { IslemGostergesi } from "@/components/harita/IslemGostergesi";
import { OsbSecici } from "@/components/harita/OsbSecici";
import { VeriHatasi } from "@/components/harita/VeriHatasi";
import { GeriDugmesi } from "@/components/ortak/GeriDugmesi";
import { Logo } from "@/components/ortak/Logo";
import { OturumMenusu } from "@/components/oturum/OturumMenusu";
import { AltCekmece } from "@/components/panel/AltCekmece";
import { PanelCentigi } from "@/components/panel/PanelCentigi";
import { PanelIcerigi } from "@/components/panel/PanelIcerigi";
import { SohbetKutusu } from "@/components/sohbet/SohbetKutusu";
import { useMasaustu } from "@/hooks/useMasaustu";
import { DASH_ZEMINI } from "@/lib/stil";
import { useHaritaDurumu } from "@/store/harita";

/** Yan panelle birlikte kayan öğelerin geçişi (globals.css: --panel-gecis). */
const SAG_GECIS = "md:[transition:right_var(--panel-gecis)] motion-reduce:transition-none";
const KONUM_GECISI = { layout: { duration: 0.45, ease: [0.22, 0.8, 0.2, 1] as const } };

export function AnaEkran() {
  const router = useRouter();
  const seciliId = useHaritaDurumu((d) => d.seciliBinaId);
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  // Telefonda çekmece açıkken asistan düğmesi içeriğin üstüne binmesin.
  const cekmeceAcik = useHaritaDurumu((d) => d.cekmece !== "kapali");
  // Panel içeriği tek yerde render edilir: masaüstünde yan panel, telefonda çekmece.
  const masaustu = useMasaustu();
  const panelGenis = useHaritaDurumu((d) => d.panelGenis);
  const baslikDar = useHaritaDurumu((d) => d.baslikDar);
  // Geniş ekranda başlık tek satır; panel genişken (baslikDar) iki satır kalır.
  const tekSatir = !baslikDar;

  return (
    <main
      className="relative h-dvh w-full overflow-hidden bg-zemin"
      style={{ "--panel": panelGenis ? "var(--panel-genis)" : "var(--panel-dar)" } as CSSProperties}
    >
      <div className={`absolute inset-0 md:right-(--panel) ${SAG_GECIS}`}>
        <HaritaYukleyici />
        <IslemGostergesi />
      </div>

      {/* Üst başlık: geniş ekranda (xl, 1280 px+) tek satır; daha dar ekranda ya da panel genişken ikinci satırda
          OSB ve arama. Gruplar satır değiştirirken yerlerine kayarak gider (motion layout). */}
      <header
        className={`pointer-events-none absolute inset-x-0 top-0 z-[1000] p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:right-(--panel) md:p-4 ${SAG_GECIS} ${
          baslikDar ? "baslik-dar" : ""
        }`}
      >
        <div className={`flex flex-wrap items-center gap-2 ${tekSatir ? "xl:flex-nowrap" : ""}`}>
          <motion.div
            layout="position"
            transition={KONUM_GECISI}
            className="pointer-events-auto order-1 flex shrink-0 items-center gap-2"
          >
            <GeriDugmesi
              etiket={seciliId !== null ? "Seçimi kapat, OSB özetine dön" : "Tanıtıma dön"}
              onClick={() => (seciliId !== null ? binaSec(null) : router.push("/tanitim"))}
            />
            <Logo cam adSinifi="logo-adi" />
          </motion.div>
          <motion.div
            layout="position"
            transition={KONUM_GECISI}
            className={`pointer-events-auto order-3 flex w-full min-w-0 gap-2 ${tekSatir ? "xl:order-2 xl:w-auto xl:flex-1" : ""}`}
          >
            <OsbSecici />
            <div className="min-w-0 flex-1">
              <AramaCubugu />
            </div>
          </motion.div>
          <motion.div
            layout="position"
            transition={KONUM_GECISI}
            className={`pointer-events-auto order-2 ml-auto flex shrink-0 items-center gap-2 ${tekSatir ? "xl:order-3 xl:ml-0" : ""}`}
          >
            <KatmanSecici />
            <TrafoDugmesi />
            <QrDugmesi />
            <OturumMenusu />
          </motion.div>
          {/* Veri hatası: başlığın altında, ortada */}
          <div className="order-4 flex w-full justify-center empty:hidden">
            <VeriHatasi />
          </div>
        </div>
      </header>

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
        className={`pointer-events-none absolute bottom-[124px] right-3 z-[1100] md:bottom-6 md:right-[calc(var(--panel)+16px)] ${SAG_GECIS} ${
          cekmeceAcik ? "max-md:hidden" : ""
        }`}
      >
        <SohbetKutusu />
      </div>

      {/* Masaüstü yan panel (dash) */}
      <aside
        id="yan-panel"
        aria-label="Yan panel"
        className="absolute inset-y-0 right-0 z-[1000] hidden w-(--panel) border-l border-murekkep/15 [transition:width_var(--panel-gecis)] motion-reduce:transition-none md:block"
      >
        <PanelCentigi />
        {/* @container: panel genişleyince içerik ızgaraları sütun ekler (@xl:, @2xl:) */}
        <div
          className={`@container h-full overflow-y-auto px-5 pb-5 pt-4 [--panel-pay:1.25rem] [--panel-ust:1rem] ${DASH_ZEMINI}`}
        >
          {masaustu && <PanelIcerigi />}
        </div>
      </aside>

      {/* Telefon alt çekmece */}
      <AltCekmece baslik={seciliId !== null ? "Çatı bilgisi" : "OSB özeti ve ilk 20 çatı"}>
        {masaustu === false && <PanelIcerigi />}
      </AltCekmece>
    </main>
  );
}
