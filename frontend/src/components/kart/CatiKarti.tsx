"use client";

// Çatı kartı: seçili binanın hesabı. Rakamlar her zaman hesap motorundan (/hesap/bina) gelir.
// Bölümler (özet, 25 yıllık finans, uydu, tüketim, simülasyon, rapor) haritadaki bina düğmeleriyle işaretlenir.

import Link from "next/link";
import { BookmarkCheck, BookmarkPlus, FileChartColumn, PanelsTopLeft, X } from "lucide-react";
import { FinansOzeti } from "@/components/kart/FinansOzeti";
import { binaAdi, Deger, SkorRozeti } from "@/components/ortak/Deger";
import { TuketimKutusu } from "@/components/kart/TuketimKutusu";
import { UyduKontrolu } from "@/components/kart/UyduKontrolu";
import { PanelBolumu } from "@/components/panel/PanelBolumu";
import { SimulasyonPaneli } from "@/components/simulasyon";
import { useBinaDetay, useBinaHesabi, useBinalar, useKaydet } from "@/hooks/veri";
import { BOLUM_SIRASI, BOLUMLER } from "@/lib/bolumler";
import { alan, sayi, tl } from "@/lib/bicim";
import { ANA_DUGME, HATA, IKINCIL_DUGME, KART, SECILI_CIP } from "@/lib/stil";
import { useHaritaDurumu } from "@/store/harita";
import { useOturum } from "@/store/oturum";

function KaydetDugmesi({ binaId }: { binaId: number }) {
  const kullanici = useOturum((d) => d.kullanici);
  const varsayimlar = useHaritaDurumu((d) => d.varsayimlar);
  const tuketim = useHaritaDurumu((d) => d.tuketimler[binaId] ?? null);
  const { data: sonuc } = useBinaHesabi(binaId, tuketim);
  const kaydet = useKaydet();

  if (!kullanici) {
    return (
      <Link href="/giris?sonra=/" className={`${IKINCIL_DUGME} w-full`}>
        Analizi kaydetmek için giriş yapın
      </Link>
    );
  }

  if (kaydet.isSuccess) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-xl bg-limon/40 px-4 py-2.5 text-center text-sm text-murekkep">
        <BookmarkCheck className="h-4 w-4" aria-hidden />
        Kaydedildi ·{" "}
        <Link href="/kayitlarim" className="font-semibold underline decoration-seftali decoration-2 underline-offset-4">
          Kayıtlarım
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={!sonuc || kaydet.isPending}
        onClick={() => sonuc && kaydet.mutate({ bina_id: binaId, varsayimlar, tuketim, sonuc })}
        className={`${IKINCIL_DUGME} w-full`}
      >
        <BookmarkPlus className="h-4 w-4" aria-hidden />
        {kaydet.isPending ? "Kaydediliyor…" : "Analizi kaydet"}
      </button>
      {kaydet.isError && <p className="text-xs text-mercan-koyu">{kaydet.error.message}</p>}
    </div>
  );
}

