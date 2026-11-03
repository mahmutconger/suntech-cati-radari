// Arayüz durumu (Zustand). Sunucu verisi burada tutulmaz; o TanStack Query'de.

import { create } from "zustand";
import { VARSAYILAN_VARSAYIMLAR, type KatmanTuru } from "@/lib/sabitler";
import type { Tuketim, Varsayimlar } from "@/types/gecici";

export type CekmeceDurumu = "kapali" | "yarim" | "tam";

interface HaritaDurumu {
  seciliBinaId: number | null;
  katman: KatmanTuru;
  cekmece: CekmeceDurumu;
  varsayimlar: Varsayimlar;
  /** Haritanın uçacağı bina; arama ya da listeden seçimde dolar, harita uçunca temizlenir. */
  odaklanilacakBinaId: number | null;
  /** Firmanın bina başına girdiği yıllık tüketim. */
  tuketimler: Record<number, Tuketim>;
  sohbetAcik: boolean;
  trafoKatmani: boolean;

  binaSec: (id: number | null, odaklan?: boolean) => void;
  odaklanmaBitti: () => void;
  katmanDegistir: (katman: KatmanTuru) => void;
  cekmeceAyarla: (durum: CekmeceDurumu) => void;
  varsayimGuncelle: (degisiklik: Partial<Varsayimlar>) => void;
  varsayimlariSifirla: () => void;
  tuketimAyarla: (binaId: number, tuketim: Tuketim | null) => void;
  sohbetAyarla: (acik: boolean) => void;
  trafoKatmaniAyarla: (acik: boolean) => void;
}

export const useHaritaDurumu = create<HaritaDurumu>((set) => ({
  seciliBinaId: null,
  katman: "uydu",
  cekmece: "kapali",
  varsayimlar: VARSAYILAN_VARSAYIMLAR,
  odaklanilacakBinaId: null,
  tuketimler: {},
  sohbetAcik: false,
  trafoKatmani: false,

  binaSec: (id, odaklan = false) =>
    set({
      seciliBinaId: id,
      odaklanilacakBinaId: odaklan ? id : null,
      cekmece: id === null ? "kapali" : "yarim",
    }),
  odaklanmaBitti: () => set({ odaklanilacakBinaId: null }),
  katmanDegistir: (katman) => set({ katman }),
  cekmeceAyarla: (cekmece) => set({ cekmece }),
  varsayimGuncelle: (degisiklik) => set((d) => ({ varsayimlar: { ...d.varsayimlar, ...degisiklik } })),
  varsayimlariSifirla: () => set({ varsayimlar: VARSAYILAN_VARSAYIMLAR }),
  tuketimAyarla: (binaId, tuketim) =>
    set((d) => {
      const tuketimler = { ...d.tuketimler };
      if (tuketim) tuketimler[binaId] = tuketim;
      else delete tuketimler[binaId];
      return { tuketimler };
    }),
  sohbetAyarla: (sohbetAcik) => set({ sohbetAcik }),
  trafoKatmaniAyarla: (trafoKatmani) => set({ trafoKatmani }),
}));
