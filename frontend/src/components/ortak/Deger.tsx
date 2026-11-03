import { skorRengi } from "@/lib/renk";

/** Etiket + değer kutucuğu (kart ve OSB paneli). */
export function Deger({ etiket, deger, vurgu = false }: { etiket: string; deger: string; vurgu?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${vurgu ? "bg-amber-400/15 ring-1 ring-amber-400/30" : "bg-white/5"}`}>
      <p className="text-[11px] text-slate-400">{etiket}</p>
      <p className={`text-sm font-semibold ${vurgu ? "text-amber-200" : "text-slate-100"}`}>{deger}</p>
    </div>
  );
}

export function binaAdi(bina: { id: number; ad?: string | null }): string {
  return bina.ad?.trim() ? bina.ad : `Bina #${bina.id}`;
}

/** Uygunluk skoru rozeti (0-100); rengi haritadaki skor renkleriyle aynı. */
export function SkorRozeti({ skor, kucuk = false }: { skor: number; kucuk?: boolean }) {
  const deger = Math.round(skor);
  const koyu = deger >= 70;
  return (
    <span
      title="Uygunluk skoru: geri ödeme, güneş verimi, sistem büyüklüğü, trafoya uzaklık, mevcut panel"
      className={`inline-flex shrink-0 items-baseline gap-0.5 rounded-full font-bold tabular-nums ${
        kucuk ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-sm"
      } ${koyu ? "text-white" : "text-slate-900"}`}
      style={{ backgroundColor: skorRengi(deger) }}
    >
      {deger}
      <span className={`font-medium ${kucuk ? "text-[9px]" : "text-[10px]"} opacity-80`}>/100</span>
    </span>
  );
}
