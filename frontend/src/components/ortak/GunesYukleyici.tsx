"use client";

// Yükleme ve işlem göstergesi: dönen güneş. Her turda ışınlar güneşten çıkar, güneş bir tam tur döner,
// ışınlar yeniden güneşe çekilir (animasyonlar globals.css'te, "hareketi azalt" açıkken durağan).

import { useId } from "react";

const ISIN_SAYISI = 12;

/** Yalnızca güneş. `boyut` piksel cinsinden kenar uzunluğu. */
export function GunesIkonu({ boyut = 88 }: { boyut?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={boyut} height={boyut} viewBox="-60 -60 120 120" aria-hidden className="overflow-visible">
      <defs>
        <radialGradient id={`${id}-c`} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f1f5a6" />
          <stop offset="0.45" stopColor="#e1eb71" />
          <stop offset="1" stopColor="#ecab69" />
        </radialGradient>
        <linearGradient id={`${id}-i`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ecab69" />
          <stop offset="1" stopColor="#e36161" />
        </linearGradient>
      </defs>
      <circle className="gunes-hale" r="34" fill="#e1eb71" />
      <g className="gunes-donen">
        {Array.from({ length: ISIN_SAYISI }, (_, i) => {
          const uzun = i % 2 === 0;
          return (
            <g key={i} transform={`rotate(${(360 / ISIN_SAYISI) * i})`}>
              <rect
                className="gunes-isin"
                style={{ ["--sira" as string]: i }}
                x={uzun ? -3.5 : -2.75}
                y={uzun ? -56 : -50}
                width={uzun ? 7 : 5.5}
                height={uzun ? 22 : 15}
                rx={uzun ? 3.5 : 2.75}
                fill={`url(#${id}-i)`}
              />
            </g>
          );
        })}
      </g>
      <circle
        className="gunes-cekirdek"
        r="24"
        fill={`url(#${id}-c)`}
        stroke="#1c1a17"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />
      <circle className="gunes-cekirdek" cx="-8" cy="-9" r="4.5" fill="#ffffff" fillOpacity="0.6" />
    </svg>
  );
}

/**
 * Güneş ve altında kısa açıklama, bulunduğu alanın ortasında.
 * Ekran okuyucuya "status" olarak duyurulur.
 */
export function GunesYukleyici({
  metin = "Yükleniyor…",
  boyut = 88,
  className = "",
}: {
  metin?: string;
  boyut?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}
    >
      <GunesIkonu boyut={boyut} />
      <p className="text-sm font-semibold text-murekkep/70">{metin}</p>
    </div>
  );
}
