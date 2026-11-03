"use client";

import dynamic from "next/dynamic";
import { GunesYukleyici } from "@/components/ortak/GunesYukleyici";

// Leaflet `window` ister; harita yalnızca tarayıcıda yüklenir.
const Harita = dynamic(() => import("./Harita"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#f3efe6]">
      <GunesYukleyici metin="Harita yükleniyor…" boyut={104} />
    </div>
  ),
});

export function HaritaYukleyici() {
  return <Harita />;
}
