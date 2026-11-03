"use client";

// Haritanın ortasında yükleme ve uzun işlem göstergesi (dönen güneş): çatılar yüklenirken,
// OSB'nin ilk hesabı yapılırken ve Gemini uydu görüntüsüne bakarken. Haritayı kilitlemez.

import { useIsMutating } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { GunesYukleyici } from "@/components/ortak/GunesYukleyici";
import { useBinalar, useTopluHesap } from "@/hooks/veri";

export function IslemGostergesi() {
  const binalar = useBinalar();
  const toplu = useTopluHesap();
  const uydu = useIsMutating({ mutationKey: ["uydu"] });

  const metin = binalar.isPending
    ? "Çatılar yükleniyor…"
    : uydu > 0
      ? "Gemini uydu görüntüsüne bakıyor…"
      : toplu.isPending
        ? "OSB hesaplanıyor…"
        : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[950] flex items-center justify-center p-6">
      <AnimatePresence>
        {metin && (
          <motion.div
            key="islem"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: 0.12, duration: 0.3 } }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
            className="cam rounded-3xl px-8 py-6"
          >
            <GunesYukleyici metin={metin} boyut={104} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
