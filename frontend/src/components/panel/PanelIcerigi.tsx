"use client";

// Yan panelin ve alt çekmecenin ortak içeriği: bina seçiliyse kısa özet,
// değilse OSB toplamları ve ilk 20 çatı.
// Ayrıntılı çatı kartı (13:45 adımı) src/components/kart/ altında gelecek.

import { useMemo } from "react";
import { useBinalar, useHesapSozlugu, useTopluHesap } from "@/hooks/veri";
import { SAHTE_VERI } from "@/lib/api";
import { alan, sayi, tl } from "@/lib/bicim";
import { useHaritaDurumu } from "@/store/harita";

function Deger({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2">
      <p className="text-[11px] text-slate-400">{etiket}</p>
      <p className="text-sm font-semibold text-slate-100">{deger}</p>
    </div>
  );
}

function SeciliBina({ id }: { id: number }) {
  const { data } = useBinalar();
  const hesap = useHesapSozlugu().get(id);
  const binaSec = useHaritaDurumu((d) => d.binaSec);
  const bina = data?.features.find((f) => f.properties.id === id)?.properties;
  if (!bina) return null;

  return (
    <section className="space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-400">Bina #{bina.id}</p>
          <h2 className="text-lg font-semibold text-slate-50">{bina.ad ?? "Adı bilinmeyen bina"}</h2>
        </div>
        <button
          type="button"
          onClick={() => binaSec(null)}
          className="rounded-full px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
        >
          Kapat ✕
        </button>
      </header>
      <div className="grid grid-cols-2 gap-2">
        <Deger etiket="Çatı alanı" deger={alan(bina.alan_m2)} />
        <Deger etiket="Kurulu güç" deger={hesap ? `${sayi(hesap.kwp)} kWp` : "…"} />
        <Deger etiket="Yıllık üretim" deger={hesap ? `${sayi(hesap.uretim_mwh)} MWh` : "…"} />
        <Deger etiket="Yıllık tasarruf" deger={hesap ? tl(hesap.tasarruf_tl) : "…"} />
        <Deger etiket="Yatırım" deger={hesap ? tl(hesap.yatirim_tl) : "…"} />
        <Deger etiket="Geri ödeme" deger={hesap ? `${sayi(hesap.geri_odeme_yil, 1)} yıl` : "…"} />
        <Deger etiket="Önlenen CO₂" deger={hesap ? `${sayi(hesap.co2_ton)} t/yıl` : "…"} />
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400">
        İlk kaba hesap. Çatı statiği, mevcut tesisat ve şebeke bağlantısı için yerinde keşif gerekir.
      </p>
    </section>
  );
}

function OsbOzetiBolumu() {
  const { data: hesap, isPending } = useTopluHesap();
  const { data: binalar } = useBinalar();
  const binaSec = useHaritaDurumu((d) => d.binaSec);

  const ilk20 = useMemo(() => {
    if (!hesap || !binalar) return [];
    const adlar = new Map(binalar.features.map((f) => [f.properties.id, f.properties.ad]));
    return [...hesap.sonuclar]
      .sort((a, b) => b.tasarruf_tl - a.tasarruf_tl)
      .slice(0, 20)
      .map((s) => ({ ...s, ad: adlar.get(s.bina_id) ?? null }));
  }, [hesap, binalar]);

  if (isPending || !hesap) return <p className="text-sm text-slate-400">Hesaplanıyor…</p>;
  const o = hesap.ozet;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Manisa OSB güneş potansiyeli</h2>
        <p className="text-xs text-slate-400">{sayi(o.bina_sayisi)} çatı · 1.000 m² üstü · ilk kaba hesap</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Deger etiket="Kurulabilir güç" deger={`${sayi(o.toplam_mwp, 1)} MWp`} />
        <Deger etiket="Yıllık üretim" deger={`${sayi(o.toplam_gwh, 1)} GWh`} />
        <Deger etiket="Yıllık tasarruf" deger={tl(o.toplam_tasarruf_tl)} />
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
                <span className="flex-1 truncate text-slate-100">{s.ad ?? `Bina #${s.bina_id}`}</span>
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
      {seciliId !== null ? <SeciliBina id={seciliId} /> : <OsbOzetiBolumu />}
    </div>
  );
}
