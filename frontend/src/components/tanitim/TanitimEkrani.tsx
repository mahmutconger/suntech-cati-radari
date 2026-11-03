"use client";

// İlk kez gelen kullanıcı için tanıtım ekranı (21st.dev "Hero 2" tasarımından uyarlandı).
// Açık tema: zemin #FDFDFD, vurgular sırasıyla limon, şeftali, mercan. Buradan giriş ya da kayda geçilir.

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { tanitimiGorulduSay } from "@/lib/tanitim";
import { girisAdresi } from "@/lib/yonlendirme";
import { YatayOzellikSeridi } from "./YatayOzellikSeridi";

/**
 * Ürün görseli: uygulamanın ekran görüntüsü public/tanitim/ altına konunca yolunu buraya yazın
 * (ör. "/tanitim/uygulama.png"). null iken hero bölümünde görsel gösterilmez.
 */
const ONIZLEME_GORSELI: string | null = null;

function Logo() {
  return (
    <div className="flex items-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-murekkep text-limon">
        <Sun className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <span className="ml-2 text-xl font-bold text-murekkep">Çatı Radarı</span>
    </div>
  );
}

const ANA_DUGME =
  "inline-flex h-12 items-center justify-center rounded-full bg-limon px-8 text-base font-medium text-murekkep transition-colors hover:bg-limon/80";
const IKINCIL_DUGME =
  "inline-flex h-12 items-center justify-center rounded-full border border-murekkep/20 px-8 text-base font-medium text-murekkep transition-colors hover:bg-murekkep/5";

