"use client";

// Rapordaki 25 yıllık nakit akışı grafiği: çubuklar yıllık net akış, çizgi kümülatif.
// Yazdırmaya uygun olsun diye sabit boyutlu ve animasyonsuz.

import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import type { FinansYili } from "@/types/gecici";

const milyon = (v: number) => `${(v / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} M`;

export function NakitAkisiGrafigi({ yillar, yatirim }: { yillar: FinansYili[]; yatirim: number }) {
  // 0. yıl: yatırım (eksi), sonra her yılın net akışı.
  const veri = [
    { yil: 0, net: -yatirim, kumulatif: -yatirim },
    ...yillar.map((y) => ({ yil: y.yil, net: y.net_akis_tl, kumulatif: y.kumulatif_tl })),
  ];
  const geriDonusYili = yillar.find((y) => y.kumulatif_tl >= 0)?.yil;

  return (
    <div>
      <ComposedChart width={410} height={190} data={veri} margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
        <CartesianGrid stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="yil" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} interval={4} minTickGap={8} />
        <YAxis tickFormatter={milyon} tick={{ fontSize: 10, fill: "#475569" }} width={52} tickLine={false} />
        <ReferenceLine y={0} stroke="#64748b" />
        {geriDonusYili !== undefined && (
          <ReferenceLine
            x={geriDonusYili}
            stroke="#16a34a"
            strokeDasharray="4 3"
            label={{ value: `${geriDonusYili}. yıl`, position: "insideTopLeft", fontSize: 10, fill: "#15803d" }}
          />
        )}
        <Bar dataKey="net" fill="#f59e0b" isAnimationActive={false} />
        <Line dataKey="kumulatif" stroke="#0f172a" strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
      <p className="mt-1 flex gap-4 text-[10px] text-slate-500">
        <span>
          <span className="mr-1 inline-block h-2 w-3 bg-amber-500 align-middle" />
          Yıllık net akış (tasarruf − bakım)
        </span>
        <span>
          <span className="mr-1 inline-block h-0.5 w-4 bg-slate-900 align-middle" />
          Kümülatif (yatırım dahil)
        </span>
      </p>
    </div>
  );
}
