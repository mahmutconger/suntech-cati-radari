"use client";

// Sunucu verisi (TanStack Query). NEXT_PUBLIC_SAHTE_VERI=1 iken sahte veri döner;
// gerçek uçlar hazır olunca yalnızca bu bayrak kapatılır, bileşenler değişmez.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api, SAHTE_VERI } from "@/lib/api";
import {
  bekle,
  SAHTE_BINALAR,
  sahteBinaDetay,
  sahteBinaHesap,
  sahteKayitEkle,
  sahteKayitListesi,
  sahteKayitSil,
  sahteSohbet,
  sahteTopluHesap,
} from "@/mocks/veri";
import { useHaritaDurumu } from "@/store/harita";
import { useOturum } from "@/store/oturum";
import type {
  BinaDetay,
  BinaHesapIstegi,
  BinaKoleksiyonu,
  HesapSonucu,
  Kayit,
  KayitIstegi,
  SohbetIstegi,
  SohbetYaniti,
  TopluHesapYaniti,
  Tuketim,
} from "@/types/gecici";

/** OSB'deki bütün binalar (~600). Backend bbox filtresi uygulamıyor, hepsini döndürüyor. */
export function useBinalar() {
  return useQuery({
    queryKey: ["binalar"],
    queryFn: () => (SAHTE_VERI ? bekle(SAHTE_BINALAR) : api.get<BinaKoleksiyonu>("/binalar")),
    staleTime: Infinity,
  });
}

export function useBinaDetay(id: number | null) {
  return useQuery({
    queryKey: ["bina", id],
    queryFn: () => (SAHTE_VERI ? bekle(sahteBinaDetay(id!), 120) : api.get<BinaDetay>(`/binalar/${id}`)),
    enabled: id !== null,
    staleTime: Infinity,
  });
}

/** Değeri `ms` boyunca değişmezse döndürür (kaydırıcılar için 300 ms). */
export function useGeciktirilmis<T>(deger: T, ms = 300): T {
  const [gecikmeli, setGecikmeli] = useState(deger);
  useEffect(() => {
    const zamanlayici = setTimeout(() => setGecikmeli(deger), ms);
    return () => clearTimeout(zamanlayici);
  }, [deger, ms]);
  return gecikmeli;
}

export function useTopluHesap() {
  const varsayimlar = useGeciktirilmis(useHaritaDurumu((d) => d.varsayimlar));
  return useQuery({
    queryKey: ["hesap", "toplu", varsayimlar],
    queryFn: () =>
      SAHTE_VERI
        ? bekle(sahteTopluHesap(varsayimlar), 150)
        : api.post<TopluHesapYaniti>("/hesap/toplu", { varsayimlar }),
    placeholderData: keepPreviousData,
  });
}

/** bina_id → HesapSonucu eşlemesi (harita renkleri ve liste için). */
export function useHesapSozlugu(): Map<number, HesapSonucu> {
  const { data } = useTopluHesap();
  return useMemo(() => new Map((data?.sonuclar ?? []).map((s) => [s.bina_id, s])), [data]);
}

/** Tek binanın hesabı; firma tüketim girdiyse sistem tüketime göre boyutlanır. */
export function useBinaHesabi(id: number | null, tuketim: Tuketim | null) {
  const varsayimlar = useGeciktirilmis(useHaritaDurumu((d) => d.varsayimlar));
  const tuketimGecikmeli = useGeciktirilmis(tuketim, 400);
  return useQuery({
    queryKey: ["hesap", "bina", id, varsayimlar, tuketimGecikmeli],
    queryFn: () =>
      SAHTE_VERI
        ? bekle(sahteBinaHesap(id!, varsayimlar, tuketimGecikmeli), 120)
        : api.post<HesapSonucu>(`/hesap/bina/${id}`, {
            varsayimlar,
            yillik_tuketim_kwh: tuketimGecikmeli?.yillik_kwh ?? null,
          } satisfies BinaHesapIstegi),
    enabled: id !== null,
    placeholderData: keepPreviousData,
  });
}

export function useSohbet() {
  const varsayimlar = useHaritaDurumu((d) => d.varsayimlar);
  return useMutation({
    mutationFn: (istek: SohbetIstegi) =>
      SAHTE_VERI ? bekle(sahteSohbet(istek, varsayimlar), 700) : api.post<SohbetYaniti>("/sohbet", istek),
  });
}

export function useKayitlar() {
  const uid = useOturum((d) => d.kullanici?.uid ?? null);
  return useQuery({
    queryKey: ["kayitlar", uid],
    queryFn: () => (SAHTE_VERI ? bekle(sahteKayitListesi()) : api.get<Kayit[]>("/kayitlar")),
    enabled: uid !== null,
  });
}

export function useKaydet() {
  const istemci = useQueryClient();
  return useMutation({
    mutationFn: (istek: KayitIstegi) =>
      SAHTE_VERI ? bekle(sahteKayitEkle(istek)) : api.post<Kayit>("/kayitlar", istek),
    onSuccess: () => istemci.invalidateQueries({ queryKey: ["kayitlar"] }),
  });
}

export function useKayitSil() {
  const istemci = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      SAHTE_VERI ? bekle(sahteKayitSil(id)) : api.sil<void>(`/kayitlar/${id}`),
    onSuccess: () => istemci.invalidateQueries({ queryKey: ["kayitlar"] }),
  });
}
