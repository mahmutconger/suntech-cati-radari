"use client";

import dynamic from "next/dynamic";

// Leaflet `window` ister; harita yalnızca tarayıcıda yüklenir.
const Harita = dynamic(() => import("./Harita"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#f3efe6] text-sm text-murekkep/60">
      Harita yükleniyor…
    </div>
  ),
});

export function HaritaYukleyici() {
  return <Harita />;
}
