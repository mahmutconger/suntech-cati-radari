"use client";

// Çatı kartı: seçili binanın hesabı. Rakamlar her zaman hesap motorundan (/hesap/bina) gelir.
// Bağımsız bölümler sekmelerde: Özet (değerler ve tüketim), Finans, Simülasyon, Uydu, Rapor, Varsayım.
// Haritadaki bina düğmeleri doğru sekmeyi açar ve bölümü işaretler; ilgili bölümlerin sekmesinde nokta yanar.

import Link from "next/link";
import { useMemo } from "react";
import { BookmarkCheck, BookmarkPlus, FileChartColumn, PanelsTopLeft, X } from "lucide-react";
import { FinansOzeti } from "@/components/kart/FinansOzeti";
import { binaAdi, Deger, SkorRozeti } from "@/components/ortak/Deger";
import { TuketimKutusu } from "@/components/kart/TuketimKutusu";
import { UyduKontrolu } from "@/components/kart/UyduKontrolu";
import { GunesYukleyici } from "@/components/ortak/GunesYukleyici";
import { Kaydiricilar } from "@/components/panel/Kaydiricilar";
import { PanelBolumu } from "@/components/panel/PanelBolumu";
import { SekmeCubugu, SekmeIcerikleri } from "@/components/panel/Sekmeler";
import { SimulasyonPaneli } from "@/components/simulasyon";
import { useBinaDetay, useBinaHesabi, useBinalar, useKaydet } from "@/hooks/veri";
import { BOLUM_SEKMESI, BOLUMLER, CATI_SEKMELERI, type CatiSekmesi } from "@/lib/bolumler";
import { alan, sayi, tl } from "@/lib/bicim";
import { ANA_DUGME, HATA, IKINCIL_DUGME, KART } from "@/lib/stil";
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

