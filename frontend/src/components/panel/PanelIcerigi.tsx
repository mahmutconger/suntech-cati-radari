"use client";

// Yan panelin ve alt çekmecenin ortak içeriği: bina seçiliyse çatı kartı,
// değilse OSB toplamları ve ilk 20 çatı. Kaydırıcılar ikisinde de üstte.

import { useMemo } from "react";
import { CatiKarti } from "@/components/kart/CatiKarti";
import { binaAdi, Deger } from "@/components/ortak/Deger";
import { Kaydiricilar } from "@/components/panel/Kaydiricilar";
import { useBinalar, useTopluHesap } from "@/hooks/veri";
import { SAHTE_VERI } from "@/lib/api";
import { sayi, tl } from "@/lib/bicim";
import { useHaritaDurumu } from "@/store/harita";

function OsbOzetiBolumu() {
  const { data: hesap, isPending, isError, error, isFetching } = useTopluHesap();
  const { data: binalar } = useBinalar();
  const binaSec = useHaritaDurumu((d) => d.binaSec);

  const ilk20 = useMemo(() => {
    if (!hesap || !binalar) return [];
    const adlar = new Map(binalar.features.map((f) => [f.properties.id, f.properties.ad]));
    return [...hesap.sonuclar]
      .sort((a, b) => b.tasarruf_tl - a.tasarruf_tl)
      .slice(0, 20)
      .map((s) => ({ ...s, ad: adlar.get(s.bina_id) ?? "" }));
  }, [hesap, binalar]);

  if (isError) return <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">{error.message}</p>;
  if (isPending || !hesap) return <p className="text-sm text-slate-400">Hesaplanıyor…</p>;
  const o = hesap.ozet;

  return (
    <section className={`space-y-4 transition-opacity ${isFetching ? "opacity-70" : ""}`}>
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Manisa OSB güneş potansiyeli</h2>
        <p className="text-xs text-slate-400">{sayi(o.bina_sayisi)} çatı · 1.000 m² üstü · ilk kaba hesap</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Deger etiket="Yıllık tasarruf" deger={`${tl(o.toplam_tasarruf_tl)}/yıl`} vurgu />
        <Deger etiket="Kurulabilir güç" deger={`${sayi(o.toplam_mwp, 1)} MWp`} vurgu />
        <Deger etiket="Yıllık üretim" deger={`${sayi(o.toplam_gwh, 1)} GWh`} />
        <Deger etiket="Yatırım" deger={tl(o.toplam_yatirim_tl)} />
        <Deger etiket="Önlenen CO₂" deger={`${sayi(o.toplam_co2_ton)} t/yıl`} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-200">En çok kazandıracak 20 çatı</h3>
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
                <span className="text-xs font-medium text-amber-300">{tl(s.tasarruf_tl)}</span>
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
