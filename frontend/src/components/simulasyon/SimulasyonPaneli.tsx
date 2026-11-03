"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calculator, ChevronDown, Landmark } from "lucide-react";
import { PanelBolumu } from "@/components/panel/PanelBolumu";
import { api, SAHTE_VERI } from "@/lib/api";
import { sayi, tl } from "@/lib/bicim";
import { GIRDI_KUCUK, GRAFIK, GRAFIK_IPUCU, KART } from "@/lib/stil";
import { useHaritaDurumu } from "@/store/harita";
import type { components } from "@/types/api";

type Sema = components["schemas"];

export type SimulasyonIstegi = Sema["SimulasyonIstegi"];
export type SimulasyonSonucu = Sema["SimulasyonSonucuDto"];
export type PilSonucu = Sema["PilSonucuDto"];
export type KrediSonucu = Sema["KrediSonucuDto"];
export type StatikSonucu = Sema["StatikSonucuDto"];
export type SebekeSonucu = Sema["SebekeSonucuDto"];
export type SaatlikGunProfili = Sema["SaatlikGunProfiliDto"];
export type VardiyaTipi = NonNullable<SimulasyonIstegi["vardiya"]>;

export interface YillikNakitAkisiSatiri {
  yil: number;
  uretim_mwh: number;
  tasarruf_tl: number;
  bakim_tl: number;
  net_akis_tl: number;
  kumulatif_tl: number;
}

export interface SimulasyonPaneliProps {
  binaId?: number;
  alanM2?: number;
  yillikTuketimKwh?: number | null;
}

const VARDIYALAR: { kod: VardiyaTipi; etiket: string; saatler: string }[] = [
  { kod: "tek", etiket: "Tek vardiya", saatler: "Hafta içi 08–17" },
  { kod: "iki", etiket: "İki vardiya", saatler: "Hafta içi 06–22" },
  { kod: "uc", etiket: "Üç vardiya", saatler: "7/24 kesintisiz" },
];

/** Değer değişimi durduktan `ms` sonra güncellenir; sürükleme sırasında her milisaniyede istek atılmasını engeller. */
function useGeciktirilmisDeger<T>(deger: T, ms = 450): T {
  const [gecikmeli, setGecikmeli] = useState<T>(deger);
  useEffect(() => {
    const zamanlayici = setTimeout(() => setGecikmeli(deger), ms);
    return () => clearTimeout(zamanlayici);
  }, [deger, ms]);
  return gecikmeli;
}

/** 25 yıllık nakit akışı dizisini deterministik formülle üretir (API yedek/önizleme için). */
function yerelYillikNakitAkisiHesapla(
  ilkYilUretimMwh: number,
  ilkYilTasarrufTl: number,
  yatirimTl: number,
  omurYil = 25,
  degradasyon = 0.005,
  bakimOrani = 0.01,
  tarifeArtisi = 0.0,
): YillikNakitAkisiSatiri[] {
  if (ilkYilUretimMwh <= 0 || yatirimTl <= 0) return [];
  const satirlar: YillikNakitAkisiSatiri[] = [];
  const bakimYillik = yatirimTl * bakimOrani;
  let kumulatif = -yatirimTl;

  for (let yil = 1; yil <= omurYil; yil++) {
    const yaslanma = Math.pow(1 - degradasyon, yil - 1);
    const tarifeCarpan = Math.pow(1 + tarifeArtisi, yil - 1);
    const uretim_mwh = Math.round(ilkYilUretimMwh * yaslanma * 100) / 100;
    const tasarruf_tl = Math.round(ilkYilTasarrufTl * yaslanma * tarifeCarpan);
    const bakim_tl = Math.round(bakimYillik);
    const net_akis_tl = tasarruf_tl - bakim_tl;
    kumulatif += net_akis_tl;
    satirlar.push({
      yil,
      uretim_mwh,
      tasarruf_tl,
      bakim_tl,
      net_akis_tl,
      kumulatif_tl: Math.round(kumulatif),
    });
  }
  return satirlar;
}

export interface YirmiBesYillikGrafikProps {
  veriler: YillikNakitAkisiSatiri[];
  yukseklikSinifi?: string;
}

