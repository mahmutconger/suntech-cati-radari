"use client";

// Seçili çatıyı adreste tutar (/?bina=501234569): bağlantı paylaşılınca aynı çatı, kendi OSB'siyle açılır.
// useSearchParams yerine window: sayfa statik kalsın, Suspense gerekmesin.

import { useEffect, useRef, useState } from "react";
import { useBinaDetay, useOsblar } from "@/hooks/veri";
import { useHaritaDurumu } from "@/store/harita";

function adrestekiBina(): number | null {
  if (typeof window === "undefined") return null;
  const deger = Number(new URLSearchParams(window.location.search).get("bina"));
  return Number.isSafeInteger(deger) && deger > 0 ? deger : null;
}

export function BinaAdresi() {
  const [hedef] = useState(adrestekiBina);
  const uygulandi = useRef(hedef === null);
  const { data: detay, isError } = useBinaDetay(hedef);
  // OSB listesi beklenir: harita önce OSB'ye sığsın, sonra çatıya uçsun.
  const { isFetched: osblarGeldi } = useOsblar();
  const seciliId = useHaritaDurumu((d) => d.seciliBinaId);
  const seciliOsb = useHaritaDurumu((d) => d.seciliOsb);
  const osbSec = useHaritaDurumu((d) => d.osbSec);
  const binaSec = useHaritaDurumu((d) => d.binaSec);

  useEffect(() => {
    if (uygulandi.current || !detay || !osblarGeldi) return;
    uygulandi.current = true;
    if (detay.osb !== seciliOsb) osbSec(detay.osb); // önce OSB: osbSec seçimi sıfırlar
    binaSec(detay.id, true);
  }, [detay, osblarGeldi, seciliOsb, osbSec, binaSec]);

  useEffect(() => {
    if (isError) uygulandi.current = true; // olmayan bina: adres temizlensin
    if (!uygulandi.current) return;
    const adres = new URL(window.location.href);
    if (seciliId === null) adres.searchParams.delete("bina");
    else adres.searchParams.set("bina", String(seciliId));
    if (adres.href !== window.location.href) window.history.replaceState(null, "", `${adres.pathname}${adres.search}`);
  }, [seciliId, isError]);

  return null;
}
