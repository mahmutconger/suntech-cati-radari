"use client";

// Yan panelin ve alt çekmecenin ortak içeriği: bina seçiliyse çatı kartı,
// değilse OSB toplamları ve ilk 20 çatı (uygunluk skoru varsa "İlk gidilecek 20").

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { CatiKarti } from "@/components/kart/CatiKarti";
import { binaAdi, Deger, SkorRozeti } from "@/components/ortak/Deger";
import { Kaydiricilar } from "@/components/panel/Kaydiricilar";
import { PanelBolumu } from "@/components/panel/PanelBolumu";
import { SenaryoPaneli } from "@/components/panel/SenaryoPaneli";
import { useBinalar, useSeciliOsb, useSkorVar, useTopluHesap } from "@/hooks/veri";
import { SAHTE_VERI } from "@/lib/api";
import { sayi, tl } from "@/lib/bicim";
import { csvIndir } from "@/lib/csv";
import { HATA, KART, SECILI_CIP } from "@/lib/stil";
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

  const ozetler = useMemo(
    () => binalar ? new Map(binalar.features.map((f) => [f.properties.id, f.properties])) : new Map(),
    [binalar],
  );

  const ilk20 = useMemo(() => {
    if (!hesap || !binalar) return [];
    const deger = (s: HesapSonucu) => (olcut === "skor" ? (s.uygunluk_skoru ?? 0) : s.tasarruf_tl);
    return [...hesap.sonuclar]
      .sort((a, b) => deger(b) - deger(a))
      .slice(0, 20)
      .map((s) => ({ ...s, ad: ozetler.get(s.bina_id)?.ad ?? "", trafoKm: ozetler.get(s.bina_id)?.trafo_mesafe_km ?? null }));
  }, [hesap, binalar, olcut, ozetler]);

  function listeyiIndir() {
    const yuvarla = (x: number, basamak: number) => Math.round(x * 10 ** basamak) / 10 ** basamak;
    csvIndir(`${osb?.id ?? "osb"}-${olcut === "skor" ? "ilk-gidilecek" : "en-cok-kazandiracak"}-20.csv`, [
      ["Sıra", "Çatı", "OSM no", "Uygunluk skoru", "Yıllık tasarruf (TL)", "Geri ödeme (yıl)", "NBD (TL)", "En yakın trafo (km)", "Bağlantı"],
      ...ilk20.map((s, i) => [
        i + 1,
        binaAdi({ id: s.bina_id, ad: s.ad }),
        s.bina_id,
        yuvarla(s.uygunluk_skoru, 1),
        Math.round(s.tasarruf_tl),
        yuvarla(s.geri_odeme_yil, 1),
        Math.round(s.nbd_tl),
        s.trafoKm,
        `${window.location.origin}/?bina=${s.bina_id}`,
      ]),
    ]);
  }

  if (isError) return <p className={HATA}>{error.message}</p>;
  if (isPending || !hesap) return <p className="text-sm text-murekkep/55">Hesaplanıyor…</p>;
  const o = hesap.ozet;

  return (
    <section className={`space-y-4 transition-opacity ${isFetching ? "opacity-70" : ""}`}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mercan-koyu">OSB özeti</p>
        <h2 className="text-xl font-bold tracking-tight text-murekkep">{osb?.ad ?? "Manisa OSB"} güneş potansiyeli</h2>
        <p className="text-xs text-murekkep/55">{sayi(o.bina_sayisi)} çatı · 1.000 m² üstü · ilk kaba hesap</p>
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
      <SenaryoPaneli sonuclar={hesap.sonuclar} />
      <div className={`${KART} p-3`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-semibold text-murekkep">
            {olcut === "skor" ? "İlk gidilecek 20 çatı" : "En çok kazandıracak 20 çatı"}
          </h3>
          {skorVar && (
            <div className="flex rounded-full bg-murekkep/5 p-0.5 text-[11px]">
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
                    olcut === deger ? SECILI_CIP : "text-murekkep/60 hover:bg-murekkep/5"
                  }`}
                >
                  {etiket}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={listeyiIndir}
            title="Listeyi indir (CSV)"
            aria-label="Listeyi indir (CSV)"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-murekkep/50 hover:bg-murekkep/5"
          >
            <Download size={14} />
          </button>
        </div>
        <ol className="space-y-1">
          {ilk20.map((s, i) => (
            <li key={s.bina_id}>
              <button
                type="button"
                onClick={() => binaSec(s.bina_id, true)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-limon/30"
              >
                <span className="w-5 text-right text-xs text-murekkep/40">{i + 1}</span>
                <span className="flex-1 truncate text-murekkep">{binaAdi({ id: s.bina_id, ad: s.ad })}</span>
                {olcut === "skor" && typeof s.uygunluk_skoru === "number" ? (
                  <SkorRozeti skor={s.uygunluk_skoru} kucuk />
                ) : (
                  <span className="text-xs font-semibold text-murekkep/80">{tl(s.tasarruf_tl)}</span>
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
        <p className="rounded-lg bg-limon/40 px-3 py-1.5 text-[11px] text-murekkep">
          Sahte veriyle çalışıyor (geliştirme)
        </p>
      )}
      {seciliId !== null ? <CatiKarti binaId={seciliId} /> : <OsbOzetiBolumu />}
      <PanelBolumu ad="varsayim">
        <Kaydiricilar />
      </PanelBolumu>
    </div>
  );
}