/** 25 yıllık kümülatif nakit akışı grafiği (SimulasyonPaneli ve PDF rapor sayfası için). */
export function YirmiBesYillikGrafik({
  veriler,
  yukseklikSinifi = "h-52",
}: YirmiBesYillikGrafikProps) {
  if (!veriler.length) return null;

  const sonYil = veriler[veriler.length - 1];
  const basaBasYili = veriler.find((v) => v.kumulatif_tl >= 0)?.yil ?? null;

  return (
    <div className="space-y-1.5 rounded-xl bg-white p-3 ring-1 ring-murekkep/10">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium text-murekkep">
          25 yıllık kümülatif nakit akışı
        </span>
        <span className="text-emerald-700 font-semibold">
          25Y Net: {tl(sonYil.kumulatif_tl)}
        </span>
      </div>
      <div className={`${yukseklikSinifi} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={veriler}
            margin={{ top: 6, right: 6, left: -14, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRAFIK.izgara}
            />
            <XAxis
              dataKey="yil"
              tickFormatter={(v) => `${v}.y`}
              stroke={GRAFIK.eksen}
              fontSize={10}
              interval={4}
            />
            <YAxis
              stroke={GRAFIK.eksen}
              fontSize={10}
              tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`}
            />
            <Tooltip
              contentStyle={GRAFIK_IPUCU}
              labelFormatter={(yil) => `${yil}. Yıl (%0,5/yıl yaşlanma, %1 bakım)`}
              formatter={(deger, ad) => [tl(Number(deger)), String(ad)]}
            />
            <ReferenceLine
              y={0}
              stroke={GRAFIK.sifir}
              strokeDasharray="3 3"
            />
            <Area
              type="monotone"
              dataKey="kumulatif_tl"
              name="Kümülatif net nakit akışı"
              stroke="#059669"
              fill="rgba(5, 150, 105, 0.15)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between pt-0.5 text-[10px] text-murekkep/55">
        <span>
          Başabaş yılı:{" "}
          <strong className="text-murekkep">
            {basaBasYili !== null ? `${basaBasYili}. yıl` : ">25 yıl"}
          </strong>
        </span>
        <span>%0,5/yıl degradasyon · %1/yıl bakım düşülmüş</span>
      </div>
    </div>
  );
}

