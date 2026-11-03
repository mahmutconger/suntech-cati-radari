"use client";

// Seçili binaya odak: binanın dışı bulanıklaşır, çevresinde beş düğme durur
// (25 yıllık finans, saatlik simülasyon, kredi, ön fizibilite raporu, varsayımlar). Düğme sağ paneli ilgili bölüme götürür.
//
// Katman harita kapsayıcısının kardeşi olarak (portal) çizilir: Leaflet düğme tıklamalarını görmez,
// haritadaki "boşluğa tıklayınca seçimi kaldır" davranışı da bozulmaz. Bulanık katman tıklamaları geçirir.

import L from "leaflet";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";
import { useBinalar } from "@/hooks/veri";
import { BOLUM_SIRASI, BOLUMLER, type Bolum } from "@/lib/bolumler";
import { useHaritaDurumu } from "@/store/harita";

interface Ekran {
  /** Binanın sınır kutusu, harita kapsayıcısına göre piksel. */
  sol: number;
  ust: number;
  sag: number;
  alt: number;
  genislik: number;
  yukseklik: number;
}

/** Düğmelerin binadan uzaklığı (px). */
const ARALIK = 22;
const KENAR = 12;

/**
 * Haritanın binayı göstereceği bant (harita kapsayıcısına göre piksel): üstte başlık,
 * telefonda altta yarım açık çekmece kalır. Başlık 1280 px'ten dar ekranda iki satırdır.
 */
export function gorunurBant(harita: L.Map): { ust: number; alt: number; sol: number; sag: number } {
  const boyut = harita.getSize();
  const ekran = typeof window === "undefined" ? 1440 : window.innerWidth;
  const telefon = ekran < 768;
  const ikiSatir = ekran < 1280;
  return {
    ust: telefon ? 132 : ikiSatir ? 140 : 84,
    alt: telefon ? boyut.y * 0.5 : boyut.y - 32,
    sol: telefon ? 16 : 48,
    sag: boyut.x - (telefon ? 16 : 48),
  };
}

function DugmeKonumu({
  bolum,
  ekran,
  boyut,
  secili,
  sec,
}: {
  bolum: Bolum;
  ekran: Ekran;
  boyut: L.Point;
  secili: boolean;
  sec: (b: Bolum) => void;
}) {
  const sira = BOLUM_SIRASI.indexOf(bolum);
  // Dört köşe; beşincisi (varsayımlar) alt sıranın altında, ortada.
  const ortada = sira === 4;
  const solda = sira === 0 || sira === 3;
  const ustte = sira === 0 || sira === 1;
  const ortaX = (ekran.sol + ekran.sag) / 2;
  // Köşeden dışarı doğru: soldakiler sağ kenarından, üsttekiler alt kenarından hizalanır.
  const x = ortada
    ? Math.min(Math.max(ortaX, KENAR + 90), boyut.x - KENAR - 90)
    : Math.min(Math.max(solda ? ekran.sol - ARALIK : ekran.sag + ARALIK, KENAR + 150), boyut.x - KENAR - 150);
  const y = ortada
    ? Math.min(ekran.alt + ARALIK + 64, boyut.y - KENAR - 48)
    : Math.min(Math.max(ustte ? ekran.ust - ARALIK : ekran.alt + ARALIK, KENAR + 48), boyut.y - KENAR - 48);
  const tanim = BOLUMLER[bolum];
  const stil: CSSProperties = {
    left: x,
    top: y,
    transform: ortada ? "translate(-50%, 0)" : `translate(${solda ? "-100%" : "0"}, ${ustte ? "-100%" : "0"})`,
    animationDelay: `${sira * 60}ms`,
  };

  return (
    <button
      type="button"
      onClick={() => sec(bolum)}
      aria-pressed={secili}
      title={tanim.aciklama}
      style={stil}
      className={`odak-dugmesi pointer-events-auto absolute flex h-12 items-center gap-2 rounded-full p-1 text-sm font-semibold text-murekkep transition-[background,box-shadow] ${
        solda ? "flex-row-reverse pl-4" : "pr-4"
      } ${secili ? "bg-gradient-to-r from-limon to-seftali shadow-lg ring-2 ring-white" : "cam hover:ring-2 hover:ring-seftali/60"}`}
    >
      <span
        className={`flex aspect-square h-full items-center justify-center rounded-full ${
          secili ? "bg-white/80" : "bg-gradient-to-br from-limon to-seftali"
        }`}
      >
        <tanim.Ikon className="h-5 w-5" strokeWidth={2.3} aria-hidden />
      </span>
      <span className="whitespace-nowrap">
        <span className="md:hidden">{tanim.kisa}</span>
        <span className="hidden md:inline">{tanim.etiket}</span>
      </span>
    </button>
  );
}

