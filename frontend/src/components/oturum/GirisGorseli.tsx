// Giriş ekranının sağ paneli: kodla çizilmiş güneş ve OSB çatıları, üstünde ürün özelliklerini anlatan cam kartlar.
// Açık tema (zemin, limon, şeftali, mercan). Yalnızca masaüstünde (md ve üstü) görünür.

import type { CSSProperties } from "react";
import { Leaf, Sun, TrendingUp, type LucideIcon } from "lucide-react";

interface Ozellik {
  baslik: string;
  metin: string;
  Ikon: LucideIcon;
}

const OZELLIKLER: Ozellik[] = [
  { baslik: "Bina bazında kWp", metin: "Her çatıya kurulabilecek güç ve yıllık üretim tahmini.", Ikon: Sun },
  { baslik: "Geri ödeme süresi", metin: "Yatırım, yıllık tasarruf ve nakit akışı tek raporda.", Ikon: TrendingUp },
  { baslik: "Önlenen CO₂", metin: "Çatınızın her yıl önleyeceği karbon salımı.", Ikon: Leaf },
];

/** Kartlar: ilki her zaman, ikincisi xl, üçüncüsü 2xl ekranda görünür. */
const KART_GORUNURLUGU = ["flex", "hidden xl:flex", "hidden 2xl:flex"];

// Sahne renkleri (paletten). SVG özniteliklerinde CSS değişkeni yerine düz değer kullanılır.
const RENK = { zemin: "#fdfdfd", limon: "#e1eb71", seftali: "#ecab69", mercan: "#e36161", murekkep: "#1c1a17" };

function OzellikKarti({ ozellik, gorunurluk, gecikme }: { ozellik: Ozellik; gorunurluk: string; gecikme: number }) {
  const { Ikon } = ozellik;
  return (
    <div
      className={`giris-kart ${gorunurluk} w-64 items-start gap-3 rounded-3xl border border-murekkep/10 bg-zemin/70 p-5 shadow-sm backdrop-blur-xl`}
      style={{ "--sira": gecikme } as CSSProperties}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-limon/60 text-murekkep">
        <Ikon className="h-5 w-5" aria-hidden />
      </div>
      <div className="text-sm leading-snug">
        <p className="font-medium text-murekkep">{ozellik.baslik}</p>
        <p className="mt-1 text-murekkep/60">{ozellik.metin}</p>
      </div>
    </div>
  );
}

/** Eğik (izometrik) bir çatı: üst yüzde güneş paneli ızgarası, önde ve yanda duvar. */
function Bina({ x, y, en, derinlik, yukseklik, vurgulu = false }: { x: number; y: number; en: number; derinlik: number; yukseklik: number; vurgulu?: boolean }) {
  // Çatı, (x, y) sol arka köşeden başlar; derinlik kadar sola-aşağı kayar (skewX -45°).
  const onSol = x - derinlik;
  const onY = y + derinlik;
  return (
    <g>
      {/* Yan duvar */}
      <polygon
        points={`${onSol + en},${onY} ${x + en},${y} ${x + en},${y + yukseklik} ${onSol + en},${onY + yukseklik}`}
        fill="#e4d9c8"
      />
      {/* Ön duvar */}
      <rect x={onSol} y={onY} width={en} height={yukseklik} fill="#f1e9dc" />
      <rect x={onSol} y={onY} width={en} height={3} fill="#ffffff" />
      {/* Çatı ve paneller */}
      <g transform={`translate(${x} ${y}) skewX(-45)`}>
        <rect width={en} height={derinlik} fill="#f7f2ea" />
        <rect x={8} y={6} width={en - 16} height={derinlik - 12} fill="url(#panel)" />
        {vurgulu && <rect width={en} height={derinlik} fill="none" stroke={RENK.mercan} strokeWidth={2.5} />}
      </g>
    </g>
  );
}

function Sahne() {
  return (
    <svg viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="gokyuzu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={RENK.zemin} />
          <stop offset="0.5" stopColor={RENK.limon} stopOpacity="0.35" />
          <stop offset="1" stopColor={RENK.seftali} stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="parilti" cx="0.72" cy="0.31" r="0.5">
          <stop offset="0" stopColor={RENK.seftali} stopOpacity="0.55" />
          <stop offset="0.5" stopColor={RENK.limon} stopOpacity="0.2" />
          <stop offset="1" stopColor={RENK.limon} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gunes" cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor={RENK.zemin} />
          <stop offset="0.45" stopColor={RENK.limon} />
          <stop offset="1" stopColor={RENK.seftali} />
        </radialGradient>
        <pattern id="panel" width="22" height="13" patternUnits="userSpaceOnUse">
          <rect width="20" height="11" fill="#2b3a55" />
          <rect width="20" height="11" fill="none" stroke="#a9bcd8" strokeOpacity="0.45" strokeWidth="0.8" />
          <path d="M0 0.5h20" stroke={RENK.limon} strokeOpacity="0.5" strokeWidth="0.8" />
        </pattern>
        <linearGradient id="alt-acma" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={RENK.zemin} stopOpacity="0" />
          <stop offset="1" stopColor={RENK.zemin} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <rect width="800" height="1000" fill={RENK.zemin} />
      <rect width="800" height="1000" fill="url(#gokyuzu)" />
      <rect width="800" height="1000" fill="url(#parilti)" />

      {/* Güneş ve radar halkaları */}
      <g stroke={RENK.mercan} fill="none">
        <circle cx="576" cy="310" r="150" strokeOpacity="0.25" strokeDasharray="2 10" />
        <circle cx="576" cy="310" r="230" strokeOpacity="0.16" strokeDasharray="2 14" />
        <circle cx="576" cy="310" r="320" strokeOpacity="0.1" />
      </g>
      <circle cx="576" cy="310" r="86" fill="url(#gunes)" />

      {/* Ufuk çizgisi */}
      <path d="M0 470 H800" stroke={RENK.murekkep} strokeOpacity="0.08" />

      {/* OSB binaları, arkadan öne */}
      <Bina x={470} y={430} en={260} derinlik={60} yukseklik={90} />
      <Bina x={130} y={450} en={220} derinlik={50} yukseklik={80} />
      <Bina x={380} y={540} en={300} derinlik={80} yukseklik={130} vurgulu />
      <Bina x={130} y={610} en={210} derinlik={70} yukseklik={150} />

      {/* Vurgulu çatıdaki radar dalgası */}
      <g transform="translate(490 580)">
        <circle r="34" fill="none" stroke={RENK.mercan} strokeWidth="2" className="radar-dalga" />
        <circle r="34" fill="none" stroke={RENK.mercan} strokeWidth="2" className="radar-dalga radar-dalga-2" />
        <circle r="6" fill={RENK.mercan} />
      </g>

      <rect y="580" width="800" height="420" fill="url(#alt-acma)" />
    </svg>
  );
}

export function GirisGorseli() {
  return (
    <section className="relative hidden p-4 md:sticky md:top-0 md:block md:h-dvh md:flex-1">
      <div className="giris-sagdan absolute inset-4 overflow-hidden rounded-3xl border border-murekkep/5">
        <Sahne />

        <div className="absolute left-8 right-8 top-8 max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mercan-koyu">Çatı Radarı</p>
          <p className="mt-2 text-2xl font-light leading-snug tracking-tight text-murekkep">
            Manisa OSB çatılarının güneş potansiyeli, bina bina.
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center gap-4 px-8">
          {OZELLIKLER.map((o, i) => (
            <OzellikKarti key={o.baslik} ozellik={o} gorunurluk={KART_GORUNURLUGU[i]} gecikme={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
