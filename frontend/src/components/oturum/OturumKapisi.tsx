"use client";

// Giriş zorunlu sayfaların kapısı. Oturum yoksa ilk ziyarette tanıtıma, sonraki ziyaretlerde girişe gönderir.
// Not: Bu bir arayüz kuralıdır; korunan veriler backend'de Firebase token'ıyla ayrıca denetlenir.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { GunesYukleyici } from "@/components/ortak/GunesYukleyici";
import { tanitimGoruldu } from "@/lib/tanitim";
import { girisAdresi } from "@/lib/yonlendirme";
import { useOturum } from "@/store/oturum";

export function OturumKapisi({ children }: { children: ReactNode }) {
  const { kullanici, yukleniyor } = useOturum();
  const router = useRouter();
  const yol = usePathname();

  useEffect(() => {
    if (yukleniyor || kullanici) return;
    router.replace(tanitimGoruldu() ? girisAdresi(yol) : `/tanitim?${new URLSearchParams({ sonra: yol })}`);
  }, [kullanici, yukleniyor, router, yol]);

  if (!kullanici) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gradient-to-br from-zemin via-zemin to-limon/30">
        <GunesYukleyici metin="Yükleniyor…" boyut={104} />
      </div>
    );
  }
  return children;
}
