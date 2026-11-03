"use client";

// 25 yıllık finans özeti (§22.4): NBD, iç verim oranı, LCOE ile tarife karşılaştırması, 25 yıllık net kazanç.
// Alanlar Mehmet'in hesabı yayına alınınca yanıtta gelir; gelmezse bu kutu görünmez.

import { Deger } from "@/components/ortak/Deger";
import { sayi, tl } from "@/lib/bicim";
import { useHaritaDurumu } from "@/store/harita";
import type { HesapSonucu } from "@/types/gecici";

function yuzde(oran: number): string {
  return `%${(oran * 100).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

function tlKwh(deger: number): string {
  return `${deger.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL/kWh`;
}

export function FinansOzeti({ hesap }: { hesap: HesapSonucu }) {
  const tarife = useHaritaDurumu((d) => d.varsayimlar.tarife_tl_kwh);
  const omur = useHaritaDurumu((d) => d.varsayimlar.omur_yil ?? 25);
  if (typeof hesap.nbd_tl !== "number") return null;

  const lcoe = hesap.lcoe_tl_kwh;
  const lcoeOrani = typeof lcoe === "number" && tarife > 0 ? lcoe / tarife : null;

  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-semibold text-slate-200">{Math.round(omur)} yıllık finans</p>
      <div className="grid grid-cols-2 gap-2">
        <Deger
          etiket={`${Math.round(omur)} yılda net kazanç`}
          deger={typeof hesap.net_kazanc_25y_tl === "number" ? tl(hesap.net_kazanc_25y_tl) : "…"}
          vurgu
        />
        <Deger etiket="Net bugünkü değer" deger={tl(hesap.nbd_tl)} />
        <Deger
          etiket="İç verim oranı"
          deger={typeof hesap.ic_verim_orani === "number" ? yuzde(hesap.ic_verim_orani) : "hesaplanamadı"}
        />
        {typeof lcoe === "number" && <Deger etiket="Elektrik maliyeti (LCOE)" deger={tlKwh(lcoe)} />}
      </div>
      {lcoeOrani !== null && (
        <p className={`text-[11px] leading-snug ${lcoeOrani < 1 ? "text-emerald-300" : "text-amber-200"}`}>
          {lcoeOrani < 1
            ? `Çatıda üretilen elektrik, şebeke tarifesinden (${tlKwh(tarife)}) yaklaşık %${sayi((1 - lcoeOrani) * 100)} daha ucuz.`
            : `Çatıda üretilen elektrik şebeke tarifesinden (${tlKwh(tarife)}) pahalı; yatırım bu varsayımlarla kârlı değil.`}
        </p>
      )}
      <p className="text-[10px] leading-snug text-slate-500">
        NBD reel iskonto oranıyla; bakım, verim kaybı ve tarife artışı dahil. Varsayımlardan değiştirilebilir.
      </p>
    </div>
  );
}
