"use client";

// Sunucu verisi (TanStack Query). NEXT_PUBLIC_SAHTE_VERI=1 iken sahte veri döner;
// gerçek uçlar hazır olunca yalnızca bu bayrak kapatılır, bileşenler değişmez.
//
// §22 uçları (/osblar, /hesap/finans, GET /uydu/{id}, /uydu/{id}/goruntu) backend yayına
// alınana kadar yoksa sessizce "yok" kabul edilir; arayüz o parçayı göstermez.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api, ApiHatasi, SAHTE_VERI } from "@/lib/api";
import {
  bekle,
  SAHTE_OSBLAR,
  SAHTE_VARSAYIMLAR_YANITI,
  sahteBinaDetay,
  sahteBinaHesap,
  sahteBinalar,
  sahteFinans,
  sahteKayitEkle,
  sahteKayitListesi,
  sahteKayitSil,
  sahteSohbet,
  sahteTopluHesap,
  sahteTrafolar,
  sahteUydu,
} from "@/mocks/veri";
import { useHaritaDurumu, VARSAYILAN_OSB } from "@/store/harita";
import { useOturum } from "@/store/oturum";
import type {
  BinaDetay,
  BinaHesapIstegi,
  BinaKoleksiyonu,
  FinansYili,
  HesapSonucu,
  Kayit,
  KayitIstegi,
  Osb,
  SohbetIstegi,
  SohbetYaniti,
  TopluHesapYaniti,
  TrafoKoleksiyonu,
  Tuketim,
  UyduSonucu,
  VarsayimlarYaniti,
} from "@/types/gecici";

/** Uç henüz yayında değilse (404/405) null döner; diğer hatalar fırlatılır. */
async function yoksaNull<T>(istek: Promise<T>): Promise<T | null> {
  try {
    return await istek;
  } catch (hata) {
    if (hata instanceof ApiHatasi && (hata.durum === 404 || hata.durum === 405)) return null;
    throw hata;
  }
}

/** Manisa dışındaki OSB'lerde sorguya ?osb= eklenir; Manisa backend'in varsayılanı. */
function osbParametresi(osb: string, ayrac: "?" | "&" = "?"): string {
  return osb === VARSAYILAN_OSB ? "" : `${ayrac}osb=${encodeURIComponent(osb)}`;
}

// --- OSB'ler ---

/** GET /osblar; uç yoksa boş liste (yalnızca Manisa). */
export function useOsblar() {
  return useQuery({
    queryKey: ["osblar"],
    queryFn: async () =>
      SAHTE_VERI ? bekle(SAHTE_OSBLAR) : ((await yoksaNull(api.get<Osb[]>("/osblar"))) ?? []),
    staleTime: Infinity,
    retry: false,
  });
}

export function useSeciliOsb(): Osb | null {
  const id = useHaritaDurumu((d) => d.seciliOsb);
  const { data } = useOsblar();
  return data?.find((o) => o.id === id) ?? null;
}

// --- Varsayımlar ---

/**
 * GET /varsayimlar: backend'in bildiği varsayımlar, varsayılan değerleri ve kaynakları.
 * Store'daki varsayımlar bununla eşitlenir; yeni alanlar (ör. omur_yil) backend'e gelince kendiliğinden açılır.
 */
export function useBackendVarsayimlari() {
  return useQuery({
    queryKey: ["varsayimlar"],
    queryFn: () =>
      SAHTE_VERI ? bekle(SAHTE_VARSAYIMLAR_YANITI, 50) : api.get<VarsayimlarYaniti>("/varsayimlar"),
    staleTime: Infinity,
  });
}

/** Uygulama açılınca bir kez çalışır (Saglayicilar içinde). */
export function VarsayimEsitleyici() {
  const { data } = useBackendVarsayimlari();
  const esitle = useHaritaDurumu((d) => d.varsayimlariEsitle);
  useEffect(() => {
    if (data?.varsayimlar) esitle(data.varsayimlar);
  }, [data, esitle]);
  return null;
}

// --- Binalar ve trafolar ---

export function useBinalar() {
  const osb = useHaritaDurumu((d) => d.seciliOsb);
  return useQuery({
    queryKey: ["binalar", osb],
    queryFn: () =>
      SAHTE_VERI ? bekle(sahteBinalar(osb)) : api.get<BinaKoleksiyonu>(`/binalar${osbParametresi(osb)}`),
    staleTime: Infinity,
  });
}

