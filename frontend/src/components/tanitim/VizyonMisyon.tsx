"use client";

// Tanıtım ekranının Vizyon ve Misyon bölümü. Tasarım fikri "ufuk ve yol": vizyon, ufukta doğan güneş
// (gittiğimiz yer); misyon, bugün attığımız üç adım; altta "Neden şimdi?" zaman çizgisi ve yol haritası.
// Animasyonlar görünüme girince bir kez oynar; "hareketi azalt" açıksa öğeler doğrudan görünür.
// Tarihler ve kaynaklar PROJE.md §18.2'den; çatı sayıları canlı API'deki /osblar'dan (396 + 256 + 11).

import { motion, useReducedMotion, type Variants } from "motion/react";
import { BadgeCheck, Gauge, Map as HaritaIkonu, Rocket, Route, Sprout, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

const YAVAS: [number, number, number, number] = [0.22, 0.8, 0.2, 1];

const yukari: Variants = {
  gizli: { opacity: 0, y: 28 },
  gorunur: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, ease: YAVAS, delay: i * 0.12 } }),
};

/** Görünüme girince yukarı kayarak beliren kutu. */
function Belir({ children, sira = 0, className = "" }: { children: ReactNode; sira?: number; className?: string }) {
  const azHareket = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={yukari}
      custom={sira}
      initial={azHareket ? false : "gizli"}
      whileInView="gorunur"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

const SKA = [
  { no: 7, ad: "Erişilebilir ve temiz enerji" },
  { no: 9, ad: "Sanayi, yenilikçilik ve altyapı" },
  { no: 13, ad: "İklim eylemi" },
];

const MISYON: { Ikon: LucideIcon; baslik: string; metin: string }[] = [
  {
    Ikon: HaritaIkonu,
    baslik: "Her çatıyı görünür kılmak",
    metin:
      "1.000 m² üstü her sanayi çatısının kurulabilir gücünü, üretimini, tasarrufunu ve önlenen CO₂'sini haritada, bina bina göstermek.",
  },
  {
    Ikon: Gauge,
    baslik: "Kararı hızlandırmak",
    metin:
      "Firmaya tüketimine göre boyutlanmış ön fizibiliteyi dakikalar içinde, OSB yönetimine ilk gidilecek çatıların listesini tek ekranda vermek.",
  },
  {
    Ikon: BadgeCheck,
    baslik: "Güveni hesapla kurmak",
    metin:
      "Her varsayımın kaynağını ve tarihini açık tutmak; yapay zekâyı rakam üretmek için değil, tabloyu okumak ve uydu görüntüsünü denetlemek için kullanmak.",
  },
];

const NEDEN_SIMDI: { tarih: string; baslik: string; metin: string; vurgu?: boolean }[] = [
  { tarih: "9 Temmuz 2025", baslik: "İklim Kanunu", metin: "Türkiye'nin ilk iklim kanunu yürürlüğe girdi." },
  {
    tarih: "1 Mayıs 2026",
    baslik: "Saatlik mahsuplaşma",
    metin: "Sanayi çatılarında üretim ve tüketim saat saat mahsuplaşıyor; doğru boyutlama doğrudan kazanç.",
  },
  {
    tarih: "27 Ağustos 2026",
    baslik: "Emisyon Ticaret Sistemi",
    metin: "Türkiye ETS Yönetmeliği yayımlandı; karbonun bir fiyatı olacak.",
  },
  { tarih: "9-20 Kasım 2026", baslik: "COP31 Antalya", metin: "Dünyanın iklim gündemi Türkiye'de.", vurgu: true },
  { tarih: "2053", baslik: "Net sıfır", metin: "Türkiye'nin net sıfır emisyon hedefi." },
];

const YOL: { Ikon: LucideIcon; evre: string; baslik: string; metin: string }[] = [
  {
    Ikon: Sprout,
    evre: "Bugün",
    baslik: "3 OSB, 660'tan fazla çatı",
    metin: "Manisa, Muradiye ve Salihli OSB'lerindeki büyük çatılar hesaplı ve sıralı.",
  },
  {
    Ikon: Route,
    evre: "Sırada",
    baslik: "Gerçek profil, bütün çatılar",
    metin: "Sayaç verisiyle gerçek tüketim profili; uydu panel kontrolü her çatıya.",
  },
  {
    Ikon: Rocket,
    evre: "Yaygınlaşma",
    baslik: "Her OSB, her kampüs",
    metin: "Aynı veri hattı sınır değiştirilerek başka OSB'lerde ve kampüs çatılarında çalışır.",
  },
];

/** Vizyon kartının altındaki ufuk: çizginin ardından doğan güneş ve ışınları. */
function Ufuk() {
  const id = useId().replace(/:/g, "");
  const azHareket = useReducedMotion();
  return (
    <svg viewBox="0 0 600 220" className="block h-auto w-full" aria-hidden preserveAspectRatio="xMidYMax slice">
      <defs>
        <radialGradient id={`${id}-gunes`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#f1f5a6" />
          <stop offset="0.5" stopColor="#e1eb71" />
          <stop offset="1" stopColor="#ecab69" />
        </radialGradient>
        <radialGradient id={`${id}-hale`} cx="0.5" cy="1" r="0.75">
          <stop offset="0" stopColor="#ecab69" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#e36161" stopOpacity="0.12" />
          <stop offset="1" stopColor="#e36161" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-ust`}>
          <rect x="0" y="0" width="600" height="176" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="600" height="220" fill={`url(#${id}-hale)`} />
      <motion.g
        clipPath={`url(#${id}-ust)`}
        initial={azHareket ? false : { y: 90 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.6, ease: YAVAS, delay: 0.2 }}
      >
        {Array.from({ length: 13 }, (_, i) => {
          const aci = (-90 + (i - 6) * 13) * (Math.PI / 180);
          const [ic, dis] = [86, i % 2 ? 150 : 190];
          return (
            <line
              key={i}
              x1={300 + Math.cos(aci) * ic}
              y1={176 + Math.sin(aci) * ic}
              x2={300 + Math.cos(aci) * dis}
              y2={176 + Math.sin(aci) * dis}
              stroke="#e1eb71"
              strokeOpacity={i % 2 ? 0.35 : 0.6}
              strokeWidth={i % 2 ? 3 : 5}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="300" cy="176" r="70" fill={`url(#${id}-gunes)`} />
      </motion.g>
      {/* Ufuk çizgisi ve çatı siluetleri */}
      <path
        d="M0 176 H70 V150 H150 V164 H210 V176 H390 V156 H440 V140 H520 V176 H600"
        fill="none"
        stroke="#fdfdfd"
        strokeOpacity="0.5"
        strokeWidth="2"
      />
      <rect x="0" y="177" width="600" height="43" fill="#1c1a17" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={84 + i * 9} y="154" width="6" height="4" rx="1" fill="#e1eb71" fillOpacity="0.7" />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={450 + i * 9} y="144" width="6" height="4" rx="1" fill="#e1eb71" fillOpacity="0.7" />
      ))}
    </svg>
  );
}

function NedenSimdi() {
  const azHareket = useReducedMotion();
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-murekkep/10 bg-white p-6 shadow-[0_1px_3px_rgb(28_26_23/0.08)] md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mercan-koyu">Neden şimdi?</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-murekkep md:text-3xl">
            Kurallar değişti, zaman daralıyor
          </h3>
        </div>
        <p className="max-w-sm text-sm text-murekkep/60">
          Yeşil dönüşüm artık yalnızca bir tercih değil; mevzuat, karbon fiyatı ve COP31 aynı yöne işaret ediyor.
        </p>
      </div>

      <ol className="relative mt-10 grid gap-8 lg:grid-cols-5 lg:gap-4">
        {/* Zaman çizgisi: masaüstünde yatay, telefonda dikey; görünüme girince dolar */}
        <motion.span
          aria-hidden
          className="absolute left-[11px] top-2 hidden h-1 w-[calc(100%-22px)] origin-left rounded-full bg-gradient-to-r from-limon via-seftali to-mercan lg:block"
          initial={azHareket ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.4, ease: YAVAS }}
        />
        <motion.span
          aria-hidden
          className="absolute bottom-2 left-[11px] top-2 w-1 origin-top rounded-full bg-gradient-to-b from-limon via-seftali to-mercan lg:hidden"
          initial={azHareket ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.4, ease: YAVAS }}
        />
        {NEDEN_SIMDI.map((o, i) => (
          <li key={o.tarih} className="relative pl-10 lg:pl-0 lg:pt-10">
            <Belir sira={i}>
              <span
                aria-hidden
                className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white lg:-top-0.5 ${
                  o.vurgu ? "bg-mercan" : "bg-gradient-to-br from-limon to-seftali"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
              <p className={`text-sm font-bold ${o.vurgu ? "text-mercan-koyu" : "text-murekkep/50"}`}>{o.tarih}</p>
              <p className="mt-1 text-lg font-semibold leading-snug text-murekkep">{o.baslik}</p>
              <p className="mt-1 text-sm leading-relaxed text-murekkep/60">{o.metin}</p>
            </Belir>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-[11px] text-murekkep/40">
        Kaynaklar: Resmî Gazete (2 Nisan 2026, sayı 33212; 27 Ağustos 2026, sayı 33353), 7552 sayılı İklim Kanunu (9
        Temmuz 2025, sayı 32951).
      </p>
    </div>
  );
}

export function VizyonMisyon() {
  return (
    <section id="vizyon" aria-labelledby="vizyon-baslik" className="relative overflow-hidden bg-zemin py-24 md:py-32">
      {/* Hafif sıcak zemin: üstteki özellik bölümünden sonra yeni bir sahne açıldığını belli eder */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-gradient-to-b from-limon/25 via-seftali/10 to-transparent"
      />
      <div className="bg-noise pointer-events-none absolute inset-0 opacity-20" aria-hidden />

      <div className="relative mx-auto max-w-6xl space-y-8 px-4">
        <Belir className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mercan">Vizyon ve misyon</p>
          <h2
            id="vizyon-baslik"
            className="mt-3 text-4xl font-bold leading-tight tracking-tight text-murekkep md:text-5xl"
          >
            Güneş zaten çatıda. Eksik olan, nereden başlanacağını gösteren tablo.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-murekkep/60">
            Çatı Radarı, sanayinin güneşe geçişini tek tek teklif toplamaktan çıkarıp bölge ölçeğinde, veriyle planlanan
            bir işe dönüştürmek için var.
          </p>
        </Belir>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          {/* Vizyon: ufukta doğan güneş */}
          <Belir sira={1}>
            <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-murekkep p-8 pb-0 text-zemin md:p-10 md:pb-0">
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-limon">Vizyonumuz</p>
                <p className="mt-4 text-2xl font-semibold leading-snug md:text-[1.75rem]">
                  Türkiye&apos;deki her organize sanayi bölgesinin çatılarındaki güneşi bina bina bildiği, yatırım
                  kararını tahminle değil açık ve doğrulanabilir hesapla verdiği bir sanayi.
                </p>
                <ul
                  aria-label="Katkı verdiğimiz BM Sürdürülebilir Kalkınma Amaçları"
                  className="mt-6 flex flex-wrap gap-2"
                >
                  {SKA.map((s) => (
                    <li
                      key={s.no}
                      className="inline-flex items-center gap-2 rounded-full border border-zemin/15 bg-zemin/5 px-3 py-1.5 text-xs text-zemin/80 backdrop-blur"
                    >
                      <span className="rounded-full bg-limon px-1.5 py-0.5 text-[10px] font-bold text-murekkep">
                        SKA {s.no}
                      </span>
                      {s.ad}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Ufuk kartın dibinde ayrı blok: yazı ne kadar uzarsa uzasın çizimin üstüne binmez */}
              <div className="-mx-8 mt-auto pt-6 md:-mx-10">
                <Ufuk />
              </div>
            </article>
          </Belir>

          {/* Misyon: bugün attığımız üç adım */}
          <Belir sira={2}>
            <article className="h-full rounded-[2rem] border border-murekkep/10 bg-white p-8 shadow-[0_1px_3px_rgb(28_26_23/0.08)] md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mercan-koyu">Misyonumuz</p>
              <p className="mt-4 text-2xl font-semibold leading-snug text-murekkep md:text-[1.75rem]">
                Manisa&apos;dan başlayarak çatıdaki güneşi ölçülebilir, karşılaştırılabilir ve finanse edilebilir
                kılmak.
              </p>
              <ol className="mt-8 space-y-6">
                {MISYON.map(({ Ikon, baslik, metin }, i) => (
                  <li key={baslik} className="flex gap-4">
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-limon to-seftali text-murekkep shadow-sm">
                      <Ikon className="h-5 w-5" aria-hidden />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-murekkep text-[10px] font-bold text-limon">
                        {i + 1}
                      </span>
                    </span>
                    <div>
                      <p className="text-base font-semibold text-murekkep">{baslik}</p>
                      <p className="mt-1 text-sm leading-relaxed text-murekkep/60">{metin}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          </Belir>
        </div>

        <Belir>
          <NedenSimdi />
        </Belir>

        {/* Yol haritası */}
        <div className="grid gap-4 md:grid-cols-3">
          {YOL.map(({ Ikon, evre, baslik, metin }, i) => (
            <Belir key={evre} sira={i}>
              <div className="group h-full rounded-[1.5rem] border border-murekkep/10 bg-white/70 p-6 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-murekkep/5 px-3 py-1 text-xs font-semibold text-murekkep/70">
                    {evre}
                  </span>
                  <Ikon className="h-5 w-5 text-seftali transition group-hover:text-mercan" aria-hidden />
                </div>
                <p className="mt-4 text-lg font-semibold text-murekkep">{baslik}</p>
                <p className="mt-1 text-sm leading-relaxed text-murekkep/60">{metin}</p>
              </div>
            </Belir>
          ))}
        </div>
      </div>
    </section>
  );
}
