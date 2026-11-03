"use client";

// "Uyduda kontrol et": Gemini çatının uydu görüntüsüne bakar; panel var mı, ne kadarını kaplıyor.
// Yalnızca düğmeyle çalışır, çünkü her istek Gemini kotasından düşer.

import { useUyduKontrolu } from "@/hooks/veri";
import { ApiHatasi } from "@/lib/api";
import type { UyduSonucu } from "@/types/gecici";

const PANEL_METNI: Record<UyduSonucu["panel"], { metin: string; renk: string }> = {
  var: { metin: "Çatıda panel görünüyor", renk: "bg-sky-500/15 text-sky-200 ring-sky-400/30" },
  yok: { metin: "Çatıda panel görünmüyor", renk: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30" },
  belirsiz: { metin: "Görüntüden emin olunamadı", renk: "bg-amber-400/15 text-amber-200 ring-amber-400/30" },
};

function hataMetni(hata: Error): string {
  if (hata instanceof ApiHatasi && hata.durum === 404) return "Uydu kontrolü henüz hazır değil.";
  if (hata instanceof ApiHatasi && hata.durum === 429) return "Çok fazla istek. Bir dakika sonra tekrar deneyin.";
  return hata.message;
}

export function UyduKontrolu({ binaId }: { binaId: number }) {
  const { sonuc, mutate, isPending, isError, error } = useUyduKontrolu(binaId);

  if (sonuc) {
    const p = PANEL_METNI[sonuc.panel];
    return (
      <div className={`rounded-2xl px-3 py-2.5 ring-1 ${p.renk}`}>
        <p className="text-sm font-semibold">🛰 {p.metin}</p>
        <p className="mt-0.5 text-[11px] opacity-80">
          {sonuc.panel === "var" && `Çatının yaklaşık %${Math.round(sonuc.kaplama_orani * 100)}'i kaplı · `}
          Güven %{Math.round(sonuc.guven * 100)} · Gemini uydu görüntüsü analizi, ön tarama
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => mutate()}
        disabled={isPending}
        className="w-full rounded-xl border border-sky-400/40 px-4 py-2.5 text-sm font-semibold text-sky-200 hover:bg-sky-400/10 disabled:opacity-60"
      >
        {isPending ? "Gemini uydu görüntüsüne bakıyor…" : "🛰 Uyduda kontrol et"}
      </button>
      {isError && <p className="text-xs text-red-300">{hataMetni(error)}</p>}
    </div>
  );
}
