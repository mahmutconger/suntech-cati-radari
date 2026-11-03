"use client";

// Sunumda projeksiyona yansıtılan QR ekranı: jüri telefonuyla okutup siteyi açar.
// Adres NEXT_PUBLIC_SITE_URL ile sabitlenebilir; verilmezse sayfanın açıldığı adres kullanılır.

import { QRCodeSVG } from "qrcode.react";
import { GeriDugmesi } from "@/components/ortak/GeriDugmesi";
import { Logo } from "@/components/ortak/Logo";
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
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-gradient-to-br from-zemin via-limon/25 to-seftali/40 p-6 text-center">
      <div className="absolute left-4 top-4 md:left-8 md:top-8">
        <GeriDugmesi etiket="Haritaya dön" href="/" />
      </div>
      <div className="flex flex-col items-center space-y-3">
        <div className="origin-center scale-150 md:scale-[2]">
          <Logo />
        </div>
        <p className="pt-4 text-lg text-murekkep/70 md:pt-8 md:text-2xl">Manisa OSB çatılarının güneş potansiyeli, bina bazında</p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-2xl ring-4 ring-limon/60 md:p-8">
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
        <p className="text-2xl font-semibold text-murekkep md:text-4xl">Telefonunuzdan açabilirsiniz</p>
        {gorunenAdres && <p className="font-mono text-lg font-semibold text-mercan-koyu md:text-2xl">{gorunenAdres}</p>}
        <p className="text-sm text-murekkep/60 md:text-base">
          Bildiğiniz bir fabrikayı arayın, çatısının ne kazandıracağını görün. Ana ekrana ekleyip uygulama gibi
          kullanabilirsiniz.
        </p>
      </div>
    </main>
  );
}
