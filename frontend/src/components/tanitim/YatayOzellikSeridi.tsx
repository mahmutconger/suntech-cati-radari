"use client";

// Tanıtımdaki yatay kaydırmalı özellik şeridi (21st.dev "Horizontal Feature Reveal" tasarımından uyarlandı).
// Masaüstünde (≥1026 px) bölüm sabitlenir, kaydırdıkça kartlar yatay akar; numara, başlık ve metin
// satır satır belirir, görsel paralaksla kayar. Daha dar ekranda ya da "hareketi azalt" açıkken kartlar
// alt alta, animasyonsuz gösterilir. Renkler uygulamanın paletinden (globals.css).

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  FinansGorseli,
  HaritaGorseli,
  OzellikZemini,
  RaporGorseli,
  YapayZekaGorseli,
  type ZeminTuru,
} from "./OzellikGorselleri";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Bir öğenin animasyon başlangıç/bitiş noktaları (ScrollTrigger biçiminde, bölüme göre). */
interface Tetik {
  start: string;
  end: string;
}

export interface Ozellik {
  numara: string;
  baslik: string;
  paragraflar: string[];
  /** Önde, her zaman tam görünen çizim. */
  gorsel: ReactNode;
  /** Arkada paralaksla kayan desen. */
  zemin: ZeminTuru;
  tetikler: { gorsel: Tetik; metin: Tetik };
}

/** Çatı Radarı'nın can alıcı dört özelliği. */
export const OZELLIKLER: Ozellik[] = [
  {
    numara: "01",
    baslik: "Her çatı, haritada tek tek",
    gorsel: <HaritaGorseli />,
    zemin: "harita",
    paragraflar: [
      "Manisa, Muradiye ve Salihli OSB'lerinde 1.000 m² üstü her çatı haritada; renkler yıllık tasarrufa göre koyulaşıyor.",
      "Fabrikanızı arayın, çatıya dokunun: kurulabilir güç, yıllık üretim, tasarruf, yatırım, geri ödeme ve önlenen CO₂ hemen karşınızda.",
    ],
    tetikler: { gorsel: { start: "-10% top", end: "10% top" }, metin: { start: "-1% top", end: "5% top" } },
  },
  {
    numara: "02",
    baslik: "Tüketiminize göre, saat saat",
    gorsel: <FinansGorseli />,
    zemin: "limon",
    paragraflar: [
      "Yıllık tüketiminizi ve vardiyanızı girin; sistem PVGIS'in 8.760 saatlik üretimiyle saat saat mahsuplaşarak boyutlanır.",
      "25 yıllık nakit akışı, net bugünkü değer, iç verim oranı ve LCOE; pil, kredi taksiti ve şebekeye vermeden seçenekleriyle.",
    ],
    tetikler: { gorsel: { start: "-5% top", end: "35% top" }, metin: { start: "18% top", end: "23% top" } },
  },
  {
    numara: "03",
    baslik: "Yapay zekâ, rakam uydurmadan",
    gorsel: <YapayZekaGorseli />,
    zemin: "uydu",
    paragraflar: [
      "Gemini çatının uydu görüntüsüne bakar: panel var mı, çatının ne kadarını kaplıyor. Panel varsa çatı listede geriye düşer.",
      "Asistan sorularınızı hesap motorunun araçlarıyla cevaplar; kullandığı araç her cevabın altında görünür, sayılar ondan gelir.",
    ],
    tetikler: { gorsel: { start: "25% top", end: "65% top" }, metin: { start: "45% top", end: "50% top" } },
  },
  {
    numara: "04",
    baslik: "İlk gidilecek çatı ve hazır rapor",
    gorsel: <RaporGorseli />,
    zemin: "mercan",
    paragraflar: [
      "Uygunluk skoru geri ödemeyi, güneş verimini, sistem büyüklüğünü ve trafoya uzaklığı birleştirir; ilk gidilecek 20 çatı hazır.",
      "Tek sayfalık ön fizibilite raporunu PDF olarak indirin: uydu görüntüsü, metrikler, 25 yıllık grafik ve kullanılan varsayımlar.",
    ],
    tetikler: { gorsel: { start: "45% top", end: "85% top" }, metin: { start: "65% top", end: "70% top" } },
  },
];

interface YatayOzellikSeridiProps {
  ozellikler?: Ozellik[];
  /** Görselin yatay paralaks yolu, %. */
  paralaks?: number;
  /** Kartlar arası boşluk, vw. */
  kartAraligi?: number;
}

