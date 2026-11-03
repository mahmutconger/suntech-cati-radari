"use client";

// Çatı kartı: seçili binanın hesabı. Rakamlar her zaman hesap motorundan (/hesap/bina) gelir.

import Link from "next/link";
import { FinansOzeti } from "@/components/kart/FinansOzeti";
import { binaAdi, Deger, SkorRozeti } from "@/components/ortak/Deger";
import { TuketimKutusu } from "@/components/kart/TuketimKutusu";
import { UyduKontrolu } from "@/components/kart/UyduKontrolu";
import { SimulasyonPaneli } from "@/components/simulasyon";
import { useBinaDetay, useBinaHesabi, useBinalar, useKaydet } from "@/hooks/veri";
import { alan, sayi, tl } from "@/lib/bicim";
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
      <Link
        href="/giris?sonra=/"
        className="block rounded-xl border border-amber-400/40 px-4 py-2.5 text-center text-sm font-semibold text-amber-200 hover:bg-amber-400/10"
      >
        Analizi kaydetmek için giriş yapın
      </Link>
    );
  }

  if (kaydet.isSuccess) {
    return (
      <p className="rounded-xl bg-emerald-500/15 px-4 py-2.5 text-center text-sm text-emerald-200">
        Kaydedildi ·{" "}
        <Link href="/kayitlarim" className="font-semibold underline">
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
        className="w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-50"
      >
        {kaydet.isPending ? "Kaydediliyor…" : "Analizi kaydet"}
      </button>
      {kaydet.isError && <p className="text-xs text-red-300">{kaydet.error.message}</p>}
    </div>
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
  if (!bina) return <p className="text-sm text-slate-400">Bina yükleniyor…</p>;

  const tavanKwp = detay?.verim_kwh_kwp && tuketim ? tuketim.yillik_kwh / detay.verim_kwh_kwp : null;
  const tuketimeGoreKucuk = hesap && tavanKwp !== null && Math.abs(hesap.kwp - tavanKwp) < 0.5;

  return (
    <section className="space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">OSM #{bina.id}</p>
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-slate-50">{binaAdi(bina)}</h2>
            {typeof hesap?.uygunluk_skoru === "number" && <SkorRozeti skor={hesap.uygunluk_skoru} />}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
            {detay?.verim_kwh_kwp && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-slate-300">
                {sayi(detay.verim_kwh_kwp)} kWh/kWp (PVGIS)
              </span>
            )}
            {detay?.mevcut_ges && (
              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-sky-200">Çatıda panel kayıtlı (OSM)</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => binaSec(null)}
          className="shrink-0 rounded-full px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
        >
          Kapat ✕
        </button>
      </header>

      {isError ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">{error.message}</p>
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

      {hesap && <FinansOzeti hesap={hesap} />}

      {tuketimeGoreKucuk && (
        <p className="text-[11px] text-amber-200/90">
          Sistem tüketiminize göre küçültüldü; çatının tamamı kullanılmıyor.
        </p>
      )}

      <UyduKontrolu key={`uydu-${binaId}`} binaId={binaId} />

      <TuketimKutusu key={binaId} binaId={binaId} />

      {/* Saatlik simülasyon, pil, kredi, statik ve şebeke: Mehmet'in bileşeni (components/simulasyon/). */}
      <SimulasyonPaneli
        key={`sim-${binaId}`}
        binaId={binaId}
        alanM2={bina.alan_m2}
        yillikTuketimKwh={tuketim?.yillik_kwh ?? null}
      />

      <div className="grid gap-2">
        <KaydetDugmesi key={`kaydet-${binaId}`} binaId={binaId} />
        <Link
          href={`/rapor/${binaId}`}
          className="block rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm font-semibold text-slate-100 hover:bg-white/5"
        >
          📄 Ön fizibilite raporu (PDF)
        </Link>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        İlk kaba hesap. Geri ödeme basit (ilk yıl tasarrufuyla)
        {typeof hesap?.nbd_tl === "number"
          ? "; uzun dönem değerler bakım ve verim kaybını içerir."
          : "; enflasyon, tarife artışı ve bakım dahil değil."}{" "}
        Çatı statiği, mevcut tesisat ve şebeke bağlantısı için yerinde keşif gerekir.
      </p>
    </section>
  );
}