export function CatiKarti({ binaId }: { binaId: number }) {
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  const tuketim = useHaritaDurumu((d) => d.tuketimler[binaId] ?? null);
  const { data: binalar } = useBinalar();
  const ozet = binalar?.features.find((f) => f.properties.id === binaId)?.properties;
  const { data: detay } = useBinaDetay(binaId);
  const { data: hesap, isError, error, isFetching } = useBinaHesabi(binaId, tuketim);

  const sekme = useHaritaDurumu((d) => d.catiSekmesi);
  const sekmeSec = useHaritaDurumu((d) => d.catiSekmesiSec);
  const odak = useHaritaDurumu((d) => d.odak);
  // Haritadaki düğmeyle gidilen bölümün ilgili bölümleri hangi sekmelerde: o sekmelerde nokta yanar.
  const ilgiliSekmeler = useMemo(
    () => new Set<CatiSekmesi>(odak ? BOLUMLER[odak.bolum].ilgili.map((b) => BOLUM_SEKMESI[b]) : []),
    [odak],
  );

  const bina = detay ?? ozet;
  if (!bina) return <GunesYukleyici metin="Bina yükleniyor…" className="py-24" />;

  const tavanKwp = detay?.verim_kwh_kwp && tuketim ? tuketim.yillik_kwh / detay.verim_kwh_kwp : null;
  const tuketimeGoreKucuk = hesap && tavanKwp !== null && Math.abs(hesap.kwp - tavanKwp) < 0.5;

  const ozetSekmesi = (
    <>
      <PanelBolumu ad="ozet">
        {isError ? (
          <p className={HATA}>{error.message}</p>
        ) : !hesap ? (
          <GunesYukleyici metin="Çatı hesaplanıyor…" boyut={72} className="py-10" />
        ) : (
          <div
            className={`grid grid-cols-2 gap-2 transition-opacity @xl:grid-cols-4 ${isFetching ? "opacity-70" : ""}`}
          >
            <Deger etiket="Yıllık tasarruf" deger={`${tl(hesap.tasarruf_tl)}/yıl`} vurgu />
            <Deger etiket="Geri ödeme" deger={`${sayi(hesap.geri_odeme_yil, 1)} yıl`} vurgu />
            <Deger etiket="Çatı alanı" deger={alan(bina.alan_m2)} />
            <Deger etiket="Kurulu güç" deger={`${sayi(hesap.kwp)} kWp`} />
            <Deger etiket="Yıllık üretim" deger={`${sayi(hesap.uretim_mwh)} MWh`} />
            <Deger etiket="Yatırım" deger={tl(hesap.yatirim_tl)} />
            <Deger etiket="Önlenen CO₂" deger={`${sayi(hesap.co2_ton)} t/yıl`} />
            {detay?.en_yakin_trafo && (
              <Deger
                etiket="En yakın trafo"
                deger={`${sayi(detay.en_yakin_trafo.mesafe_km, 1)} km · ${detay.en_yakin_trafo.ad || "adsız"}`}
              />
            )}
          </div>
        )}
      </PanelBolumu>

      {tuketimeGoreKucuk && (
        <p className="text-[11px] text-murekkep/70">
          Sistem tüketiminize göre küçültüldü; çatının tamamı kullanılmıyor.
        </p>
      )}

      <PanelBolumu ad="tuketim">
        <TuketimKutusu binaId={binaId} />
      </PanelBolumu>

      <p className="text-[11px] leading-relaxed text-murekkep/50">
        İlk kaba hesap. Geri ödeme basit (ilk yıl tasarrufuyla)
        {typeof hesap?.nbd_tl === "number"
          ? "; uzun dönem değerler bakım ve verim kaybını içerir."
          : "; enflasyon, tarife artışı ve bakım dahil değil."}{" "}
        Çatı statiği, mevcut tesisat ve şebeke bağlantısı için yerinde keşif gerekir.
      </p>
    </>
  );

  return (
    <section>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mercan-koyu">OSM #{bina.id}</p>
          <div className="flex items-center gap-2">
            <h2 className="truncate text-xl font-bold tracking-tight text-murekkep">{binaAdi(bina)}</h2>
            {typeof hesap?.uygunluk_skoru === "number" && !detay?.mevcut_ges && (
              <SkorRozeti skor={hesap.uygunluk_skoru} />
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
            {detay?.verim_kwh_kwp && (
              <span className="rounded-full bg-murekkep/5 px-2 py-0.5 text-murekkep/70">
                {sayi(detay.verim_kwh_kwp)} kWh/kWp (PVGIS)
              </span>
            )}
            {detay?.mevcut_ges && (
              <span
                title="Uydu görüntüsünde ya da OSM'de bu çatıda güneş paneli var; ilk gidilecek listesine alınmaz."
                className="rounded-full bg-sky-700 px-2 py-0.5 font-semibold text-white"
              >
                Çatıda GES var
              </span>
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

      <SekmeCubugu
        etiket="Çatı bölümleri"
        sekmeler={CATI_SEKMELERI}
        secili={sekme}
        onSec={sekmeSec}
        ilgili={ilgiliSekmeler}
      />

      <SekmeIcerikleri
        sekmeler={CATI_SEKMELERI}
        secili={sekme}
        icerikler={{
          ozet: ozetSekmesi,
          finans: (
            <PanelBolumu ad="finans">
              {hesap ? (
                <FinansOzeti hesap={hesap} />
              ) : (
                <GunesYukleyici metin="Finans hesaplanıyor…" boyut={72} className="py-10" />
              )}
            </PanelBolumu>
          ),
          // Saatlik simülasyon, pil, kredi, statik ve şebeke: Mehmet'in bileşeni (components/simulasyon/).
          simulasyon: (
            <SimulasyonPaneli binaId={binaId} alanM2={bina.alan_m2} yillikTuketimKwh={tuketim?.yillik_kwh ?? null} />
          ),
          uydu: (
            <PanelBolumu ad="uydu">
              <UyduKontrolu binaId={binaId} />
            </PanelBolumu>
          ),
          rapor: (
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
                <div className="grid gap-2 @xl:grid-cols-2">
                  <Link href={`/rapor/${binaId}`} className={`${ANA_DUGME} w-full`}>
                    <PanelsTopLeft className="h-4 w-4" aria-hidden />
                    Raporu aç (PDF)
                  </Link>
                  <KaydetDugmesi binaId={binaId} />
                </div>
              </div>
            </PanelBolumu>
          ),
          varsayim: (
            <PanelBolumu ad="varsayim">
              <Kaydiricilar />
            </PanelBolumu>
          ),
        }}
      />
    </section>
  );
}
