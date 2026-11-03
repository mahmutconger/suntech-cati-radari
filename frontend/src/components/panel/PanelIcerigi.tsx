"use client";

// Yan panelin ve alt çekmecenin ortak içeriği: bina seçiliyse çatı kartı,
// değilse OSB toplamları ve ilk 20 çatı (uygunluk skoru varsa "İlk gidilecek 20").

import { useMemo, useState } from "react";
import { CatiKarti } from "@/components/kart/CatiKarti";
import { binaAdi, Deger, SkorRozeti } from "@/components/ortak/Deger";
import { Kaydiricilar } from "@/components/panel/Kaydiricilar";
import { useBinalar, useSeciliOsb, useSkorVar, useTopluHesap } from "@/hooks/veri";
import { SAHTE_VERI } from "@/lib/api";
import { sayi, tl } from "@/lib/bicim";
import { useHaritaDurumu } from "@/store/harita";
import type { HesapSonucu } from "@/types/gecici";

type ListeOlcutu = "tasarruf" | "skor";

function OsbOzetiBolumu() {
  const { data: hesap, isPending, isError, error, isFetching } = useTopluHesap();
  const { data: binalar } = useBinalar();
  const osb = useSeciliOsb();
  const skorVar = useSkorVar();
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  const [secilenOlcut, setOlcut] = useState<ListeOlcutu>("skor");
  // Skor yoksa (eski backend) liste her zaman tasarrufa göre.
  const olcut: ListeOlcutu = skorVar ? secilenOlcut : "tasarruf";

  const ilk20 = useMemo(() => {
    if (!hesap || !binalar) return [];
    const adlar = new Map(binalar.features.map((f) => [f.properties.id, f.properties.ad]));
    const deger = (s: HesapSonucu) => (olcut === "skor" ? (s.uygunluk_skoru ?? 0) : s.tasarruf_tl);
    return [...hesap.sonuclar]
      .sort((a, b) => deger(b) - deger(a))
      .slice(0, 20)
      .map((s) => ({ ...s, ad: adlar.get(s.bina_id) ?? "" }));
  }, [hesap, binalar, olcut]);

  if (isError) return <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">{error.message}</p>;
  if (isPending || !hesap) return <p className="text-sm text-slate-400">Hesaplanıyor…</p>;
  const o = hesap.ozet;

  return (
    <section className={`space-y-4 transition-opacity ${isFetching ? "opacity-70" : ""}`}>
      <div>
        <h2 className="text-lg font-semibold text-slate-50">{osb?.ad ?? "Manisa OSB"} güneş potansiyeli</h2>
        <p className="text-xs text-slate-400">{sayi(o.bina_sayisi)} çatı · 1.000 m² üstü · ilk kaba hesap</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Deger etiket="Yıllık tasarruf" deger={`${tl(o.toplam_tasarruf_tl)}/yıl`} vurgu />
        <Deger etiket="Kurulabilir güç" deger={`${sayi(o.toplam_mwp, 1)} MWp`} vurgu />
        <Deger etiket="Yıllık üretim" deger={`${sayi(o.toplam_gwh, 1)} GWh`} />
        <Deger etiket="Yatırım" deger={tl(o.toplam_yatirim_tl)} />
        <Deger etiket="Önlenen CO₂" deger={`${sayi(o.toplam_co2_ton)} t/yıl`} />
        {typeof o.toplam_nbd_tl === "number" && <Deger etiket="Toplam NBD" deger={tl(o.toplam_nbd_tl)} />}
        {typeof o.ortalama_skor === "number" && (
          <Deger etiket="Ortalama uygunluk" deger={`${sayi(o.ortalama_skor)}/100`} />
        )}
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-200">
            {olcut === "skor" ? "İlk gidilecek 20 çatı" : "En çok kazandıracak 20 çatı"}
          </h3>
          {skorVar && (
            <div className="flex rounded-full bg-white/5 p-0.5 text-[11px]">
              {(
                [
                  ["skor", "Uygunluk"],
                  ["tasarruf", "Tasarruf"],
                ] as const
              ).map(([deger, etiket]) => (
                <button
                  key={deger}
                  type="button"
                  onClick={() => setOlcut(deger)}
                  aria-pressed={olcut === deger}
                  className={`rounded-full px-2.5 py-0.5 font-medium ${
                    olcut === deger ? "bg-amber-400 text-slate-900" : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {etiket}
                </button>
              ))}
            </div>
          )}
        </div>
        <ol className="space-y-1">
          {ilk20.map((s, i) => (
            <li key={s.bina_id}>
              <button
                type="button"
                onClick={() => binaSec(s.bina_id, true)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/10"
              >
                <span className="w-5 text-right text-xs text-slate-500">{i + 1}</span>
                <span className="flex-1 truncate text-slate-100">{binaAdi({ id: s.bina_id, ad: s.ad })}</span>
                {olcut === "skor" && typeof s.uygunluk_skoru === "number" ? (
                  <SkorRozeti skor={s.uygunluk_skoru} kucuk />
                ) : (
                  <span className="text-xs font-medium text-amber-300">{tl(s.tasarruf_tl)}</span>
                )}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function PanelIcerigi() {
  const seciliId = useHaritaDurumu((d) => d.seciliBinaId);
  return (
    <div className="space-y-4">
      {SAHTE_VERI && (
        <p className="rounded-lg bg-amber-400/15 px-3 py-1.5 text-[11px] text-amber-200">
          Sahte veriyle çalışıyor (geliştirme)
        </p>
      )}
      {seciliId !== null ? <CatiKarti binaId={seciliId} /> : <OsbOzetiBolumu />}
      <Kaydiricilar />
    </div>
  );
}
