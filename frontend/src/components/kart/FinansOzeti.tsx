"use client";

// 25 yıllık finans özeti (§22.4): NBD, iç verim oranı, LCOE ile tarife karşılaştırması, 25 yıllık net kazanç.
// Alanlar Mehmet'in hesabı yayına alınınca yanıtta gelir; gelmezse kısa bir not görünür.

import { DollarSign } from "lucide-react";
import { Deger } from "@/components/ortak/Deger";
import { sayi, tl } from "@/lib/bicim";
import { KART } from "@/lib/stil";
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
  const baslik = (
    <p className="flex items-center gap-2 text-sm font-semibold text-murekkep">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-limon to-seftali">
        <DollarSign className="h-4 w-4" aria-hidden />
      </span>
      {Math.round(omur)} yıllık finans
    </p>
  );

  if (typeof hesap.nbd_tl !== "number") {
    return (
      <div className={`${KART} space-y-1 p-3`}>
        {baslik}
        <p className="text-[11px] text-murekkep/55">25 yıllık finans hesabı bu yanıtta yok; backend güncellenince görünür.</p>
      </div>
    );
  }

  const lcoe = hesap.lcoe_tl_kwh;
  const lcoeOrani = typeof lcoe === "number" && tarife > 0 ? lcoe / tarife : null;

  return (
    <div className={`${KART} space-y-2 p-3`}>
      {baslik}
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
        <p
          className={`rounded-lg px-2.5 py-1.5 text-[11px] leading-snug ${
            lcoeOrani < 1 ? "bg-emerald-50 text-emerald-800" : "bg-mercan/10 text-mercan-koyu"
          }`}
        >
          {lcoeOrani < 1
            ? `Çatıda üretilen elektrik, şebeke tarifesinden (${tlKwh(tarife)}) yaklaşık %${sayi((1 - lcoeOrani) * 100)} daha ucuz.`
            : `Çatıda üretilen elektrik şebeke tarifesinden (${tlKwh(tarife)}) pahalı; yatırım bu varsayımlarla kârlı değil.`}
        </p>
      )}
      <p className="text-[10px] leading-snug text-murekkep/45">
        NBD reel iskonto oranıyla; bakım, verim kaybı ve tarife artışı dahil. Varsayımlardan değiştirilebilir.
      </p>
    </div>
  );
}
