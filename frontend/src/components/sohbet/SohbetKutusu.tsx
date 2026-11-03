"use client";

// Asistan sohbet kutusu. Cevaplar /sohbet'ten gelir; asistan sayıları yalnızca araç
// çıktısından alır ve kullandığı araçlar her cevabın altında görünür.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSohbet } from "@/hooks/veri";
import { useHaritaDurumu } from "@/store/harita";
import type { KullanilanArac } from "@/types/gecici";

interface Mesaj {
  rol: "kullanici" | "asistan";
  metin: string;
  araclar?: KullanilanArac[];
  model?: string;
  hata?: boolean;
}

/** Backend sınırları: en çok 20 mesaj, her biri en çok 2000 karakter. */
const EN_COK_MESAJ = 20;
const EN_COK_KARAKTER = 2000;

const ORNEK_SORULAR = [
  "Geri ödemesi 4 yılın altında kaç çatı var?",
  "En çok kazandıracak çatı hangisi?",
  "Seçili çatı için ön fizibilite notu yaz",
];

/** Asistanın kullanabildiği araçların ekrandaki adları (PROJE.md Bölüm 10.1). */
const ARAC_ADLARI: Record<string, string> = {
  osb_ozeti: "OSB özeti",
  bina_bul: "Bina bulma",
  bina_detayi: "Bina detayı",
  sirala: "Sıralama",
};

function AracEtiketi({ arac }: { arac: KullanilanArac }) {
  const girdi = Object.entries(arac.girdi ?? {})
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(", ");
  return (
    <span
      title={girdi || undefined}
      className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-200"
    >
      ⚙ {ARAC_ADLARI[arac.ad] ?? arac.ad}
    </span>
  );
}

export function SohbetKutusu() {
  const acik = useHaritaDurumu((d) => d.sohbetAcik);
  const ayarla = useHaritaDurumu((d) => d.sohbetAyarla);
  const seciliId = useHaritaDurumu((d) => d.seciliBinaId);
  const varsayimlar = useHaritaDurumu((d) => d.varsayimlar);
  const osb = useHaritaDurumu((d) => d.seciliOsb);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [metin, setMetin] = useState("");
  const sohbet = useSohbet();
  const sonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sonRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mesajlar, sohbet.isPending]);

  function gonder(soru: string) {
    const temiz = soru.trim();
    if (!temiz || sohbet.isPending) return;
    // Hata mesajları geçmişe girmez; son 20 mesaj gider ve sonuncusu kullanıcının sorusudur.
    // Seçili bina varsa bina_id ile gönderilir, asistan bina_detayi aracıyla okur.
    // Kaydırıcı değerleri ve haritada açık OSB de gider; asistanın araçları aynı OSB ve varsayımlarla hesaplar.
    const mesajlarIstek = [
      ...mesajlar.filter((m) => !m.hata).map(({ rol, metin }) => ({ rol, metin: metin.slice(0, EN_COK_KARAKTER) })),
      { rol: "kullanici" as const, metin: temiz },
    ].slice(-EN_COK_MESAJ);
    setMesajlar((m) => [...m, { rol: "kullanici", metin: temiz }]);
    setMetin("");
    sohbet.mutate(
      { mesajlar: mesajlarIstek, bina_id: seciliId, varsayimlar, osb },
      {
        onSuccess: (y) =>
          setMesajlar((m) => [...m, { rol: "asistan", metin: y.cevap, araclar: y.araclar, model: y.model }]),
        onError: (e) => setMesajlar((m) => [...m, { rol: "asistan", metin: e.message, hata: true }]),
      },
    );
  }

  function gonderForm(e: FormEvent) {
    e.preventDefault();
    gonder(metin);
  }

  if (!acik) {
    return (
      <button
        type="button"
        onClick={() => ayarla(true)}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-xl hover:bg-amber-300"
      >
        💬 Asistana sor
      </button>
    );
  }

  return (
    <div className="pointer-events-auto flex h-[min(560px,70dvh)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Çatı Radarı asistanı</p>
          <p className="text-[11px] text-slate-400">Sayılar hesap motorundan gelir</p>
        </div>
        <button
          type="button"
          onClick={() => ayarla(false)}
          className="rounded-full px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          aria-label="Sohbeti kapat"
        >
          ✕
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {mesajlar.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Örnek sorular:</p>
            {ORNEK_SORULAR.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => gonder(s)}
                className="block w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {mesajlar.map((m, i) => (
          <div key={i} className={m.rol === "kullanici" ? "flex justify-end" : "space-y-1.5"}>
            <p
              className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.rol === "kullanici"
                  ? "max-w-[85%] bg-amber-400 text-slate-900"
                  : m.hata
                    ? "bg-red-500/10 text-red-200"
                    : "bg-white/5 text-slate-100"
              }`}
            >
              {m.metin}
            </p>
            {m.araclar && m.araclar.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-500">Kullanılan araçlar:</span>
                {m.araclar.map((a, j) => (
                  <AracEtiketi key={j} arac={a} />
                ))}
              </div>
            )}
            {m.model && <p className="text-[10px] text-slate-600">Model: {m.model}</p>}
          </div>
        ))}
        {sohbet.isPending && <p className="text-xs text-slate-400">Asistan tabloyu okuyor…</p>}
        <div ref={sonRef} />
      </div>

      <form onSubmit={gonderForm} className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            maxLength={EN_COK_KARAKTER}
            placeholder="Sorunuzu yazın"
            aria-label="Asistana soru"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!metin.trim() || sohbet.isPending}
            className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
          >
            Gönder
          </button>
        </div>
        <p className="mt-1.5 flex justify-between gap-2 text-[10px] leading-snug text-slate-500">
          <span>Yazdıklarınız Google Gemini API&apos;sine gider. Firma sırrı yazmayın.</span>
          {metin.length > EN_COK_KARAKTER - 200 && (
            <span className="shrink-0 tabular-nums text-amber-300">
              {metin.length}/{EN_COK_KARAKTER}
            </span>
          )}
        </p>
      </form>
    </div>
  );
}
