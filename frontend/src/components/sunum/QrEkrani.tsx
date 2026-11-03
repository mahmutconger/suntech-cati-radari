"use client";

// Sunumda projeksiyona yansıtılan QR ekranı: jüri telefonuyla okutup siteyi açar.
// Adres NEXT_PUBLIC_SITE_URL ile sabitlenebilir; verilmezse sayfanın açıldığı adres kullanılır.

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const SABIT_ADRES = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

const abonelikYok = () => () => {};

function useAdres(): string | null {
  const tarayiciAdresi = useSyncExternalStore(
    abonelikYok,
    () => window.location.origin,
    () => null,
  );
  return SABIT_ADRES ?? tarayiciAdresi;
}

export function QrEkrani() {
  const adres = useAdres();
  const gorunenAdres = adres?.replace(/^https?:\/\//, "");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-slate-950 p-6 text-center">
      <div className="space-y-2">
        <p className="text-4xl font-bold tracking-tight text-amber-300 md:text-6xl">☀️ Çatı Radarı</p>
        <p className="text-lg text-slate-300 md:text-2xl">Manisa OSB çatılarının güneş potansiyeli, bina bazında</p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-2xl md:p-8">
        {adres ? (
          <QRCodeSVG
            value={adres}
            size={512}
            level="M"
            marginSize={0}
            title={`Çatı Radarı: ${gorunenAdres}`}
            className="h-[min(70vw,52vh)] w-[min(70vw,52vh)]"
          />
        ) : (
          <div className="h-[min(70vw,52vh)] w-[min(70vw,52vh)]" />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-2xl font-semibold text-slate-50 md:text-4xl">Telefonunuzdan açabilirsiniz</p>
        {gorunenAdres && <p className="font-mono text-lg text-amber-200 md:text-2xl">{gorunenAdres}</p>}
        <p className="text-sm text-slate-400 md:text-base">
          Bildiğiniz bir fabrikayı arayın, çatısının ne kazandıracağını görün. Ana ekrana ekleyip uygulama gibi
          kullanabilirsiniz.
        </p>
      </div>

      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← Haritaya dön
      </Link>
    </main>
  );
}