export function useTrafolar(etkin: boolean) {
  const osb = useHaritaDurumu((d) => d.seciliOsb);
  return useQuery({
    queryKey: ["trafolar", osb],
    queryFn: () =>
      SAHTE_VERI
        ? bekle(sahteTrafolar(osb))
        : api.get<TrafoKoleksiyonu>(`/trafo-merkezleri${osbParametresi(osb)}`),
    enabled: etkin,
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

// --- Hesap ---

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
  const osb = useHaritaDurumu((d) => d.seciliOsb);
  return useQuery({
    queryKey: ["hesap", "toplu", osb, varsayimlar],
    queryFn: () =>
      SAHTE_VERI
        ? bekle(sahteTopluHesap(varsayimlar, osb), 150)
        : api.post<TopluHesapYaniti>("/hesap/toplu", {
            varsayimlar,
            // Gövde extra="forbid": osb alanı yalnızca Manisa dışında gider (o OSB'ler yeni backend'de var).
            ...(osb === VARSAYILAN_OSB ? {} : { osb }),
          }),
    placeholderData: keepPreviousData,
  });
}

/** bina_id → HesapSonucu eşlemesi (harita renkleri ve liste için). */
export function useHesapSozlugu(): Map<number, HesapSonucu> {
  const { data } = useTopluHesap();
  return useMemo(() => new Map((data?.sonuclar ?? []).map((s) => [s.bina_id, s])), [data]);
}

/** Toplu sonuçta uygunluk skoru var mı (Mehmet'in §22 hesabı yayında mı)? */
export function useSkorVar(): boolean {
  const { data } = useTopluHesap();
  return typeof data?.sonuclar[0]?.uygunluk_skoru === "number";
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

/** Yanıt doğrudan dizi ya da { yillar: [...] } gibi bir nesne olabilir; ilk diziyi al. */
function finansDizisi(yanit: unknown): FinansYili[] {
  if (Array.isArray(yanit)) return yanit as FinansYili[];
  if (yanit && typeof yanit === "object") {
    const dizi = Object.values(yanit).find(Array.isArray);
    if (dizi) return dizi as FinansYili[];
  }
  return [];
}

/** POST /hesap/finans/{id}: 25 yıllık nakit akışı; uç yoksa null. */
export function useFinans(id: number | null, tuketim: Tuketim | null) {
  const varsayimlar = useGeciktirilmis(useHaritaDurumu((d) => d.varsayimlar));
  return useQuery({
    queryKey: ["hesap", "finans", id, varsayimlar, tuketim],
    queryFn: async () => {
      if (SAHTE_VERI) return bekle(sahteFinans(id!, varsayimlar, tuketim), 150);
      const yanit = await yoksaNull(
        api.post<unknown>(`/hesap/finans/${id}`, { varsayimlar, yillik_tuketim_kwh: tuketim?.yillik_kwh ?? null }),
      );
      return yanit === null ? null : finansDizisi(yanit);
    },
    enabled: id !== null,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

// --- Asistan ---

export function useSohbet() {
  const varsayimlar = useHaritaDurumu((d) => d.varsayimlar);
  return useMutation({
    mutationFn: (istek: SohbetIstegi) =>
      SAHTE_VERI ? bekle(sahteSohbet(istek, varsayimlar), 700) : api.post<SohbetYaniti>("/sohbet", istek),
  });
}

// --- Uydu ---

/** GET /uydu/{id}: daha önce bakılmışsa önbellekteki sonuç (Gemini'ye gitmez); yoksa null. */
export function useUyduOnbellegi(binaId: number | null) {
  return useQuery({
    queryKey: ["uydu", binaId],
    queryFn: () =>
      SAHTE_VERI ? bekle(null as UyduSonucu | null) : yoksaNull(api.get<UyduSonucu>(`/uydu/${binaId}`)),
    enabled: binaId !== null,
    retry: false,
    staleTime: Infinity,
  });
}

/**
 * Uydu kontrolü yalnızca düğmeyle çalışır (Gemini kotası). Önce önbellek okunur;
 * düğmeyle gelen sonuç da aynı önbelleğe yazılır, aynı çatı bu oturumda tekrar sorulmaz.
 */
export function useUyduKontrolu(binaId: number) {
  const istemci = useQueryClient();
  const { data: onbellek } = useUyduOnbellegi(binaId);
  const mutasyon = useMutation({
    mutationFn: () => (SAHTE_VERI ? bekle(sahteUydu(binaId), 1500) : api.post<UyduSonucu>(`/uydu/${binaId}`)),
    onSuccess: (sonuc) => istemci.setQueryData(["uydu", binaId], sonuc),
  });
  return { ...mutasyon, sonuc: mutasyon.data ?? onbellek ?? undefined };
}

/** Raporda gösterilen çatı görüntüsü (GET /uydu/{id}/goruntu, JPEG). Sahte modda yok. */
export function uyduGoruntuAdresi(binaId: number): string | null {
  return SAHTE_VERI ? null : `/api/v1/uydu/${binaId}/goruntu`;
}

// --- Kayıtlar ---

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
