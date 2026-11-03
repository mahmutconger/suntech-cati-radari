"use client";

// Tek sayfalık ön fizibilite raporu (§22.4). "PDF olarak indir" tarayıcının yazdırma penceresini açar
// (window.print()); orada "PDF olarak kaydet" seçilir, kütüphane gerekmez.
// Rakamlar haritadaki varsayımlar ve girilen tüketimle aynı; hepsi backend'in hesap motorundan.

import { useEffect, useState } from "react";
import { Download, Sun } from "lucide-react";
import { GunesYukleyici } from "@/components/ortak/GunesYukleyici";
import { GeriDugmesi } from "@/components/ortak/GeriDugmesi";
import { NakitAkisiGrafigi } from "@/components/rapor/NakitAkisiGrafigi";
import { binaAdi } from "@/components/ortak/Deger";
import {
  useBinaDetay,
  useBinaHesabi,
  useFinans,
  useOsblar,
  useUyduOnbellegi,
  uyduGoruntuAdresi,
} from "@/hooks/veri";
import { alan, sayi, tl } from "@/lib/bicim";
import { ANA_DUGME } from "@/lib/stil";
import { useHaritaDurumu } from "@/store/harita";
import type { CokgenGeometri, Varsayimlar } from "@/types/gecici";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" });

const yuzde = (v: number, ondalik = 0) =>
  `%${(v * 100).toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik })}`;
const tlKwh = (v: number) => `${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL/kWh`;

/** Rapordaki varsayımlar tablosu: etiket ve biçim. Backend'in bilmediği alanlar zaten store'da yok. */
const VARSAYIM_ETIKETLERI: Partial<Record<keyof Varsayimlar, [string, (v: number) => string]>> = {
  kullanilabilir_oran: ["Kullanılabilir çatı oranı", (v) => yuzde(v)],
  m2_kwp: ["Panel yoğunluğu", (v) => `${sayi(v, 1)} m²/kWp`],
  tarife_tl_kwh: ["Elektrik tarifesi (vergisiz)", tlKwh],
  fazla_fiyat_tl_kwh: ["İhtiyaç fazlası satış fiyatı", tlKwh],
  oz_tuketim_orani: ["Öz tüketim oranı", (v) => yuzde(v)],
  maliyet_carpani: ["Kurulum maliyeti çarpanı", (v) => `×${sayi(v, 1)}`],
  emisyon_faktoru: ["Şebeke emisyon faktörü", (v) => `${v.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂/MWh`],
  omur_yil: ["Sistem ömrü", (v) => `${Math.round(v)} yıl`],
  degradasyon: ["Yıllık verim kaybı", (v) => yuzde(v, 1)],
  bakim_orani: ["Yıllık bakım (yatırıma oranı)", (v) => yuzde(v, 1)],
  iskonto_orani: ["İskonto oranı (reel)", (v) => yuzde(v, 1)],
  tarife_artisi: ["Tarife artışı (reel)", (v) => yuzde(v, 1)],
};

function Metrik({ etiket, deger, vurgu = false }: { etiket: string; deger: string; vurgu?: boolean }) {
  return (
    <div
      className={`min-w-0 rounded-lg border px-2.5 py-1.5 ${
        vurgu ? "border-seftali/70 bg-gradient-to-br from-limon/50 to-seftali/25" : "border-murekkep/10"
      }`}
    >
      <p className="truncate text-[9px] uppercase tracking-wide text-murekkep/55">{etiket}</p>
      <p className="text-[13px] font-bold leading-tight text-murekkep">{deger}</p>
    </div>
  );
}

