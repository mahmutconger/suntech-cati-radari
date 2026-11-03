"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { sayi, tl } from "@/lib/bicim";
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

export function SimulasyonPaneli({
  binaId = 0,
  yillikTuketimKwh = null,
}: SimulasyonPaneliProps) {
  const varsayimlar = useHaritaDurumu((d) => d.varsayimlar);

  const [acik, setAcik] = useState(true);
  const [vardiya, setVardiya] = useState<VardiyaTipi>("iki");
  const [pilKapasiteKwh, setPilKapasiteKwh] = useState<number>(0);
  const [sebekeyeVermeden, setSebekeyeVermeden] = useState<boolean>(false);
  const [trafoKapasiteMwMetin, setTrafoKapasiteMwMetin] = useState<string>("");

  const [krediAcik, setKrediAcik] = useState<boolean>(false);
  const [aylikFaizYuzde, setAylikFaizYuzde] = useState<number>(2.5);
  const [vadeAy, setVadeAy] = useState<number>(48);
  const [pesinatYuzde, setPesinatYuzde] = useState<number>(20);
  const [statikAcik, setStatikAcik] = useState<boolean>(false);

  const trafoKalanKapasiteMw = useMemo(() => {
    const temiz = trafoKapasiteMwMetin.trim().replace(",", ".");
    if (!temiz) return null;
    const n = Number(temiz);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [trafoKapasiteMwMetin]);

  const istekGovdesi: SimulasyonIstegi = useMemo(
    () => ({
      varsayimlar,
      vardiya,
      yillik_tuketim_kwh: yillikTuketimKwh,
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
      yillikTuketimKwh,
      pilKapasiteKwh,
      krediAcik,
      aylikFaizYuzde,
      vadeAy,
      pesinatYuzde,
      sebekeyeVermeden,
      trafoKalanKapasiteMw,
    ],
  );

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

  const maxPilKwh = s ? Math.max(500, Math.min(5000, Math.round(s.kwp * 2))) : 2000;

  return (
    <section
      aria-label="Saatlik simülasyon ve finansman"
      className="rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-slate-200"
    >
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <span className="text-sm font-semibold text-slate-100">
            Saatlik Simülasyon · Pil · Kredi · Statik
          </span>
          {s && (
            <p className="text-[11px] text-slate-400">
              Öz tüketim: %{Math.round(s.oz_tuketim_orani * 100)} · Geri ödeme:{" "}
              {sayi(s.geri_odeme_yil, 1)} yıl
            </p>
          )}
        </div>
        <span className="text-xs text-slate-400">{acik ? "Gizle ▲" : "Aç ▼"}</span>
      </button>

      {acik && (
        <div className="space-y-4 border-t border-white/10 px-4 pb-4 pt-3">
          {isPending && !s && (
            <p className="text-xs text-slate-400">Saatlik simülasyon hesaplanıyor…</p>
          )}

          {isError && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error instanceof Error ? error.message : "Simülasyon alınamadı."}
            </p>
          )}

          {s && (
            <>
              {/* 1. Vardiya Seçimi */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">Çalışma vardiyası</span>
                  <span className="text-[11px] text-amber-300">
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
                            ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
                            : "border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <p className="font-semibold">{v.etiket}</p>
                        <p className="text-[10px] text-slate-400">{v.saatler}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Günlük Ortalama Üretim ve Tüketim Grafiği (Recharts) */}
              <div className="space-y-1.5 rounded-xl bg-slate-900/70 p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-300">
                    Günlük ortalama profil (kW, saatlik)
                  </span>
                  <span className="text-slate-400">
                    <span className="text-amber-300">● Üretim</span> ·{" "}
                    <span className="text-sky-300">● Tüketim</span>
                  </span>
                </div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={s.gunluk_profil}
                      margin={{ top: 6, right: 6, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <XAxis
                        dataKey="saat"
                        tickFormatter={(v) => `${v}:00`}
                        stroke="#64748b"
                        fontSize={10}
                        interval={5}
                      />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "rgba(255,255,255,0.12)",
                          borderRadius: "0.75rem",
                          fontSize: "11px",
                        }}
                        labelFormatter={(saat) => `Saat ${saat}:00`}
                      />
                      <Area
                        type="monotone"
                        dataKey="uretim_kw"
                        name="Üretim (kW)"
                        stroke="#fbbf24"
                        fill="rgba(251, 191, 36, 0.25)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="tuketim_kw"
                        name="Tüketim (kW)"
                        stroke="#38bdf8"
                        fill="rgba(56, 189, 248, 0.15)"
                        strokeWidth={1.75}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                    <p className="text-slate-400">Öz tüketim</p>
                    <p className="font-semibold text-slate-100">
                      {sayi(s.oz_tuketim_mwh)} MWh
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                    <p className="text-slate-400">Şebekeye satış</p>
                    <p className="font-semibold text-slate-100">
                      {sayi(s.sebekeye_verilen_mwh)} MWh
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                    <p className="text-slate-400">Simüle tasarruf</p>
                    <p className="font-semibold text-amber-300">{tl(s.tasarruf_tl)}</p>
                  </div>
                </div>
              </div>

              {/* 3. Pil (Batarya) Depolama */}
              <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">
                    Batarya (pil) kapasitesi (%90 verim)
                  </span>
                  <span className="font-semibold text-amber-300">
                    {pilKapasiteKwh > 0 ? `${sayi(pilKapasiteKwh)} kWh` : "Yok"}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxPilKwh}
                  step={50}
                  value={pilKapasiteKwh}
                  onChange={(e) => setPilKapasiteKwh(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
                {s.pil && s.pil.kapasite_kwh > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div>
                      <p className="text-slate-400">Pil yatırımı</p>
                      <p className="font-semibold text-slate-100">
                        {tl(s.pil.pil_yatirim_tl)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Ek tasarruf</p>
                      <p className="font-semibold text-emerald-300">
                        +{tl(s.pil.ek_tasarruf_tl)}/yıl
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Pilli geri ödeme</p>
                      <p className="font-semibold text-amber-300">
                        {sayi(s.pil.geri_odeme_yil, 1)} yıl
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Şebeke ve Trafo Sınırı */}
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <label className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="font-medium text-slate-200">
                    Şebekeye enerji vermeden (yalnızca öz tüketim)
                  </span>
                  <input
                    type="checkbox"
                    checked={sebekeyeVermeden}
                    onChange={(e) => setSebekeyeVermeden(e.target.checked)}
                    className="h-4 w-4 accent-amber-400"
                  />
                </label>
                {!sebekeyeVermeden && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      Trafo boş kapasite sınırı (MW, isteğe bağlı):
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="ör. 0,5"
                      value={trafoKapasiteMwMetin}
                      onChange={(e) => setTrafoKapasiteMwMetin(e.target.value)}
                      className="w-24 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-right text-xs text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                )}
                {s.kisitlanan_uretim_mwh > 0 && (
                  <p className="text-[11px] text-amber-200">
                    Şebeke kısıtı nedeniyle yılda{" "}
                    <span className="font-semibold">
                      {sayi(s.kisitlanan_uretim_mwh)} MWh
                    </span>{" "}
                    fazla üretim sınırlandırıldı.
                  </p>
                )}
              </div>

              {/* 5. Kredi ve Finansman Karşılaştırması */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setKrediAcik(!krediAcik)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-medium text-slate-200">
                    Kredi ve aylık taksit karşılaştırması
                  </span>
                  <span className="text-[11px] text-amber-300">
                    {krediAcik ? "Kapat ▲" : "Hesapla ▼"}
                  </span>
                </button>

                {krediAcik && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                      <label className="block">
                        <span className="text-[10px] text-slate-400">
                          Aylık faiz (%)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={15}
                          step={0.1}
                          value={aylikFaizYuzde}
                          onChange={(e) => setAylikFaizYuzde(Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-slate-400">Vade (ay)</span>
                        <input
                          type="number"
                          min={6}
                          max={120}
                          step={6}
                          value={vadeAy}
                          onChange={(e) => setVadeAy(Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-slate-400">Peşinat (%)</span>
                        <input
                          type="number"
                          min={0}
                          max={90}
                          step={5}
                          value={pesinatYuzde}
                          onChange={(e) => setPesinatYuzde(Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                        />
                      </label>
                    </div>

                    {s.kredi && (
                      <div className="space-y-2 rounded-lg bg-slate-900/80 p-2.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Aylık kredi taksiti:</span>
                          <span className="font-semibold text-slate-100">
                            {tl(s.kredi.aylik_taksit_tl)}/ay
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            Aylık elektrik tasarrufu:
                          </span>
                          <span className="font-semibold text-emerald-300">
                            {tl(s.kredi.aylik_tasarruf_tl)}/ay
                          </span>
                        </div>
                        <div
                          className={`rounded-lg px-2.5 py-1.5 font-medium ${
                            s.kredi.tasarruf_taksiti_karsiliyor_mu
                              ? "bg-emerald-500/15 text-emerald-200"
                              : "bg-amber-500/15 text-amber-200"
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

              {/* 6. Çatı Statiği Ön Kontrolü */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setStatikAcik(!statikAcik)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-medium text-slate-200">
                    Çatı statiği ön kontrolü ({s.statik.birim_yuk_min_kg_m2}–
                    {s.statik.birim_yuk_max_kg_m2} kg/m²)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ~{sayi(s.statik.tahmini_panel_sayisi)} panel ·{" "}
                    {sayi(s.statik.toplam_ek_yuk_min_ton, 1)}–
                    {sayi(s.statik.toplam_ek_yuk_max_ton, 1)} t
                  </span>
                </button>

                {statikAcik && (
                  <div className="space-y-2 pt-1 text-[11px] text-slate-300">
                    <ul className="list-disc space-y-1 pl-4 text-slate-400">
                      {s.statik.kontrol_listesi.map((madde) => (
                        <li key={madde}>{madde}</li>
                      ))}
                    </ul>
                    <p className="rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-[10px] text-amber-200">
                      {s.statik.uyari_notu}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default SimulasyonPaneli;
