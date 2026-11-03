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
