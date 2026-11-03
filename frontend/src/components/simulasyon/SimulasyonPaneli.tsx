"use client";

export interface SimulasyonPaneliProps {
  binaId?: number;
  alanM2?: number;
  yillikTuketimKwh?: number | null;
}

/**
 * Saatlik simülasyon, vardiya, pil, kredi ve statik ön kontrol bileşeni.
 * (12:30 birleştirmesi için yer tutucu; ayrıntılı simülasyon kutuları ve günlük grafik eklenecek.)
 */
export function SimulasyonPaneli({ binaId }: SimulasyonPaneliProps) {
  return (
    <section
      aria-label="Saatlik simülasyon ve finansman"
      className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-100">
          Saatlik Simülasyon · Pil · Kredi · Statik
        </span>
        {binaId !== undefined && (
          <span className="text-[11px] text-slate-400">Bina #{binaId}</span>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
        Vardiya profili, batarya depolama, kredi taksit karşılaştırması ve çatı
        statiği ön kontrolü bu bölümde gösterilir.
      </p>
    </section>
  );
}

export default SimulasyonPaneli;
