import type { Metadata } from "next";
import Link from "next/link";
import { KayitlarListesi } from "@/components/oturum/KayitlarListesi";

export const metadata: Metadata = { title: "Kayıtlarım · Çatı Radarı" };

export default function KayitlarimSayfasi() {
  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
            ← Haritaya dön
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-50">Kayıtlarım</h1>
          <p className="text-sm text-slate-400">Kaydettiğiniz analizleri yalnızca siz görürsünüz.</p>
        </div>
        <KayitlarListesi />
      </div>
    </main>
  );
}