export function SimulasyonPaneli({
  binaId = 0,
  yillikTuketimKwh = null,
}: SimulasyonPaneliProps) {
  const hamVarsayimlar = useHaritaDurumu((d) => d.varsayimlar);
  const varsayimlar = useGeciktirilmisDeger(hamVarsayimlar, 450);
  const gecikmeliTuketimKwh = useGeciktirilmisDeger(yillikTuketimKwh, 450);

  const [acik, setAcik] = useState(true);
  const [vardiya, setVardiya] = useState<VardiyaTipi>("iki");

  // Pil kaydırıcısı: sürüklerken yalnızca ekrandaki sayı değişir, bırakınca (onPointerUp/onKeyUp) istek tetiklenir
  const [pilGorunenKwh, setPilGorunenKwh] = useState<number>(0);
  const [pilKapasiteKwh, setPilKapasiteKwh] = useState<number>(0);

  const [sebekeyeVermeden, setSebekeyeVermeden] = useState<boolean>(false);
  const [trafoKapasiteMwMetin, setTrafoKapasiteMwMetin] = useState<string>("");
  const gecikmeliTrafoMetin = useGeciktirilmisDeger(trafoKapasiteMwMetin, 450);

  const [krediAcik, setKrediAcik] = useState<boolean>(false);
  const [aylikFaizYuzde, setAylikFaizYuzde] = useState<number>(2.5);
  const [vadeAy, setVadeAy] = useState<number>(48);
  const [pesinatYuzde, setPesinatYuzde] = useState<number>(20);
  const [statikAcik, setStatikAcik] = useState<boolean>(false);

  // Haritadaki bina düğmeleri (simülasyon, kredi, finans) paneli ve kredi bölümünü dışarıdan açar.
  // Hedef bölüm henüz çizilmediyse (simülasyon yükleniyor ya da hata verdi) panelin kendisine kayılır;
  // sonuç gelince bölüm kendi kendine kayar (PanelBolumu).
  const kabukRef = useRef<HTMLElement>(null);
  useEffect(
    () =>
      useHaritaDurumu.subscribe((d, onceki) => {
        if (!d.odak || d.odak === onceki.odak) return;
        const { bolum } = d.odak;
        if (bolum !== "rapor") setAcik(true);
        if (bolum === "kredi") setKrediAcik(true);
        if (bolum === "simulasyon" || bolum === "kredi") {
          requestAnimationFrame(() => {
            if (!document.getElementById(`bolum-${bolum}`)) {
              kabukRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          });
        }
      }),
    [],
  );

  const trafoKalanKapasiteMw = useMemo(() => {
    const temiz = gecikmeliTrafoMetin.trim().replace(",", ".");
    if (!temiz) return null;
    const n = Number(temiz);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [gecikmeliTrafoMetin]);

  const hamIstekGovdesi: SimulasyonIstegi = useMemo(
    () => ({
      varsayimlar,
      vardiya,
      yillik_tuketim_kwh: gecikmeliTuketimKwh,
      pil:
        pilKapasiteKwh > 0
          ? {
              kapasite_kwh: pilKapasiteKwh,
              guc_kw: pilKapasiteKwh * 0.5,
              birim_maliyet_tl_kwh: 12500,
              verim: 0.9,
            }
          : null,
      kredi: krediAcik
        ? {
            aylik_faiz_orani: aylikFaizYuzde / 100,
            vade_ay: vadeAy,
            pesinat_orani: pesinatYuzde / 100,
          }
        : null,
      sebeke: {
        sebekeye_vermeden: sebekeyeVermeden,
        trafo_kalan_kapasite_mw: trafoKalanKapasiteMw,
      },
    }),
    [
      varsayimlar,
      vardiya,
      gecikmeliTuketimKwh,
      pilKapasiteKwh,
      krediAcik,
      aylikFaizYuzde,
      vadeAy,
      pesinatYuzde,
      sebekeyeVermeden,
      trafoKalanKapasiteMw,
    ],
  );

  const istekGovdesi = useGeciktirilmisDeger(hamIstekGovdesi, 300);

  const {
    data: s,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["hesap", "simulasyon", binaId, istekGovdesi],
    queryFn: () =>
      api.post<SimulasyonSonucu>(`/hesap/simulasyon/${binaId}`, istekGovdesi),
    enabled: binaId > 0 && acik,
    placeholderData: keepPreviousData,
  });

  // 25 yıllık nakit akışı sorgusu (`POST /api/v1/hesap/finans/{binaId}`)
  const { data: finansAkislari } = useQuery({
    queryKey: ["hesap", "finans", binaId, varsayimlar, gecikmeliTuketimKwh],
    queryFn: async () => {
      if (SAHTE_VERI) return null;
      try {
        return await api.post<YillikNakitAkisiSatiri[]>(
          `/hesap/finans/${binaId}`,
          {
            varsayimlar,
            yillik_tuketim_kwh: gecikmeliTuketimKwh,
          },
        );
      } catch {
        return null;
      }
    },
    enabled: binaId > 0 && acik,
    placeholderData: keepPreviousData,
  });

  const nakitAkisi25Yil = useMemo(() => {
    if (finansAkislari && finansAkislari.length > 0) {
      return finansAkislari;
    }
    if (!s) return [];
    const etkinYatirim =
      s.pil && s.pil.kapasite_kwh > 0 ? s.pil.toplam_yatirim_tl : s.yatirim_tl;
    const etkinTasarruf =
      s.pil && s.pil.kapasite_kwh > 0 ? s.pil.toplam_tasarruf_tl : s.tasarruf_tl;
    return yerelYillikNakitAkisiHesapla(
      s.uretim_mwh,
      etkinTasarruf,
      etkinYatirim,
    );
  }, [finansAkislari, s]);

  const maxPilKwh = s ? Math.max(500, Math.min(5000, Math.round(s.kwp * 2))) : 2000;

  return (
    <section
      ref={kabukRef}
      aria-label="Saatlik simülasyon ve finansman"
      className={`${KART} scroll-mt-4 text-xs text-murekkep/80`}
    >
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-limon to-seftali">
            <Calculator className="h-4 w-4 text-murekkep" aria-hidden />
          </span>
          <div>
          <span className="text-sm font-semibold text-murekkep">
            Saatlik Simülasyon · 25Y Finans · Pil · Kredi
          </span>
          {s && (
            <p className="text-[11px] text-murekkep/55">
              Öz tüketim: %{Math.round(s.oz_tuketim_orani * 100)} · Geri ödeme:{" "}
              {sayi(s.geri_odeme_yil, 1)} yıl
            </p>
          )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-murekkep/55 transition-transform ${acik ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {acik && (
        <div className="space-y-5 rounded-b-2xl border-t border-murekkep/10 bg-[#f7f4ec] px-3 pb-4 pt-4">
          {isPending && !s && (
            <p className="text-xs text-murekkep/55">Saatlik simülasyon hesaplanıyor…</p>
          )}

          {isError && (
            <p className="rounded-xl bg-mercan/10 px-3 py-2 text-xs text-mercan-koyu">
              {error instanceof Error ? error.message : "Simülasyon alınamadı."}
            </p>
          )}

          {s && (
            <>
              <PanelBolumu ad="simulasyon" className="-mx-1.5 -mt-1.5 space-y-3 px-1.5 pb-1.5 pt-4">
              {/* 1. Vardiya Seçimi */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-murekkep">Çalışma vardiyası</span>
                  <span className="rounded-full bg-limon/50 px-2 py-0.5 text-[11px] font-semibold text-murekkep">
                    Saatlik öz tüketim: %{Math.round(s.oz_tuketim_orani * 100)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {VARDIYALAR.map((v) => {
                    const secili = vardiya === v.kod;
                    return (
                      <button
                        key={v.kod}
                        type="button"
                        onClick={() => setVardiya(v.kod)}
                        className={`rounded-xl border px-2 py-2 text-left transition ${
                          secili
                            ? "border-seftali bg-gradient-to-br from-limon/60 to-seftali/40 text-murekkep"
                            : "border-murekkep/10 bg-white text-murekkep/75 hover:bg-limon/20"
                        }`}
                      >
                        <p className="font-semibold">{v.etiket}</p>
                        <p className="text-[10px] text-murekkep/50">{v.saatler}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Günlük Ortalama Üretim ve Tüketim Grafiği (Recharts) */}
              <div className="space-y-1.5 rounded-xl bg-white p-3 ring-1 ring-murekkep/10">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-murekkep">
                    Günlük ortalama profil (kW, saatlik)
                  </span>
                  <span className="text-murekkep/55">
                    <span className="text-[#c9822f]">● Üretim</span> ·{" "}
                    <span className="text-sky-600">● Tüketim</span>
                  </span>
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={s.gunluk_profil}
                      margin={{ top: 6, right: 6, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={GRAFIK.izgara}
                      />
                      <XAxis
                        dataKey="saat"
                        tickFormatter={(v) => `${v}:00`}
                        stroke={GRAFIK.eksen}
                        fontSize={10}
                        interval={5}
                      />
                      <YAxis stroke={GRAFIK.eksen} fontSize={10} />
                      <Tooltip
                        contentStyle={GRAFIK_IPUCU}
                        labelFormatter={(saat) => `Saat ${saat}:00`}
                      />
                      <Area
                        type="monotone"
                        dataKey="uretim_kw"
                        name="Üretim (kW)"
                        stroke="#ecab69"
                        fill="rgba(225, 235, 113, 0.45)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="tuketim_kw"
                        name="Tüketim (kW)"
                        stroke="#0284c7"
                        fill="rgba(2, 132, 199, 0.1)"
                        strokeWidth={1.75}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="rounded-lg bg-[#f3efe5] px-2.5 py-1.5 ring-1 ring-murekkep/[0.08]">
                    <p className="text-murekkep/55">Öz tüketim</p>
                    <p className="font-semibold text-murekkep">
                      {sayi(s.oz_tuketim_mwh)} MWh
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#f3efe5] px-2.5 py-1.5 ring-1 ring-murekkep/[0.08]">
                    <p className="text-murekkep/55">Şebekeye satış</p>
                    <p className="font-semibold text-murekkep">
                      {sayi(s.sebekeye_verilen_mwh)} MWh
                    </p>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-limon to-seftali/70 px-2.5 py-1.5">
                    <p className="text-murekkep/60">Simüle tasarruf</p>
                    <p className="font-semibold text-murekkep">{tl(s.tasarruf_tl)}</p>
                  </div>
                </div>
              </div>
              </PanelBolumu>

              {/* 2.5. 25 Yıllık Kümülatif Nakit Akışı Grafiği (PROJE.md §22.3) */}
              <PanelBolumu ad="nakit">
                <YirmiBesYillikGrafik veriler={nakitAkisi25Yil} />
              </PanelBolumu>

              {/* 3. Pil (Batarya) Depolama */}
              <PanelBolumu ad="pil">
              <div className="space-y-1.5 rounded-xl border border-murekkep/10 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-murekkep">
                    Batarya (pil) kapasitesi (%90 verim)
                  </span>
                  <span className="rounded-full bg-limon/50 px-2 py-0.5 font-semibold text-murekkep">
                    {pilGorunenKwh > 0 ? `${sayi(pilGorunenKwh)} kWh` : "Yok"}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxPilKwh}
                  step={50}
                  value={pilGorunenKwh}
                  onChange={(e) => setPilGorunenKwh(Number(e.target.value))}
                  onPointerUp={() => setPilKapasiteKwh(pilGorunenKwh)}
                  onMouseUp={() => setPilKapasiteKwh(pilGorunenKwh)}
                  onTouchEnd={() => setPilKapasiteKwh(pilGorunenKwh)}
                  onKeyUp={() => setPilKapasiteKwh(pilGorunenKwh)}
                  className="w-full accent-seftali"
                />
                {s.pil && s.pil.kapasite_kwh > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div>
                      <p className="text-murekkep/55">Pil yatırımı</p>
                      <p className="font-semibold text-murekkep">
                        {tl(s.pil.pil_yatirim_tl)}
                      </p>
                    </div>
                    <div>
                      <p className="text-murekkep/55">Ek tasarruf</p>
                      <p className="font-semibold text-emerald-700">
                        +{tl(s.pil.ek_tasarruf_tl)}/yıl
                      </p>
                    </div>
                    <div>
                      <p className="text-murekkep/55">Pilli geri ödeme</p>
                      <p className="font-semibold text-murekkep">
                        {sayi(s.pil.geri_odeme_yil, 1)} yıl
                      </p>
                    </div>
                  </div>
                )}
              </div>
              </PanelBolumu>

              {/* 4. Şebeke ve Trafo Sınırı */}
              <PanelBolumu ad="sebeke">
              <div className="space-y-2 rounded-xl border border-murekkep/10 bg-white p-3">
                <label className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="font-medium text-murekkep">
                    Şebekeye enerji vermeden (yalnızca öz tüketim)
                  </span>
                  <input
                    type="checkbox"
                    checked={sebekeyeVermeden}
                    onChange={(e) => setSebekeyeVermeden(e.target.checked)}
                    className="h-4 w-4 accent-seftali"
                  />
                </label>
                {!sebekeyeVermeden && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-murekkep/55">
                      Trafo boş kapasite sınırı (MW, isteğe bağlı):
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="ör. 0,5"
                      value={trafoKapasiteMwMetin}
                      onChange={(e) => setTrafoKapasiteMwMetin(e.target.value)}
                      className={`w-24 text-right ${GIRDI_KUCUK}`}
                    />
                  </div>
                )}
                {s.kisitlanan_uretim_mwh > 0 && (
                  <p className="rounded-lg bg-mercan/10 px-2 py-1 text-[11px] text-mercan-koyu">
                    Şebeke kısıtı nedeniyle yılda{" "}
                    <span className="font-semibold">
                      {sayi(s.kisitlanan_uretim_mwh)} MWh
                    </span>{" "}
                    fazla üretim sınırlandırıldı.
                  </p>
                )}
              </div>
              </PanelBolumu>

              {/* 5. Kredi ve Finansman Karşılaştırması */}
              <PanelBolumu ad="kredi">
              <div className="rounded-xl border border-murekkep/10 bg-white p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setKrediAcik(!krediAcik)}
                  aria-expanded={krediAcik}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 font-medium text-murekkep">
                    <Landmark className="h-4 w-4 text-murekkep/60" aria-hidden />
                    Kredi ve aylık taksit karşılaştırması
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-murekkep/70">
                    {krediAcik ? "Kapat" : "Hesapla"}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${krediAcik ? "rotate-180" : ""}`} aria-hidden />
                  </span>
                </button>

                {krediAcik && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                      <label className="block">
                        <span className="text-[10px] text-murekkep/55">
                          Aylık faiz (%)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={15}
                          step={0.1}
                          value={aylikFaizYuzde}
                          onChange={(e) => setAylikFaizYuzde(Number(e.target.value))}
                          className={`mt-1 w-full ${GIRDI_KUCUK}`}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-murekkep/55">Vade (ay)</span>
                        <input
                          type="number"
                          min={6}
                          max={120}
                          step={6}
                          value={vadeAy}
                          onChange={(e) => setVadeAy(Number(e.target.value))}
                          className={`mt-1 w-full ${GIRDI_KUCUK}`}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-murekkep/55">Peşinat (%)</span>
                        <input
                          type="number"
                          min={0}
                          max={90}
                          step={5}
                          value={pesinatYuzde}
                          onChange={(e) => setPesinatYuzde(Number(e.target.value))}
                          className={`mt-1 w-full ${GIRDI_KUCUK}`}
                        />
                      </label>
                    </div>

                    {s.kredi && (
                      <div className="space-y-2 rounded-lg bg-[#f3efe5] p-2.5 text-[11px] ring-1 ring-murekkep/[0.08]">
                        <div className="flex justify-between">
                          <span className="text-murekkep/55">Aylık kredi taksiti:</span>
                          <span className="font-semibold text-murekkep">
                            {tl(s.kredi.aylik_taksit_tl)}/ay
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-murekkep/55">
                            Aylık elektrik tasarrufu:
                          </span>
                          <span className="font-semibold text-emerald-700">
                            {tl(s.kredi.aylik_tasarruf_tl)}/ay
                          </span>
                        </div>
                        <div
                          className={`rounded-lg px-2.5 py-1.5 font-medium ${
                            s.kredi.tasarruf_taksiti_karsiliyor_mu
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-mercan/10 text-mercan-koyu"
                          }`}
                        >
                          {s.kredi.tasarruf_taksiti_karsiliyor_mu
                            ? `Tasarruf taksiti karşılıyor (Net +${tl(s.kredi.aylik_net_akis_tl)}/ay)`
                            : `Aylık net fark: ${tl(s.kredi.aylik_net_akis_tl)}/ay`}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </PanelBolumu>

              {/* 6. Çatı Statiği Ön Kontrolü */}
              <PanelBolumu ad="statik">
              <div className="rounded-xl border border-murekkep/10 bg-white p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setStatikAcik(!statikAcik)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-medium text-murekkep">
                    Çatı statiği ön kontrolü ({s.statik.birim_yuk_min_kg_m2}–
                    {s.statik.birim_yuk_max_kg_m2} kg/m²)
                  </span>
                  <span className="text-[11px] text-murekkep/55">
                    ~{sayi(s.statik.tahmini_panel_sayisi)} panel ·{" "}
                    {sayi(s.statik.toplam_ek_yuk_min_ton, 1)}–
                    {sayi(s.statik.toplam_ek_yuk_max_ton, 1)} t
                  </span>
                </button>

                {statikAcik && (
                  <div className="space-y-2 pt-1 text-[11px] text-murekkep/75">
                    <ul className="list-disc space-y-1 pl-4 text-murekkep/60">
                      {s.statik.kontrol_listesi.map((madde) => (
                        <li key={madde}>{madde}</li>
                      ))}
                    </ul>
                    <p className="rounded-lg bg-limon/40 px-2.5 py-1.5 text-[10px] text-murekkep">
                      {s.statik.uyari_notu}
                    </p>
                  </div>
                )}
              </div>
              </PanelBolumu>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default SimulasyonPaneli;
