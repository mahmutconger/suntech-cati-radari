"use client";

// Sunucu verisi (TanStack Query). NEXT_PUBLIC_SAHTE_VERI=1 iken sahte veri döner;
// gerçek uçlar hazır olunca yalnızca bu bayrak kapatılır, bileşenler değişmez.

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api, SAHTE_VERI } from "@/lib/api";
import { OSB_SINIR_KUTUSU as K } from "@/lib/sabitler";
import { bekle, SAHTE_BINALAR, sahteTopluHesap } from "@/mocks/veri";
import { useHaritaDurumu } from "@/store/harita";
import type { BinaKoleksiyonu, HesapSonucu, TopluHesapYaniti, Varsayimlar } from "@/types/gecici";

const BBOX = `${K.bati},${K.guney},${K.dogu},${K.kuzey}`;

export function useBinalar() {
  return useQuery({
    queryKey: ["binalar", BBOX],
    queryFn: () =>
      SAHTE_VERI ? bekle(SAHTE_BINALAR) : api.get<BinaKoleksiyonu>(`/binalar?bbox=${BBOX}`),
    staleTime: Infinity,
  });
}

/** Değeri `ms` boyunca değişmezse döndürür (kaydırıcılar için 300 ms). */
function useGeciktirilmis<T>(deger: T, ms = 300): T {
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
        : api.post<TopluHesapYaniti>("/hesap/toplu", { varsayimlar } satisfies { varsayimlar: Varsayimlar }),
    placeholderData: keepPreviousData,
  });
}

/** bina_id → HesapSonucu eşlemesi (harita renkleri ve kart için). */
export function useHesapSozlugu(): Map<number, HesapSonucu> {
  const { data } = useTopluHesap();
  return useMemo(() => new Map((data?.sonuclar ?? []).map((s) => [s.bina_id, s])), [data]);
}
