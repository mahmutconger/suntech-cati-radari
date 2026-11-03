import type { Metadata } from "next";
import { Suspense } from "react";
import { GirisFormu } from "@/components/oturum/GirisFormu";

export const metadata: Metadata = { title: "Giriş · Çatı Radarı" };

export default function GirisSayfasi() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 p-4">
      {/* ?sonra= parametresi istemcide okunur; Suspense ile sayfanın geri kalanı önceden hazırlanır. */}
      <Suspense fallback={<p className="text-sm text-slate-400">Yükleniyor…</p>}>
        <GirisFormu />
      </Suspense>
    </main>
  );
}
