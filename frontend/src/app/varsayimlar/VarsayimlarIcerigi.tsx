"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { components } from "@/types/api";

type Sema = components["schemas"];
export type VarsayimKaynagi = Sema["VarsayimKaynagiDto"];
export type VarsayimlarYaniti = Sema["VarsayimlarYaniti"];

const ORNEK_CATILAR = [
  {
    sistem: "100 kWp",
    uretim: "134 MWh/yıl",
    tasarruf: "0,60 M TL/yıl",
    yatirim: "3,15 M TL",
    geriOdeme: "5,3 yıl",
    co2: "84 t/yıl",
  },
  {
    sistem: "500 kWp",
    uretim: "670 MWh/yıl",
    tasarruf: "2,98 M TL/yıl",
    yatirim: "12,8 M TL",
    geriOdeme: "4,3 yıl",
    co2: "418 t/yıl",
  },
  {
    sistem: "1.000 kWp",
    uretim: "1.340 MWh/yıl",
    tasarruf: "5,96 M TL/yıl",
    yatirim: "21,2 M TL",
    geriOdeme: "3,6 yıl",
    co2: "836 t/yıl",
  },
  {
    sistem: "10.000 m² çatı (692 kWp)",
    uretim: "928 MWh/yıl",
    tasarruf: "4,12 M TL/yıl",
    yatirim: "17,8 M TL",
    geriOdeme: "4,3 yıl",
    co2: "579 t/yıl",
  },
];

export function VarsayimlarIcerigi() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["varsayimlar-kaynaklar"],
    queryFn: () => api.get<VarsayimlarYaniti>("/varsayimlar"),
    staleTime: Infinity,
  });

  const kaynaklar = data?.kaynaklar ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:underline"
        >
          ← Haritaya ve analize dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          Varsayımlar, Hesap Yöntemi ve Kaynaklar
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Çatı Radarı’ndaki bütün rakamlar deterministik hesap motorundan üretilir.
          Aşağıdaki tüm varsayımlar ilk kaba tarama içindir ve ana ekrandaki
          kaydırıcılarla değiştirilebilir.
        </p>
      </header>

      {/* Varsayımlar ve Kaynaklar Tablosu */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-slate-100">
            1. Varsayılan Değerler ve Resmî Kaynaklar
          </h2>
        </div>

        {isPending && (
          <p className="p-6 text-sm text-slate-400">Varsayımlar yükleniyor…</p>
        )}

        {isError && (
          <p className="m-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error instanceof Error ? error.message : "Varsayımlar alınamadı."}
          </p>
        )}

        {kaynaklar.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Varsayım</th>
                  <th className="px-4 py-3">Varsayılan Değer</th>
                  <th className="px-4 py-3">Kaydırıcı Aralığı</th>
                  <th className="px-4 py-3">Kaynak ve Açıklama</th>
                  <th className="px-4 py-3">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {kaynaklar.map((k) => (
                  <tr key={k.anahtar} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-slate-100">{k.ad}</td>
                    <td className="px-4 py-3 font-semibold text-amber-300">{k.deger}</td>
                    <td className="px-4 py-3 text-slate-400">{k.aralik}</td>
                    <td className="px-4 py-3 leading-relaxed">
                      <p className="text-slate-200">{k.kaynak}</p>
                      {k.aciklama && (
                        <p className="mt-0.5 text-[11px] text-slate-400">{k.aciklama}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      {k.tarih}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Deterministik Formüller */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-100">
            2. Yıllık Hesap Motoru Formülleri
          </h2>
          <pre className="overflow-x-auto rounded-xl bg-slate-900/90 p-3.5 text-xs leading-relaxed text-amber-200">
{`kwp      = alan_m2 × kullanilabilir_oran ÷ m2_kwp
           (tüketim girildiyse en çok: yillik_tuketim_kwh ÷ verim)
uretim   = kwp × verim                                     [kWh/yıl]
tasarruf = uretim × (oz × tarife + (1 − oz) × fazla_fiyat) [TL/yıl]
yatirim  = kwp × birim_maliyet(kwp) × maliyet_carpani      [TL]
geri_od  = yatirim ÷ tasarruf                              [yıl]
co2      = (uretim ÷ 1000) × emisyon_faktoru               [tCO₂/yıl]`}
          </pre>
          <p className="text-xs leading-relaxed text-slate-400">
            1 Mayıs 2026’dan itibaren sanayi tesislerinde elektrik mahsuplaşması saatlik
            yapılmaktadır (Resmî Gazete, 2 Nisan 2026, sayı 33212). Saatlik simülasyon
            bölümünde PVGIS’in 8.760 saatlik üretim serisi (UTC+3 Türkiye saatine
            kaydırılarak) seçilen vardiya profiliyle saat saat karşılaştırılır.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-100">
            3. Referans Kontrol Tablosu (1.340 kWh/kWp, %80 Öz Tüketim)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 text-[11px] text-slate-400">
                <tr>
                  <th className="py-2 pr-2">Sistem</th>
                  <th className="py-2 px-2">Üretim</th>
                  <th className="py-2 px-2">Tasarruf</th>
                  <th className="py-2 px-2">Yatırım</th>
                  <th className="py-2 px-2">Geri Ödeme</th>
                  <th className="py-2 pl-2">CO₂</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ORNEK_CATILAR.map((o) => (
                  <tr key={o.sistem}>
                    <td className="py-2 pr-2 font-medium text-slate-100">{o.sistem}</td>
                    <td className="py-2 px-2">{o.uretim}</td>
                    <td className="py-2 px-2 text-amber-300">{o.tasarruf}</td>
                    <td className="py-2 px-2">{o.yatirim}</td>
                    <td className="py-2 px-2 font-semibold text-emerald-300">{o.geriOdeme}</td>
                    <td className="py-2 pl-2">{o.co2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            * Bu bir ön taramadır. Çatı statiği (12–15 kg/m² yayılı ek yük), mevcut
            elektrik tesisatı ve trafo bağlantı kapasitesi için yerinde mühendislik keşfi
            yapılmalıdır.
          </p>
        </div>
      </section>
    </div>
  );
}
