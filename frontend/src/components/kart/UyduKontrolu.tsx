"use client";

// "Uyduda kontrol et": Gemini çatının uydu görüntüsüne bakar; panel var mı, ne kadarını kaplıyor.
// Yalnızca düğmeyle çalışır, çünkü her istek Gemini kotasından düşer.

import { Satellite } from "lucide-react";
import { GunesIkonu } from "@/components/ortak/GunesYukleyici";
import { useUyduKontrolu } from "@/hooks/veri";
import { ApiHatasi } from "@/lib/api";
import { IKINCIL_DUGME } from "@/lib/stil";
import type { UyduSonucu } from "@/types/gecici";

const PANEL_METNI: Record<UyduSonucu["panel"], { metin: string; renk: string }> = {
  var: { metin: "Çatıda panel görünüyor", renk: "bg-sky-50 text-sky-900 ring-sky-200" },
  yok: { metin: "Çatıda panel görünmüyor", renk: "bg-emerald-50 text-emerald-900 ring-emerald-200" },
  belirsiz: { metin: "Görüntüden emin olunamadı", renk: "bg-gradient-to-br from-limon/40 to-seftali/30 text-murekkep ring-seftali/40" },
};

function hataMetni(hata: Error): string {
  if (hata instanceof ApiHatasi && hata.kod === "bina_yok") return "Bina bulunamadı.";
  if (hata instanceof ApiHatasi && hata.durum === 429) return "Çok fazla istek. Bir dakika sonra tekrar deneyin.";
  return hata.message;
}

export function UyduKontrolu({ binaId }: { binaId: number }) {
  const { sonuc, mutate, isPending, isError, error } = useUyduKontrolu(binaId);

  if (sonuc) {
    const p = PANEL_METNI[sonuc.panel];
    return (
      <div className={`rounded-2xl px-3 py-2.5 ring-1 ${p.renk}`}>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Satellite className="h-4 w-4" aria-hidden />
          {p.metin}
        </p>
        {sonuc.aciklama && <p className="mt-1 text-xs leading-snug opacity-90">{sonuc.aciklama}</p>}
        <p className="mt-1 text-[11px] opacity-75">
          {sonuc.panel === "var" && `Çatının yaklaşık %${Math.round(sonuc.kaplama_orani * 100)}'i kaplı · `}
          Güven %{Math.round(sonuc.guven * 100)} · {sonuc.model}
          {sonuc.onbellekten && " · daha önce bakılmıştı"} · ön tarama
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
        className={`${IKINCIL_DUGME} w-full`}
      >
        {isPending ? <GunesIkonu boyut={22} /> : <Satellite className="h-4 w-4" aria-hidden />}
        {isPending ? "Gemini uydu görüntüsüne bakıyor…" : "Uyduda kontrol et"}
      </button>
      {isError && <p className="text-xs text-mercan-koyu">{hataMetni(error)}</p>}
    </div>
  );
}