export function YatayOzellikSeridi({
  ozellikler = OZELLIKLER,
  paralaks = 30,
  kartAraligi = 15,
}: YatayOzellikSeridiProps) {
  const bolumRef = useRef<HTMLElement>(null);
  const seritRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bolum = bolumRef.current;
    const serit = seritRef.current;
    if (!bolum || !serit) return;

    // Seçiciler bu bölümle sınırlı; sayfadaki başka öğelere dokunulmaz.
    const mm = gsap.matchMedia(bolum);
    mm.add({ genis: "(min-width: 1026px)", azHareket: "(prefers-reduced-motion: reduce)" }, (baglam) => {
      const { genis, azHareket } = baglam.conditions as { genis: boolean; azHareket: boolean };
      if (!genis) return;

      gsap.set(".ozellik-gorsel, .ozellik-no, .ozellik-baslik, .ozellik-metin", { opacity: 1 });

      // Şerit, son kart ekranın içinde bitecek kadar kayar (ekran genişliği değişince yeniden ölçülür).
      gsap.to(serit, {
        x: () => -(serit.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: bolum,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      if (azHareket) return;

      bolum.querySelectorAll<HTMLElement>(".ozellik-kart").forEach((kart, i) => {
        const t = ozellikler[i]?.tetikler;
        if (!t) return;
        const metinTetigi = {
          trigger: bolum,
          start: t.metin.start,
          end: t.metin.end,
          toggleActions: "play none none reverse",
        };

        const no = kart.querySelector(".ozellik-no");
        if (no) {
          const parca = new SplitText(no, { type: "chars,lines", mask: "lines" });
          gsap.from(parca.chars, {
            y: 150,
            rotate: 10,
            stagger: 0.1,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: metinTetigi,
          });
        }

        const baslik = kart.querySelector(".ozellik-baslik");
        if (baslik) {
          const satirlar = new SplitText(baslik, { type: "lines", mask: "lines" });
          gsap.from(satirlar.lines, {
            yPercent: 100,
            stagger: 0.08,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: metinTetigi,
          });
        }

        kart.querySelectorAll(".ozellik-metin").forEach((metin) => {
          const satirlar = new SplitText(metin, { type: "lines", mask: "lines" });
          gsap.from(satirlar.lines, {
            yPercent: 100,
            stagger: 0.08,
            delay: 0.3,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: metinTetigi,
          });
        });

        const gorsel = kart.querySelector(".ozellik-gorsel");
        if (gorsel) {
          gsap.to(gorsel, {
            xPercent: paralaks,
            ease: "none",
            scrollTrigger: { trigger: bolum, start: t.gorsel.start, end: t.gorsel.end, scrub: true },
          });
        }
      });
    });

    ScrollTrigger.refresh();
    return () => mm.revert();
  }, [ozellikler, paralaks]);

  return (
    <section
      ref={bolumRef}
      aria-label="Çatı Radarı neler yapıyor"
      className="relative z-10 h-[600vh] w-full bg-zemin text-murekkep max-[1025px]:h-fit max-[1025px]:px-[7vw] max-[1025px]:py-[15%]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden max-[1025px]:static max-[1025px]:h-fit max-[1025px]:overflow-visible">
        <div
          ref={seritRef}
          className="flex w-fit flex-nowrap gap-(--kart-araligi) pl-[7vw] pr-[7vw] max-[1025px]:flex-col max-[1025px]:gap-[10vw] max-[1025px]:px-0 max-md:gap-[15vw]"
          style={{ "--kart-araligi": `${kartAraligi}vw` } as CSSProperties}
        >
          {ozellikler.map((o) => (
            <article
              key={o.numara}
              className="ozellik-kart flex h-screen w-[80vw] gap-[5vw] max-[1025px]:h-fit max-[1025px]:w-full max-[1025px]:flex-col-reverse"
            >
              {/* Görsel: zemin paralaksta kenar boşluğu görünmesin diye çerçeveden geniş; çizim önde sabit */}
              <div className="relative h-screen w-[40vw] shrink-0 overflow-hidden max-[1025px]:h-[80vw] max-[1025px]:w-full max-[1025px]:rounded-[2vw] max-md:h-[110vw] max-md:rounded-[4vw]">
                <div
                  className="ozellik-gorsel absolute inset-y-0 w-[160%] opacity-0 max-[1025px]:left-[-30%] max-[1025px]:translate-x-0 max-[1025px]:opacity-100"
                  style={{ left: `-${30 + paralaks}%` }}
                >
                  <OzellikZemini tur={o.zemin} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-[9%] max-md:p-[7%]">
                  <div className="aspect-[1/2] h-full max-w-full overflow-hidden rounded-[1.75rem] shadow-2xl shadow-murekkep/25">
                    {o.gorsel}
                  </div>
                </div>
              </div>

              <div className="flex w-[60%] flex-col gap-[5vh] pt-[7%] max-[1025px]:w-full max-[1025px]:gap-[4vw] max-md:gap-[7vw] max-md:pt-0">
                <p className="ozellik-no text-[6em] font-medium leading-none text-seftali opacity-0 max-[1025px]:text-[10vw] max-[1025px]:opacity-100">
                  {o.numara}
                </p>
                <div className="flex h-fit w-full flex-col gap-[4vh] max-md:gap-[7vw]">
                  <h3 className="ozellik-baslik text-[4em] font-semibold leading-[1.2] tracking-tight opacity-0 max-[1025px]:text-[7.5vw] max-[1025px]:opacity-100 max-md:text-[9vw]">
                    {o.baslik}
                  </h3>
                  <div className="space-y-[1.5vw] text-lg text-murekkep/70 max-[1025px]:text-[2.5vw] max-md:text-[4.2vw]">
                    {o.paragraflar.map((p) => (
                      <p key={p} className="ozellik-metin opacity-0 max-[1025px]:opacity-100">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
