"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { binaAdi, Deger } from "@/components/ortak/Deger";
import { useKayitlar, useKayitSil } from "@/hooks/veri";
import { sayi, tl } from "@/lib/bicim";
import { useHaritaDurumu } from "@/store/harita";
import { useOturum } from "@/store/oturum";

const tarih = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

export function KayitlarListesi() {
  const router = useRouter();
  const { kullanici, yukleniyor } = useOturum();
  const { data: kayitlar, isPending, isError, error } = useKayitlar();
  const sil = useKayitSil();
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  const varsayimGuncelle = useHaritaDurumu((d) => d.varsayimGuncelle);
  const tuketimAyarla = useHaritaDurumu((d) => d.tuketimAyarla);

  useEffect(() => {
    if (!yukleniyor && !kullanici) router.replace("/giris?sonra=/kayitlarim");
  }, [yukleniyor, kullanici, router]);

  if (yukleniyor || !kullanici) return <p className="text-sm text-slate-400">Yükleniyor…</p>;

  return (
    <div className="space-y-4">
      {isError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">{error.message}</p>}
      {isPending && <p className="text-sm text-slate-400">Kayıtlar yükleniyor…</p>}
      {kayitlar?.length === 0 && (
        <div className="rounded-2xl border border-white/10 p-6 text-center">
          <p className="text-sm text-slate-300">Henüz kayıtlı analiz yok.</p>
          <Link href="/" className="mt-2 inline-block text-sm font-semibold text-amber-300 hover:underline">
            Haritadan bir çatı seçin →
          </Link>
        </div>
      )}
      {kayitlar?.map((k) => (
        <article key={k.id} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-slate-50">{binaAdi({ id: k.bina_id, ad: k.bina_ad })}</h2>
              <p className="text-xs text-slate-400">
                {tarih.format(new Date(k.olusturma))}
                {k.tuketim && ` · tüketim ${sayi(k.tuketim.yillik_kwh / 1000)} MWh/yıl`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => sil.mutate(k.id)}
              disabled={sil.isPending}
              className="shrink-0 rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-red-500/10 hover:text-red-200"
            >
              Sil
            </button>
          </header>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Deger etiket="Tasarruf" deger={`${tl(k.sonuc.tasarruf_tl)}/yıl`} vurgu />
            <Deger etiket="Geri ödeme" deger={`${sayi(k.sonuc.geri_odeme_yil, 1)} yıl`} vurgu />
            <Deger etiket="Kurulu güç" deger={`${sayi(k.sonuc.kwp)} kWp`} />
            <Deger etiket="Yatırım" deger={tl(k.sonuc.yatirim_tl)} />
          </div>
          <button
            type="button"
            onClick={() => {
              // Kaydedilen varsayım ve tüketimle haritada aç.
              varsayimGuncelle(k.varsayimlar);
              tuketimAyarla(k.bina_id, k.tuketim ?? null);
              binaSec(k.bina_id, true);
              router.push("/");
            }}
            className="text-sm font-semibold text-amber-300 hover:underline"
          >
            Haritada aç →
          </button>
        </article>
      ))}
    </div>
  );
}
