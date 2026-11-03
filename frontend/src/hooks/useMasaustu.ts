"use client";

import { useSyncExternalStore } from "react";

const SORGU = "(min-width: 768px)";

function abone(degisti: () => void) {
  const mq = window.matchMedia(SORGU);
  mq.addEventListener("change", degisti);
  return () => mq.removeEventListener("change", degisti);
}

/** Tailwind `md` kırılımı ve üstü. Sunucuda null döner (henüz bilinmiyor). */
export function useMasaustu(): boolean | null {
  return useSyncExternalStore(
    abone,
    () => window.matchMedia(SORGU).matches,
    () => null,
  );
}