/** Kartın başındaki hızlı geçiş: haritadaki beş düğmenin panel içindeki karşılığı. */
function HizliGecis() {
  const odak = useHaritaDurumu((d) => d.odak);
  const bolumeGit = useHaritaDurumu((d) => d.bolumeGit);
  return (
    <nav aria-label="Bölümlere git" className="grid grid-cols-5 gap-1.5">
      {BOLUM_SIRASI.map((b) => {
        const { Ikon, kisa, etiket } = BOLUMLER[b];
        const secili = odak?.bolum === b;
        return (
          <button
            key={b}
            type="button"
            onClick={() => bolumeGit(b)}
            aria-pressed={secili}
            title={etiket}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[10px] font-semibold transition ${
              secili ? SECILI_CIP : "bg-white text-murekkep/80 shadow-sm ring-1 ring-murekkep/15 hover:bg-limon/30"
            }`}
          >
            <Ikon className="h-4 w-4" aria-hidden />
            <span className="max-w-full truncate">{kisa}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function CatiKarti({ binaId }: { binaId: number }) {
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  const tuketim = useHaritaDurumu((d) => d.tuketimler[binaId] ?? null);
  const { data: binalar } = useBinalar();
  const ozet = binalar?.features.find((f) => f.properties.id === binaId)?.properties;
  const { data: detay } = useBinaDetay(binaId);
  const { data: hesap, isError, error, isFetching } = useBinaHesabi(binaId, tuketim);

  const bina = detay ?? ozet;
  if (!bina) return <p className="text-sm text-murekkep/55">Bina yükleniyor…</p>;

  const tavanKwp = detay?.verim_kwh_kwp && tuketim ? tuketim.yillik_kwh / detay.verim_kwh_kwp : null;
  const tuketimeGoreKucuk = hesap && tavanKwp !== null && Math.abs(hesap.kwp - tavanKwp) < 0.5;

  return (
    <section className="space-y-4">
      <PanelBolumu ad="ozet" className="space-y-3">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mercan-koyu">OSM #{bina.id}</p>
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold tracking-tight text-murekkep">{binaAdi(bina)}</h2>
              {typeof hesap?.uygunluk_skoru === "number" && <SkorRozeti skor={hesap.uygunluk_skoru} />}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
              {detay?.verim_kwh_kwp && (
                <span className="rounded-full bg-murekkep/5 px-2 py-0.5 text-murekkep/70">
                  {sayi(detay.verim_kwh_kwp)} kWh/kWp (PVGIS)
                </span>
              )}
              {detay?.mevcut_ges && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">Mevcut panel var</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => binaSec(null)}
            aria-label="Çatı kartını kapat"
            title="Kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-murekkep/70 ring-1 ring-murekkep/10 hover:bg-murekkep/5"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <HizliGecis />

        {isError ? (
          <p className={HATA}>{error.message}</p>
        ) : (
          <div className={`grid grid-cols-2 gap-2 transition-opacity ${isFetching ? "opacity-70" : ""}`}>
            <Deger etiket="Yıllık tasarruf" deger={hesap ? `${tl(hesap.tasarruf_tl)}/yıl` : "…"} vurgu />
            <Deger etiket="Geri ödeme" deger={hesap ? `${sayi(hesap.geri_odeme_yil, 1)} yıl` : "…"} vurgu />
            <Deger etiket="Çatı alanı" deger={alan(bina.alan_m2)} />
            <Deger etiket="Kurulu güç" deger={hesap ? `${sayi(hesap.kwp)} kWp` : "…"} />
            <Deger etiket="Yıllık üretim" deger={hesap ? `${sayi(hesap.uretim_mwh)} MWh` : "…"} />
            <Deger etiket="Yatırım" deger={hesap ? tl(hesap.yatirim_tl) : "…"} />
            <Deger etiket="Önlenen CO₂" deger={hesap ? `${sayi(hesap.co2_ton)} t/yıl` : "…"} />
            {detay?.en_yakin_trafo && (
              <Deger
                etiket="En yakın trafo"
                deger={`${sayi(detay.en_yakin_trafo.mesafe_km, 1)} km · ${detay.en_yakin_trafo.ad || "adsız"}`}
              />
            )}
          </div>
        )}
      </PanelBolumu>

      <PanelBolumu ad="finans">{hesap ? <FinansOzeti hesap={hesap} /> : <div className={`${KART} h-24`} />}</PanelBolumu>

      {tuketimeGoreKucuk && (
        <p className="text-[11px] text-murekkep/70">Sistem tüketiminize göre küçültüldü; çatının tamamı kullanılmıyor.</p>
      )}

      <PanelBolumu ad="uydu">
        <UyduKontrolu key={`uydu-${binaId}`} binaId={binaId} />
      </PanelBolumu>

      <PanelBolumu ad="tuketim">
        <TuketimKutusu key={binaId} binaId={binaId} />
      </PanelBolumu>

      {/* Saatlik simülasyon, pil, kredi, statik ve şebeke: Mehmet'in bileşeni (components/simulasyon/). */}
      <SimulasyonPaneli
        key={`sim-${binaId}`}
        binaId={binaId}
        alanM2={bina.alan_m2}
        yillikTuketimKwh={tuketim?.yillik_kwh ?? null}
      />

      <PanelBolumu ad="rapor">
        <div className={`${KART} space-y-3 p-4`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-limon to-seftali">
              <FileChartColumn className="h-5 w-5 text-murekkep" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-murekkep">Ön fizibilite raporu</p>
              <p className="text-[11px] leading-snug text-murekkep/60">
                Özet değerler, 25 yıllık finans ve uydu kontrolü tek sayfada; PDF olarak indirilebilir.
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Link href={`/rapor/${binaId}`} className={`${ANA_DUGME} w-full`}>
              <PanelsTopLeft className="h-4 w-4" aria-hidden />
              Raporu aç (PDF)
            </Link>
            <KaydetDugmesi key={`kaydet-${binaId}`} binaId={binaId} />
          </div>
        </div>
      </PanelBolumu>

      <p className="text-[11px] leading-relaxed text-murekkep/50">
        İlk kaba hesap. Geri ödeme basit (ilk yıl tasarrufuyla)
        {typeof hesap?.nbd_tl === "number"
          ? "; uzun dönem değerler bakım ve verim kaybını içerir."
          : "; enflasyon, tarife artışı ve bakım dahil değil."}{" "}
        Çatı statiği, mevcut tesisat ve şebeke bağlantısı için yerinde keşif gerekir.
      </p>
    </section>
  );
}