export function SeciliBinaOdagi() {
  const harita = useMap();
  const seciliId = useHaritaDurumu((d) => d.seciliBinaId);
  const odak = useHaritaDurumu((d) => d.odak);
  const bolumeGit = useHaritaDurumu((d) => d.bolumeGit);
  const { data } = useBinalar();
  const [ekran, setEkran] = useState<Ekran | null>(null);
  const [boyut, setBoyut] = useState<L.Point>(() => harita.getSize());
  const [yakinlasiyor, setYakinlasiyor] = useState(false);

  const sinir = useMemo(() => {
    if (seciliId === null || !data) return null;
    const bina = data.features.find((f) => f.properties.id === seciliId);
    return bina ? L.geoJSON(bina as GeoJSON.Feature).getBounds() : null;
  }, [seciliId, data]);

  // Harita kaydıkça ya da yakınlaştıkça binanın ekrandaki yerini güncelle (kare başına bir kez).
  useEffect(() => {
    if (!sinir) return;
    let kare = 0;
    const hesapla = () => {
      kare = 0;
      const kb = harita.latLngToContainerPoint(sinir.getNorthWest());
      const gd = harita.latLngToContainerPoint(sinir.getSouthEast());
      setBoyut(harita.getSize());
      setEkran({ sol: kb.x, ust: kb.y, sag: gd.x, alt: gd.y, genislik: gd.x - kb.x, yukseklik: gd.y - kb.y });
    };
    const planla = () => {
      if (!kare) kare = requestAnimationFrame(hesapla);
    };
    const basla = () => setYakinlasiyor(true);
    const bitti = () => {
      setYakinlasiyor(false);
      planla();
    };
    planla();
    harita.on("move resize viewreset", planla);
    harita.on("zoomstart", basla);
    harita.on("zoomend", bitti);
    return () => {
      if (kare) cancelAnimationFrame(kare);
      harita.off("move resize viewreset", planla);
      harita.off("zoomstart", basla);
      harita.off("zoomend", bitti);
    };
  }, [harita, sinir]);

  const hedef = harita.getContainer().parentElement;
  if (!sinir || !ekran || !hedef || seciliId === null) return null;

  // Bulanıklığın açık kalan elipsi binanın sınır kutusunu içine alır (köşeler için √2 katı).
  const cx = (ekran.sol + ekran.sag) / 2;
  const cy = (ekran.ust + ekran.alt) / 2;
  const rx = Math.max(ekran.genislik / 2 + 16, 36) * 1.55;
  const ry = Math.max(ekran.yukseklik / 2 + 16, 36) * 1.55;
  const maske = `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, transparent 0%, transparent 72%, #000 100%)`;

  return createPortal(
    <div className="pointer-events-none absolute inset-0 z-[500]">
      {/* Binanın dışını bulanıklaştıran katman */}
      <div
        aria-hidden
        className="absolute inset-0 bg-zemin/20 backdrop-blur-[5px] backdrop-saturate-[.7] transition-opacity duration-300"
        style={{ maskImage: maske, WebkitMaskImage: maske }}
      />

      <div className={`transition-opacity duration-150 ${yakinlasiyor ? "opacity-0" : "opacity-100"}`}>
        {/* Binanın çevresindeki çerçeve */}
        <div
          aria-hidden
          className="absolute rounded-xl border-2 border-dashed border-white/90 shadow-[0_0_0_1px_rgb(28_26_23/0.25)]"
          style={{
            left: ekran.sol - 8,
            top: ekran.ust - 8,
            width: Math.max(ekran.genislik + 16, 24),
            height: Math.max(ekran.yukseklik + 16, 24),
          }}
        />
        <nav key={seciliId} aria-label="Seçili bina için bölümler">
          {BOLUM_SIRASI.map((b) => (
            <DugmeKonumu key={b} bolum={b} ekran={ekran} boyut={boyut} secili={odak?.bolum === b} sec={bolumeGit} />
          ))}
        </nav>
      </div>
    </div>,
    hedef,
  );
}