export function TanitimEkrani({ sonra }: { sonra: string }) {
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
  const giris = girisAdresi(sonra);
  const kayit = girisAdresi(sonra, "kayit");

  // Bir kez görülen tanıtım bir sonraki ziyarette atlanır; kullanıcı doğrudan girişe gider.
  useEffect(() => tanitimiGorulduSay(), []);

  const menu = [
    { etiket: "Özellikler", adres: "#ozellikler" },
    { etiket: "Hesap yöntemi", adres: "/varsayimlar" },
    { etiket: "Hesap oluştur", adres: kayit },
  ];

  return (
    <>
      <div className="relative min-h-dvh overflow-hidden bg-zemin">
        {/* Gren dokulu degrade arka plan */}
        <div className="absolute -right-60 -top-10 z-0 flex flex-col items-end blur-xl">
          <div className="z-1 h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-seftali to-mercan blur-[6rem]" />
          <div className="z-1 h-[10rem] w-[90rem] rounded-full bg-gradient-to-b from-limon to-seftali blur-[6rem]" />
          <div className="z-1 h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-limon to-limon/40 blur-[6rem]" />
        </div>
        <div className="bg-noise absolute inset-0 z-0 opacity-30" />
        <CatiSiluetleri />

        <div className="relative z-10">
          {/* Üst menü */}
          <nav className="container mx-auto mt-6 flex items-center justify-between px-4 py-4">
            <Logo />

            <div className="hidden items-center space-x-6 md:flex">
              <div className="flex items-center space-x-6">
                {menu.map((m) => (
                  <Link
                    key={m.etiket}
                    href={m.adres}
                    className="text-sm text-murekkep/70 transition-colors hover:text-murekkep"
                  >
                    {m.etiket}
                  </Link>
                ))}
              </div>
              <Link href={giris} className={ANA_DUGME}>
                Giriş yap
              </Link>
            </div>

            <button
              type="button"
              className="md:hidden"
              onClick={() => setMobilMenuAcik(!mobilMenuAcik)}
              aria-expanded={mobilMenuAcik}
            >
              <span className="sr-only">Menüyü aç ya da kapat</span>
              {mobilMenuAcik ? <X className="h-6 w-6 text-murekkep" /> : <Menu className="h-6 w-6 text-murekkep" />}
            </button>
          </nav>

          {/* Telefon menüsü: yukarıdan kayarak açılır */}
          <AnimatePresence>
            {mobilMenuAcik && (
              <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-50 flex flex-col bg-zemin/95 p-4 backdrop-blur md:hidden"
              >
                <div className="flex items-center justify-between">
                  <Logo />
                  <button type="button" onClick={() => setMobilMenuAcik(false)} aria-label="Menüyü kapat">
                    <X className="h-6 w-6 text-murekkep" />
                  </button>
                </div>
                <div className="mt-8 flex flex-col space-y-6">
                  {menu.map((m) => (
                    <Link
                      key={m.etiket}
                      href={m.adres}
                      onClick={() => setMobilMenuAcik(false)}
                      className="flex items-center justify-between border-b border-murekkep/10 pb-2 text-lg text-murekkep"
                    >
                      <span>{m.etiket}</span>
                      <ArrowRight className="h-4 w-4 text-murekkep/40" />
                    </Link>
                  ))}
                  <div className="pt-4">
                    <Link href={giris} className={`${IKINCIL_DUGME} w-full`}>
                      Giriş yap
                    </Link>
                  </div>
                  <Link href={kayit} className={ANA_DUGME}>
                    Ücretsiz hesap oluşturun
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rozet */}
          <Link
            href={kayit}
            className="mx-auto mt-6 flex max-w-fit items-center justify-center space-x-2 rounded-full bg-murekkep/5 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-murekkep/10"
          >
            <span className="text-sm font-medium text-murekkep">Manisa, Muradiye ve Salihli OSB&apos;leri hazır</span>
            <ArrowRight className="h-4 w-4 text-mercan" />
          </Link>

          {/* Ana bölüm */}
          <div className="container mx-auto mt-12 px-4 text-center">
            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-murekkep md:text-6xl lg:text-7xl">
              Çatınızın güneş potansiyelini bina bina görün
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-murekkep/60">
              Manisa OSB&apos;lerindeki her çatı için kurulabilecek güç, yıllık üretim, tasarruf, geri ödeme süresi ve
              önlenen CO₂ tek ekranda.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link href={kayit} className={ANA_DUGME}>
                Ücretsiz hesap oluşturun
              </Link>
              <Link href={giris} className={IKINCIL_DUGME}>
                Giriş yapın
              </Link>
            </div>

            {ONIZLEME_GORSELI && (
              <div className="relative mx-auto my-20 w-full max-w-6xl">
                <div className="bg-grainy absolute inset-0 rounded bg-seftali opacity-20 shadow-lg blur-[10rem]" />
                {/* eslint-disable-next-line @next/next/no-img-element -- tasarımdaki gibi düz görsel */}
                <img
                  src={ONIZLEME_GORSELI}
                  alt="Çatı Radarı harita ekranı"
                  className="relative h-auto w-full rounded shadow-md grayscale-100"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yatay kayan özellik şeridi. Sabitlenen (sticky) yapı overflow-hidden içinde çalışmadığı için
        hero'nun dışında, kardeş bölüm olarak duruyor. */}
      <div id="ozellikler" className="scroll-mt-0 bg-zemin">
        <div className="container mx-auto px-4 pb-10 pt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mercan">Neler yapıyor</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-bold leading-tight text-murekkep md:text-5xl">
            Haritadan rapora, dört adımda karar
          </h2>
        </div>
        <YatayOzellikSeridi />
      </div>

      {/* Kapanış çağrısı */}
      <section className="relative overflow-hidden bg-murekkep px-4 py-24 text-center text-zemin">
        <div className="absolute -bottom-24 left-1/2 h-48 w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-limon via-seftali to-mercan opacity-40 blur-[6rem]" />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold leading-tight md:text-5xl">Fabrikanızın çatısı ne kadar kazandırır?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zemin/70">
            Haritayı açın, çatınızı seçin, yıllık tüketiminizi girin. Ön fizibilite raporu bir dakika içinde hazır.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={kayit} className={ANA_DUGME}>
              Ücretsiz hesap oluşturun
            </Link>
            <Link
              href={giris}
              className="inline-flex h-12 items-center justify-center rounded-full border border-zemin/25 px-8 text-base font-medium text-zemin transition-colors hover:bg-zemin/10"
            >
              Giriş yapın
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function CatiSiluetleri() {
  return (
    <div className="absolute inset-0 z-[1] overflow-hidden opacity-[0.07]" aria-hidden>
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Fabrika çatı siluetleri */}
        <path
          d="M0 520V380l120-40 80 20 60-60 100 30 40-50 80 40 60-30 100 50 80-20 60 30 40-40 100 20 60-30 80 40 60-20 100 30 80-50 60 40 40-30 100 50v150z"
          fill="currentColor"
          className="text-murekkep"
        />
        <path
          d="M0 520V420l140-30 100 20 80-40 60 30 120-50 80 20 40-30 100 40 80-20 60 30 100-40 80 20 60-30 40 20 100-40 80 30 60-20v140z"
          fill="currentColor"
          className="text-murekkep/80"
        />

        {/* Güneş paneli ızgaraları - sol bina */}
        <g className="text-limon" fill="currentColor" opacity="0.6">
          <rect x="140" y="330" width="18" height="10" rx="1" transform="rotate(-8 140 330)" />
          <rect x="162" y="327" width="18" height="10" rx="1" transform="rotate(-8 162 327)" />
          <rect x="184" y="324" width="18" height="10" rx="1" transform="rotate(-8 184 324)" />
          <rect x="140" y="344" width="18" height="10" rx="1" transform="rotate(-8 140 344)" />
          <rect x="162" y="341" width="18" height="10" rx="1" transform="rotate(-8 162 341)" />
          <rect x="184" y="338" width="18" height="10" rx="1" transform="rotate(-8 184 338)" />
        </g>

        {/* Güneş paneli ızgaraları - orta bina */}
        <g className="text-seftali" fill="currentColor" opacity="0.5">
          <rect x="520" y="310" width="22" height="12" rx="1" transform="rotate(-5 520 310)" />
          <rect x="546" y="308" width="22" height="12" rx="1" transform="rotate(-5 546 308)" />
          <rect x="572" y="306" width="22" height="12" rx="1" transform="rotate(-5 572 306)" />
          <rect x="598" y="304" width="22" height="12" rx="1" transform="rotate(-5 598 304)" />
          <rect x="520" y="326" width="22" height="12" rx="1" transform="rotate(-5 520 326)" />
          <rect x="546" y="324" width="22" height="12" rx="1" transform="rotate(-5 546 324)" />
          <rect x="572" y="322" width="22" height="12" rx="1" transform="rotate(-5 572 322)" />
          <rect x="598" y="320" width="22" height="12" rx="1" transform="rotate(-5 598 320)" />
        </g>

        {/* Güneş paneli ızgaraları - sağ bina */}
        <g className="text-mercan" fill="currentColor" opacity="0.4">
          <rect x="980" y="340" width="20" height="11" rx="1" transform="rotate(-6 980 340)" />
          <rect x="1004" y="337" width="20" height="11" rx="1" transform="rotate(-6 1004 337)" />
          <rect x="1028" y="334" width="20" height="11" rx="1" transform="rotate(-6 1028 334)" />
          <rect x="980" y="355" width="20" height="11" rx="1" transform="rotate(-6 980 355)" />
          <rect x="1004" y="352" width="20" height="11" rx="1" transform="rotate(-6 1004 352)" />
          <rect x="1028" y="349" width="20" height="11" rx="1" transform="rotate(-6 1028 349)" />
        </g>

        {/* Güneş ışınları - sağ üst */}
        <circle cx="1300" cy="180" r="30" className="text-limon" fill="currentColor" opacity="0.3" />
        <g stroke="currentColor" className="text-limon" strokeWidth="2" opacity="0.2">
          <line x1="1300" y1="140" x2="1300" y2="125" />
          <line x1="1300" y1="220" x2="1300" y2="235" />
          <line x1="1260" y1="180" x2="1245" y2="180" />
          <line x1="1340" y1="180" x2="1355" y2="180" />
          <line x1="1272" y1="152" x2="1261" y2="141" />
          <line x1="1328" y1="208" x2="1339" y2="219" />
          <line x1="1272" y1="208" x2="1261" y2="219" />
          <line x1="1328" y1="152" x2="1339" y2="141" />
        </g>
      </svg>
    </div>
  );
}

