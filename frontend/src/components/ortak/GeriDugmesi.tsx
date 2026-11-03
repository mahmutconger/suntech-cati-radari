"use client";

// iOS 26 tarzı geri düğmesi: cam daire içinde kalın sol ok (SF Symbols "chevron.left" karşılığı).
// href verilirse bağlantı, onClick verilirse düğme olur.

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const SINIF =
  "cam inline-flex shrink-0 items-center justify-center rounded-full text-murekkep transition-transform hover:scale-[1.04] active:scale-95";

interface Ozellikler {
  etiket: string;
  href?: string;
  onClick?: () => void;
  /** Piksel cinsinden kenar; başlıktaki diğer alanlarla aynı yükseklik. */
  boyut?: "orta" | "buyuk";
}

export function GeriDugmesi({ etiket, href, onClick, boyut = "buyuk" }: Ozellikler) {
  const olcu = boyut === "buyuk" ? "h-12 w-12" : "h-10 w-10";
  const ikon = <ChevronLeft className={boyut === "buyuk" ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2.6} aria-hidden />;
  if (href) {
    return (
      <Link href={href} aria-label={etiket} title={etiket} className={`${SINIF} ${olcu}`}>
        {ikon}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={etiket} title={etiket} className={`${SINIF} ${olcu}`}>
      {ikon}
    </button>
  );
}