/** Uydu görüntüsü yoksa (sahte modda ya da uç yayında değilken) çatının ana hatlarını çizer. */
function CatiCizimi({ geometri }: { geometri: CokgenGeometri }) {
  const halka = geometri.type === "Polygon" ? geometri.coordinates[0] : geometri.coordinates[0][0];
  const lonlar = halka.map((n) => n[0]);
  const latlar = halka.map((n) => n[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...lonlar), Math.max(...lonlar), Math.min(...latlar), Math.max(...latlar)];
  const olcek = Math.cos((((minY + maxY) / 2) * Math.PI) / 180); // boylamı enleme göre düzelt
  const g = (maxX - minX) * olcek || 1;
  const y = maxY - minY || 1;
  const kenar = Math.max(g, y);
  const noktalar = halka
    .map(([lon, lat]) => `${(((lon - minX) * olcek + (kenar - g) / 2) / kenar) * 90 + 5},${95 - (((lat - minY) + (kenar - y) / 2) / kenar) * 90}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full bg-[#f3efe6]">
      <polygon points={noktalar} fill="#e1eb71" stroke="#c9822f" strokeWidth="1.2" />
    </svg>
  );
}

function UyduGorseli({ binaId, geometri }: { binaId: number; geometri: CokgenGeometri | undefined }) {
  // Resim, bina verisi istemcide yüklendikten sonra oluşturulur; sunucu HTML'inde olsaydı
  // yükleme hatası React bağlanmadan gerçekleşir ve yedek çizime geçilemezdi.
  const adres = geometri ? uyduGoruntuAdresi(binaId) : null;
  const [hata, setHata] = useState(false);
  return (
    <figure className="overflow-hidden rounded-lg border border-murekkep/10">
      <div className="aspect-square w-full">
        {adres && !hata ? (
          // Uydu karosu backend'den JPEG olarak gelir; next/image'ın optimizasyonuna gerek yok.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={adres} alt="Çatının uydu görüntüsü" className="h-full w-full object-cover" onError={() => setHata(true)} />
        ) : geometri ? (
          <CatiCizimi geometri={geometri} />
        ) : null}
      </div>
      <figcaption className="px-2 py-1 text-[9px] text-murekkep/55">
        {adres && !hata ? "Uydu görüntüsü: Esri, Maxar, Earthstar Geographics" : "Çatının ana hatları (OpenStreetMap)"}
      </figcaption>
    </figure>
  );
}

export function RaporSayfasi({ binaId }: { binaId: number }) {
  const tuketim = useHaritaDurumu((d) => d.tuketimler[binaId] ?? null);
  const varsayimlar = useHaritaDurumu((d) => d.varsayimlar);
  const seciliOsb = useHaritaDurumu((d) => d.seciliOsb);
  const { data: osblar } = useOsblar();
  const { data: detay, isError: detayHatasi } = useBinaDetay(Number.isFinite(binaId) ? binaId : null);
  const { data: hesap } = useBinaHesabi(Number.isFinite(binaId) ? binaId : null, tuketim);
  const { data: yillar } = useFinans(Number.isFinite(binaId) ? binaId : null, tuketim);
  const { data: uydu } = useUyduOnbellegi(Number.isFinite(binaId) ? binaId : null);
  const [bugun] = useState(() => tarihBicimi.format(new Date()));

  const ad = detay ? binaAdi(detay) : `Bina #${binaId}`;
  // OSB adı binanın kendi osb alanından (GET /binalar/{id}); rapor doğrudan açılınca da doğru olsun.
  const osbId = detay?.osb ?? seciliOsb;
  const osbAdi = osblar?.find((o) => o.id === osbId)?.ad ?? (osbId === "manisa" ? "Manisa OSB" : osbId);
  useEffect(() => {
    // Yazdırma penceresinde PDF dosyasının adı başlıktan gelir.
    document.title = `Çatı Radarı ön fizibilite - ${ad}`;
  }, [ad]);

  const hazir = Boolean(detay && hesap);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-zemin via-zemin to-limon/35 py-6 print:bg-white print:py-0">
      {/* Bina ve hesap gelene kadar ekranın ortasında dönen güneş */}
      {!hazir && !detayHatasi && (
        <div className="yazdirma-gizle pointer-events-none fixed inset-0 z-50 flex items-center justify-center print:hidden">
          <div className="cam rounded-3xl px-8 py-6">
            <GunesYukleyici metin="Rapor hazırlanıyor…" boyut={104} />
          </div>
        </div>
      )}
      <div className="yazdirma-gizle mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-4 print:hidden">
        <div className="flex items-center gap-3">
          <GeriDugmesi etiket="Haritaya dön" href="/" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mercan-koyu">Rapor</p>
            <p className="text-sm font-semibold text-murekkep">Ön fizibilite · A4</p>
          </div>
        </div>
        <button type="button" onClick={() => window.print()} disabled={!hazir} className={ANA_DUGME}>
          <Download className="h-4 w-4" aria-hidden />
          PDF olarak indir
        </button>
      </div>

      <article className="rapor-sayfasi mx-auto w-full max-w-[210mm] rounded-sm bg-white p-8 text-murekkep shadow-xl ring-1 ring-murekkep/5 print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0">
        {detayHatasi && <p className="text-sm text-mercan-koyu">Bina bulunamadı.</p>}

        <header className="flex items-start justify-between border-b-2 border-seftali pb-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mercan-koyu">
              <Sun className="h-3.5 w-3.5" aria-hidden />
              Çatı Radarı · Ön fizibilite raporu
            </p>
            <h1 className="mt-1 text-2xl font-bold">{ad}</h1>
            <p className="text-xs text-murekkep/55">
              {osbAdi} · OSM #{binaId}
              {detay && ` · ${alan(detay.alan_m2)} çatı`}
            </p>
          </div>
          <div className="text-right text-xs text-murekkep/55">
            <p>{bugun}</p>
            {typeof hesap?.uygunluk_skoru === "number" && (
              <p className="mt-1 text-lg font-bold text-emerald-700">
                {Math.round(hesap.uygunluk_skoru)}
                <span className="text-xs font-medium text-murekkep/55">/100 uygunluk</span>
              </p>
            )}
          </div>
        </header>

        <section className="mt-4 grid grid-cols-[38%_1fr] gap-4">
          <div className="space-y-2">
            <UyduGorseli binaId={binaId} geometri={detay?.geometri} />
            <div className="rounded-lg border border-murekkep/10 px-3 py-2 text-[11px] leading-snug">
              <p className="font-semibold">Uydu kontrolü</p>
              {uydu ? (
                <p className="text-murekkep/70">
                  {uydu.panel === "var"
                    ? `Çatıda panel görünüyor (yaklaşık ${yuzde(uydu.kaplama_orani)} kaplı).`
                    : uydu.panel === "yok"
                      ? "Çatıda panel görünmüyor."
                      : "Görüntüden emin olunamadı."}{" "}
                  {uydu.aciklama} <span className="text-murekkep/45">(güven {yuzde(uydu.guven)}, {uydu.model})</span>
                </p>
              ) : (
                <p className="text-murekkep/55">Bu çatı için uydu kontrolü yapılmadı.</p>
              )}
            </div>
            {detay && (
              <div className="rounded-lg border border-murekkep/10 px-3 py-2 text-[11px] leading-snug text-murekkep/70">
                {detay.verim_kwh_kwp && <p>Güneş verimi: {sayi(detay.verim_kwh_kwp)} kWh/kWp·yıl (PVGIS)</p>}
                {detay.en_yakin_trafo && (
                  <p>
                    En yakın trafo: {detay.en_yakin_trafo.ad || "adsız"}, {sayi(detay.en_yakin_trafo.mesafe_km, 1)} km
                  </p>
                )}
                <p>Mevcut panel: {detay.mevcut_ges ? "var" : "yok"}</p>
                {tuketim && <p>Firmanın yıllık tüketimi: {sayi(tuketim.yillik_kwh / 1000)} MWh</p>}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            {hesap ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 print:grid-cols-3">
                <Metrik etiket="Yıllık tasarruf" deger={tl(hesap.tasarruf_tl)} vurgu />
                <Metrik etiket="Geri ödeme" deger={`${sayi(hesap.geri_odeme_yil, 1)} yıl`} vurgu />
                <Metrik etiket="Yatırım" deger={tl(hesap.yatirim_tl)} />
                <Metrik etiket="Kurulu güç" deger={`${sayi(hesap.kwp)} kWp`} />
                <Metrik etiket="Yıllık üretim" deger={`${sayi(hesap.uretim_mwh)} MWh`} />
                <Metrik etiket="Önlenen CO₂" deger={`${sayi(hesap.co2_ton)} t/yıl`} />
                {typeof hesap.net_kazanc_25y_tl === "number" && (
                  <Metrik etiket={`${Math.round(varsayimlar.omur_yil ?? 25)} yılda net kazanç`} deger={tl(hesap.net_kazanc_25y_tl)} vurgu />
                )}
                {typeof hesap.nbd_tl === "number" && <Metrik etiket="Net bugünkü değer" deger={tl(hesap.nbd_tl)} />}
                {hesap.ic_verim_orani !== undefined && (
                  <Metrik
                    etiket="İç verim oranı"
                    deger={typeof hesap.ic_verim_orani === "number" ? yuzde(hesap.ic_verim_orani, 1) : "—"}
                  />
                )}
                {typeof hesap.lcoe_tl_kwh === "number" && (
                  <Metrik etiket="LCOE (üretim maliyeti)" deger={tlKwh(hesap.lcoe_tl_kwh)} />
                )}
              </div>
            ) : (
              <p className="text-sm text-murekkep/55">Hesaplanıyor…</p>
            )}

            {yillar && yillar.length > 0 && hesap ? (
              <div className="rounded-lg border border-murekkep/10 p-2">
                <p className="mb-1 text-xs font-semibold">{yillar.length} yıllık nakit akışı</p>
                <div className="overflow-hidden">
                  <NakitAkisiGrafigi yillar={yillar} yatirim={hesap.yatirim_tl} />
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-murekkep/20 px-3 py-2 text-[11px] text-murekkep/55">
                25 yıllık nakit akışı hesabı yayına alınınca burada grafik görünecek.
              </p>
            )}
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-murekkep/55">Kullanılan varsayımlar</h2>
            <table className="w-full text-[11px]">
              <tbody>
                {(Object.keys(varsayimlar) as (keyof Varsayimlar)[]).map((k) => {
                  const tanim = VARSAYIM_ETIKETLERI[k];
                  const v = varsayimlar[k];
                  if (!tanim || typeof v !== "number") return null;
                  return (
                    <tr key={k} className="border-b border-murekkep/5">
                      <td className="py-0.5 pr-2 text-murekkep/70">{tanim[0]}</td>
                      <td className="py-0.5 text-right font-medium">{tanim[1](v)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 text-[11px] leading-snug">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-murekkep/55">Dikkat edilecekler</h2>
            <ul className="list-disc space-y-1 pl-4 text-murekkep/80">
              <li>Çatı statiği: panel ve ray için yaklaşık 12-15 kg/m² ek yük; kesin karar statik raporla verilir.</li>
              <li>Mevcut tesisat ve trafo kapasitesi şebeke bağlantısını sınırlayabilir.</li>
              <li>Geri ödeme basit hesaptır (ilk yıl tasarrufu); uzun dönem değerler bakım ve verim kaybını içerir.</li>
            </ul>
            <h2 className="pt-1 text-xs font-semibold uppercase tracking-wide text-murekkep/55">Sonraki adım</h2>
            <p className="text-murekkep/80">Yerinde keşif ve en az iki GES firmasından teklif.</p>
          </div>
        </section>

        <footer className="mt-5 border-t border-murekkep/10 pt-2 text-[9px] leading-snug text-murekkep/55">
          <p className="font-semibold text-murekkep/80">
            Bu bir ön taramadır. Çatı statiği, mevcut tesisat ve şebeke bağlantısı için yerinde keşif gerekir.
          </p>
          <p>
            Kaynaklar: PVGIS (AB JRC), EPDK sanayi tarifesi, Lisanssız Elektrik Üretim Yönetmeliği (RG 33212), ETKB şebeke
            emisyon faktörü, OpenStreetMap. Çatı Radarı · SunTech · COP31 Manisa Hackathonu 2026.
          </p>
        </footer>
      </article>
    </div>
  );
}
