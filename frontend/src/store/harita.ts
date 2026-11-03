// Arayüz durumu (Zustand). Sunucu verisi burada tutulmaz; o TanStack Query'de.

import { create } from "zustand";
import { BOLUM_SEKMESI, type Bolum, type CatiSekmesi, type OsbSekmesi } from "@/lib/bolumler";
import { VARSAYILAN_VARSAYIMLAR, type KatmanTuru } from "@/lib/sabitler";
import type { Tuketim, Varsayimlar } from "@/types/gecici";

export type CekmeceDurumu = "kapali" | "yarim" | "tam";
export type RenkModu = "tasarruf" | "skor";

export const VARSAYILAN_OSB = "manisa";

interface HaritaDurumu {
  seciliOsb: string;
  seciliBinaId: number | null;
  katman: KatmanTuru;
  renkModu: RenkModu;
  cekmece: CekmeceDurumu;
  /**
   * Hesap isteklerine giden varsayımlar. Anahtarları her zaman backend'in bildiği alanlardır
   * (GET /varsayimlar ile eşitlenir); backend `extra="forbid"` olduğu için fazladan alan 422 verir.
   * Mehmet'in SimulasyonPaneli de bu nesneyi olduğu gibi gönderir.
   */
  varsayimlar: Varsayimlar;
  /** Backend'in varsayılanları; "Varsayılana dön" buna döner. */
  varsayilanlar: Varsayimlar;
  /** Haritanın uçacağı bina; arama ya da listeden seçimde dolar, harita uçunca temizlenir. */
  odaklanilacakBinaId: number | null;
  /** Firmanın bina başına girdiği yıllık tüketim. */
  tuketimler: Record<number, Tuketim>;
  sohbetAcik: boolean;
  trafoKatmani: boolean;
  /**
   * Haritadaki bina düğmeleriyle panelde gidilen bölüm. `sayac` her basışta artar;
   * aynı düğmeye yeniden basınca panel yine o bölüme kayar ve vurgu tekrar oynar.
   */
  odak: { bolum: Bolum; sayac: number } | null;
  /** Masaüstü yan panel geniş mi (çentik düğmesi). */
  panelGenis: boolean;
  /**
   * Başlık düğmeleri yalnızca ikon mu. Panel genişlerken hemen, daralırken panel animasyonu bitince
   * kapanır; böylece yazılar ve tek satır düzeni, başlığa yer açılmadan geri gelmez.
   */
  baslikDar: boolean;
  catiSekmesi: CatiSekmesi;
  osbSekmesi: OsbSekmesi;

  osbSec: (osb: string) => void;
  binaSec: (id: number | null, odaklan?: boolean) => void;
  odaklanmaBitti: () => void;
  katmanDegistir: (katman: KatmanTuru) => void;
  renkModuAyarla: (mod: RenkModu) => void;
  cekmeceAyarla: (durum: CekmeceDurumu) => void;
  varsayimGuncelle: (degisiklik: Partial<Varsayimlar>) => void;
  varsayimlariSifirla: () => void;
  /** Backend'in varsayılanlarıyla eşitle: bilinmeyen alanları at, yenilerini ekle, kullanıcı değerlerini koru. */
  varsayimlariEsitle: (backend: Varsayimlar) => void;
  tuketimAyarla: (binaId: number, tuketim: Tuketim | null) => void;
  sohbetAyarla: (acik: boolean) => void;
  trafoKatmaniAyarla: (acik: boolean) => void;
  /** Paneli ilgili bölüme kaydırır; telefonda çekmeceyi tam açar. */
  bolumeGit: (bolum: Bolum) => void;
  panelGenisAyarla: (genis: boolean) => void;
  catiSekmesiSec: (sekme: CatiSekmesi) => void;
  osbSekmesiSec: (sekme: OsbSekmesi) => void;
}

/** Panelin genişleme/daralma süresi (globals.css'teki --panel-gecis ile aynı). */
export const PANEL_GECIS_MS = 520;
let baslikZamanlayici: ReturnType<typeof setTimeout> | undefined;

