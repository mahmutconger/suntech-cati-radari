"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, type ReactNode } from "react";
import { VarsayimEsitleyici } from "@/hooks/veri";
import { firebaseAuth } from "@/lib/firebase";
import { useOturum } from "@/store/oturum";

/** Firebase oturum değişikliklerini dinler ve oturum store'una yazar. */
function OturumDinleyici() {
  const ayarla = useOturum((d) => d.ayarla);
  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) {
      ayarla(null);
      return;
    }
    return onAuthStateChanged(auth, (k) => ayarla(k ? { uid: k.uid, eposta: k.email } : null));
  }, [ayarla]);
  return null;
}

export function Saglayicilar({ children }: { children: ReactNode }) {
  const [istemci] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <QueryClientProvider client={istemci}>
      <OturumDinleyici />
      <VarsayimEsitleyici />
      {children}
    </QueryClientProvider>
  );
}
