// Oturum durumu (Firebase Authentication). Giriş ekranı ve Kayıtlarım bunu okur.

import { create } from "zustand";

export interface OturumKullanicisi {
  uid: string;
  eposta: string | null;
}

interface OturumDurumu {
  kullanici: OturumKullanicisi | null;
  /** Firebase ilk oturum kontrolünü bitirene kadar true. */
  yukleniyor: boolean;
  ayarla: (kullanici: OturumKullanicisi | null) => void;
}

export const useOturum = create<OturumDurumu>((set) => ({
  kullanici: null,
  yukleniyor: true,
  ayarla: (kullanici) => set({ kullanici, yukleniyor: false }),
}));