/** Yalnızca `ornek`te olan anahtarları tutar. */
function suz(kaynak: Partial<Varsayimlar>, ornek: Varsayimlar): Partial<Varsayimlar> {
  return Object.fromEntries(
    Object.entries(kaynak).filter(([k, v]) => k in ornek && typeof v === "number" && Number.isFinite(v)),
  );
}

export const useHaritaDurumu = create<HaritaDurumu>((set) => ({
  seciliOsb: VARSAYILAN_OSB,
  seciliBinaId: null,
  katman: "uydu",
  renkModu: "tasarruf",
  cekmece: "kapali",
  varsayimlar: VARSAYILAN_VARSAYIMLAR,
  varsayilanlar: VARSAYILAN_VARSAYIMLAR,
  odaklanilacakBinaId: null,
  tuketimler: {},
  sohbetAcik: false,
  trafoKatmani: false,
  odak: null,
  panelGenis: false,
  baslikDar: false,
  catiSekmesi: "ozet",
  osbSekmesi: "ozet",

  osbSec: (seciliOsb) =>
    set({ seciliOsb, seciliBinaId: null, odaklanilacakBinaId: null, cekmece: "kapali", odak: null }),
  binaSec: (id, odaklan = false) =>
    set((d) => ({
      seciliBinaId: id,
      odaklanilacakBinaId: odaklan ? id : null,
      cekmece: id === null ? "kapali" : "yarim",
      // Başka binaya geçince bölüm vurgusu sıfırlanır.
      odak: id !== null && id === d.seciliBinaId ? d.odak : null,
    })),
  odaklanmaBitti: () => set({ odaklanilacakBinaId: null }),
  katmanDegistir: (katman) => set({ katman }),
  renkModuAyarla: (renkModu) => set({ renkModu }),
  cekmeceAyarla: (cekmece) => set({ cekmece }),
  varsayimGuncelle: (degisiklik) =>
    set((d) => ({ varsayimlar: { ...d.varsayimlar, ...suz(degisiklik, d.varsayimlar) } })),
  varsayimlariSifirla: () => set((d) => ({ varsayimlar: d.varsayilanlar })),
  varsayimlariEsitle: (backend) =>
    set((d) => {
      // Kullanıcı bir değeri değiştirdiyse (varsayılandan farklıysa) korunur.
      const korunan = Object.fromEntries(
        Object.entries(d.varsayimlar).filter(
          ([k, v]) => k in backend && v !== d.varsayilanlar[k as keyof Varsayimlar],
        ),
      );
      return { varsayilanlar: backend, varsayimlar: { ...backend, ...korunan } };
    }),
  tuketimAyarla: (binaId, tuketim) =>
    set((d) => {
      const tuketimler = { ...d.tuketimler };
      if (tuketim) tuketimler[binaId] = tuketim;
      else delete tuketimler[binaId];
      return { tuketimler };
    }),
  sohbetAyarla: (sohbetAcik) => set({ sohbetAcik }),
  trafoKatmaniAyarla: (trafoKatmani) => set({ trafoKatmani }),
  bolumeGit: (bolum) =>
    set((d) => ({
      odak: { bolum, sayac: (d.odak?.sayac ?? 0) + 1 },
      catiSekmesi: BOLUM_SEKMESI[bolum],
      cekmece: "tam",
    })),
  panelGenisAyarla: (panelGenis) => {
    clearTimeout(baslikZamanlayici);
    if (panelGenis) {
      set({ panelGenis, baslikDar: true });
      return;
    }
    set({ panelGenis });
    baslikZamanlayici = setTimeout(() => {
      if (!useHaritaDurumu.getState().panelGenis) set({ baslikDar: false });
    }, PANEL_GECIS_MS);
  },
  catiSekmesiSec: (catiSekmesi) => set({ catiSekmesi }),
  osbSekmesiSec: (osbSekmesi) => set({ osbSekmesi }),
}));
