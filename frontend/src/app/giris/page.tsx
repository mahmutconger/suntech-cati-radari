import type { Metadata } from "next";
import { Suspense } from "react";
import { GunesYukleyici } from "@/components/ortak/GunesYukleyici";
import { GirisFormu } from "@/components/oturum/GirisFormu";
import { GirisGorseli } from "@/components/oturum/GirisGorseli";

export const metadata: Metadata = { title: "Giriş · Çatı Radarı" };

export default function GirisSayfasi() {
  return (
    <main className="flex min-h-dvh w-full flex-col bg-zemin md:flex-row">
      {/* Sol sütun: form */}
      <section className="flex flex-1 items-center justify-center p-8">
        {/* ?sonra= ve ?mod= istemcide okunur; Suspense ile sayfanın geri kalanı önceden hazırlanır. */}
        <Suspense fallback={<GunesYukleyici />}>
          <GirisFormu />
        </Suspense>
      </section>

      {/* Sağ sütun: görsel ve özellik kartları (yalnızca masaüstü) */}
      <GirisGorseli />
    </main>
  );
}
