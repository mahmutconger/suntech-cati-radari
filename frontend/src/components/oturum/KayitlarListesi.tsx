"use client";

// Kayıtlarım dash'i: üstte toplam kartları, altında sıralanabilir kayıt kartları.
// Her kayıt haritada ya da rapor olarak kaydedildiği varsayım ve tüketimle açılır.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bookmark,
  CalendarDays,
  Clock,
  FileChartColumn,
  Gauge,
  MapPin,
  PiggyBank,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { binaAdi, Deger } from "@/components/ortak/Deger";
import { useKayitlar, useKayitSil } from "@/hooks/veri";
import { sayi, tl } from "@/lib/bicim";
import { ANA_DUGME, HATA, IKINCIL_DUGME, KART, SECILI_CIP } from "@/lib/stil";
import { useHaritaDurumu } from "@/store/harita";
import type { Kayit } from "@/types/gecici";

const tarih = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

type Siralama = "yeni" | "tasarruf" | "geri_odeme";

const SIRALAMALAR: { deger: Siralama; etiket: string }[] = [
  { deger: "yeni", etiket: "En yeni" },
  { deger: "tasarruf", etiket: "En çok tasarruf" },
  { deger: "geri_odeme", etiket: "En kısa geri ödeme" },
];

function ToplamKarti({ etiket, deger, alt, Ikon, vurgu = false }: { etiket: string; deger: string; alt?: string; Ikon: LucideIcon; vurgu?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        vurgu ? "bg-gradient-to-br from-limon via-limon/70 to-seftali/70 shadow-sm" : `${KART}`
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-murekkep/65">{etiket}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${vurgu ? "bg-white/60" : "bg-limon/40"}`}>
          <Ikon className="h-4 w-4 text-murekkep" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-murekkep tabular-nums">{deger}</p>
      {alt && <p className="text-[11px] text-murekkep/55">{alt}</p>}
    </div>
  );
}

export function KayitlarListesi() {
  const router = useRouter();
  const { data: kayitlar, isPending, isError, error } = useKayitlar();
  const sil = useKayitSil();
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  const varsayimGuncelle = useHaritaDurumu((d) => d.varsayimGuncelle);
  const tuketimAyarla = useHaritaDurumu((d) => d.tuketimAyarla);
  const [siralama, setSiralama] = useState<Siralama>("yeni");

  const sirali = useMemo(() => {
    const liste = [...(kayitlar ?? [])];
    if (siralama === "tasarruf") liste.sort((a, b) => b.sonuc.tasarruf_tl - a.sonuc.tasarruf_tl);
    else if (siralama === "geri_odeme") liste.sort((a, b) => a.sonuc.geri_odeme_yil - b.sonuc.geri_odeme_yil);
    else liste.sort((a, b) => b.olusturma.localeCompare(a.olusturma));
    return liste;
  }, [kayitlar, siralama]);

  const toplam = useMemo(() => {
    const l = kayitlar ?? [];
    return {
      adet: l.length,
      tasarruf: l.reduce((t, k) => t + k.sonuc.tasarruf_tl, 0),
      kwp: l.reduce((t, k) => t + k.sonuc.kwp, 0),
      geriOdeme: l.length ? l.reduce((t, k) => t + k.sonuc.geri_odeme_yil, 0) / l.length : 0,
    };
  }, [kayitlar]);

  /** Kaydedilen varsayım ve tüketimi haritaya geri yükler. */
  function yukle(k: Kayit) {
    varsayimGuncelle(k.varsayimlar);
    tuketimAyarla(k.bina_id, k.tuketim ?? null);
  }

  return (
    <div className="space-y-6">
      {isError && <p className={HATA}>{error.message}</p>}

      <section aria-label="Toplamlar" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ToplamKarti etiket="Kayıtlı analiz" deger={sayi(toplam.adet)} alt="çatı" Ikon={Bookmark} vurgu />
        <ToplamKarti etiket="Toplam yıllık tasarruf" deger={tl(toplam.tasarruf)} alt="kayıtlı çatıların toplamı" Ikon={PiggyBank} />
        <ToplamKarti etiket="Toplam kurulu güç" deger={`${sayi(toplam.kwp / 1000, 2)} MWp`} Ikon={Zap} />
        <ToplamKarti
          etiket="Ortalama geri ödeme"
          deger={toplam.adet ? `${sayi(toplam.geriOdeme, 1)} yıl` : "—"}
          Ikon={Clock}
        />
      </section>

      <section aria-label="Kayıtlar" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-murekkep">Analizler</h2>
          <div role="group" aria-label="Sırala" className="flex rounded-full bg-white/80 p-1 text-xs ring-1 ring-murekkep/10">
            {SIRALAMALAR.map((s) => (
              <button
                key={s.deger}
                type="button"
                onClick={() => setSiralama(s.deger)}
                aria-pressed={siralama === s.deger}
                className={`rounded-full px-3 py-1.5 font-semibold ${siralama === s.deger ? SECILI_CIP : "text-murekkep/60 hover:bg-murekkep/5"}`}
              >
                {s.etiket}
              </button>
            ))}
          </div>
        </div>

        {isPending && (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`${KART} h-56 animate-pulse`} />
            ))}
          </div>
        )}

        {kayitlar?.length === 0 && (
          <div className={`${KART} flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between`}>
            <div>
              <p className="font-semibold text-murekkep">Henüz kayıtlı analiz yok</p>
              <p className="text-sm text-murekkep/60">Haritada bir çatı seçin ve panelden &quot;Analizi kaydet&quot;e basın.</p>
            </div>
            <Link href="/" className={ANA_DUGME}>
              <MapPin className="h-4 w-4" aria-hidden />
              Haritadan bir çatı seçin
            </Link>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {sirali.map((k) => (
            <article key={k.id} className={`${KART} flex flex-col gap-3 p-4`}>
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-murekkep">{binaAdi({ id: k.bina_id, ad: k.bina_ad })}</h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-murekkep/55">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      {tarih.format(new Date(k.olusturma))}
                    </span>
                    {k.tuketim && (
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5" aria-hidden />
                        {sayi(k.tuketim.yillik_kwh / 1000)} MWh/yıl
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => sil.mutate(k.id)}
                  disabled={sil.isPending}
                  aria-label={`${binaAdi({ id: k.bina_id, ad: k.bina_ad })} kaydını sil`}
                  title="Sil"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-murekkep/45 hover:bg-mercan/10 hover:text-mercan-koyu disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </header>
              <div className="grid grid-cols-2 gap-2">
                <Deger etiket="Tasarruf" deger={`${tl(k.sonuc.tasarruf_tl)}/yıl`} vurgu />
                <Deger etiket="Geri ödeme" deger={`${sayi(k.sonuc.geri_odeme_yil, 1)} yıl`} vurgu />
                <Deger etiket="Kurulu güç" deger={`${sayi(k.sonuc.kwp)} kWp`} />
                <Deger etiket="Yatırım" deger={tl(k.sonuc.yatirim_tl)} />
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    yukle(k);
                    binaSec(k.bina_id, true);
                    router.push("/");
                  }}
                  className={ANA_DUGME}
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  Haritada aç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    yukle(k);
                    router.push(`/rapor/${k.bina_id}`);
                  }}
                  className={IKINCIL_DUGME}
                >
                  <FileChartColumn className="h-4 w-4" aria-hidden />
                  Rapor
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
