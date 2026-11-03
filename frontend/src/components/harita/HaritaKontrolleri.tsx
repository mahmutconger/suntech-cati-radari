"use client";

// Harita üstündeki kontroller: katman seçici, trafo düğmesi ve lejant. Açık tema, cam yüzey.
// Başlıktaki bütün alanlar 48 px yüksekliğinde; geniş ekranda (xl, 1280 px ve üstü) tek satıra sığar.

import { Map as HaritaIkonu, QrCode, Satellite, UtilityPole, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { KATMANLAR, type KatmanTuru } from "@/lib/sabitler";
import { useSkorVar } from "@/hooks/veri";
import { RENK_KADEMELERI, SKOR_KADEMELERI } from "@/lib/renk";
import { SECILI_CIP } from "@/lib/stil";
import { useHaritaDurumu } from "@/store/harita";

/** Başlıktaki her alanın yüksekliği. */
export const BASLIK_YUKSEKLIGI = "h-12";

/**
 * Metin etiketleri yalnızca çok geniş ekranda (2xl) görünür; diğerlerinde ikon ve ipucu kalır.
 * Panel genişleyince (başlıkta `baslik-dar`) yazılar animasyonla kapanır (globals.css).
 * Etiketin iç boşluğu varsa içteki bir span'a verilmeli; dıştaki kutu sıfıra kadar daralır.
 */
export const BASLIK_ETIKETI = "baslik-etiketi";

const KATMAN_IKONU: Record<KatmanTuru, LucideIcon> = { uydu: Satellite, sokak: HaritaIkonu };

export function KatmanSecici() {
  const katman = useHaritaDurumu((d) => d.katman);
  const degistir = useHaritaDurumu((d) => d.katmanDegistir);
  return (
    <div role="group" aria-label="Harita katmanı" className={`cam flex items-center gap-1 rounded-full p-1 ${BASLIK_YUKSEKLIGI}`}>
      {(Object.keys(KATMANLAR) as KatmanTuru[]).map((tur) => {
        const Ikon = KATMAN_IKONU[tur];
        const secili = katman === tur;
        return (
          <button
            key={tur}
            type="button"
            onClick={() => degistir(tur)}
            aria-pressed={secili}
            title={`${KATMANLAR[tur].ad} haritası`}
            className={`flex h-full items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
              secili ? SECILI_CIP : "text-murekkep/70 hover:bg-murekkep/5"
            }`}
          >
            <Ikon className="h-5 w-5" aria-hidden />
            <span className={BASLIK_ETIKETI}>{KATMANLAR[tur].ad}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Renk modu düğmeleri; skor yalnızca backend uygunluk skorunu döndürüyorsa görünür. */
function RenkModuSecici({ kucuk = false }: { kucuk?: boolean }) {
  const mod = useHaritaDurumu((d) => d.renkModu);
  const ayarla = useHaritaDurumu((d) => d.renkModuAyarla);
  const skorVar = useSkorVar();
  if (!skorVar) return null;
  return (
    <div className={`flex rounded-full bg-murekkep/5 p-0.5 ${kucuk ? "text-[10px]" : "text-[11px]"}`}>
      {(
        [
          ["tasarruf", "Tasarruf"],
          ["skor", "Uygunluk"],
        ] as const
      ).map(([deger, etiket]) => (
        <button
          key={deger}
          type="button"
          onClick={() => ayarla(deger)}
          aria-pressed={mod === deger}
          className={`rounded-full px-2.5 py-0.5 font-semibold ${mod === deger ? SECILI_CIP : "text-murekkep/60 hover:bg-murekkep/5"}`}
        >
          {etiket}
        </button>
      ))}
    </div>
  );
}

export function Lejant({ kompakt = false }: { kompakt?: boolean }) {
  const skorVar = useSkorVar();
  const mod = useHaritaDurumu((d) => (skorVar ? d.renkModu : "tasarruf"));
  const kademeler = mod === "skor" ? SKOR_KADEMELERI : RENK_KADEMELERI;

  if (kompakt) {
    return (
      <div className="cam pointer-events-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] text-murekkep">
        <RenkModuSecici kucuk />
        <span>{mod === "skor" ? "düşük" : "az"}</span>
        {kademeler.map((k) => (
          <span key={k.alt} className="inline-block h-2.5 w-3 rounded-sm ring-1 ring-murekkep/10" style={{ backgroundColor: k.renk }} />
        ))}
        <span>{mod === "skor" ? "yüksek" : "çok"}</span>
      </div>
    );
  }
  return (
    <div className="cam space-y-1.5 rounded-2xl px-3 py-2.5 text-[11px] text-murekkep">
      <RenkModuSecici />
      <p className="font-semibold">{mod === "skor" ? "Uygunluk skoru (0-100)" : "Yıllık tasarruf (TL)"}</p>
      <ul className="space-y-0.5">
        {kademeler.map((k) => (
          <li key={k.alt} className="flex items-center gap-2 text-murekkep/75">
            <span className="inline-block h-2.5 w-4 rounded-sm ring-1 ring-murekkep/10" style={{ backgroundColor: k.renk }} />
            {k.etiket}
          </li>
        ))}
      </ul>
      {mod === "skor" && (
        <p className="max-w-[180px] text-[10px] leading-snug text-murekkep/55">
          Geri ödeme, güneş verimi, sistem büyüklüğü, trafoya uzaklık ve mevcut panel durumundan.
        </p>
      )}
    </div>
  );
}

export function TrafoDugmesi() {
  const acik = useHaritaDurumu((d) => d.trafoKatmani);
  const ayarla = useHaritaDurumu((d) => d.trafoKatmaniAyarla);
  return (
    <button
      type="button"
      onClick={() => ayarla(!acik)}
      aria-pressed={acik}
      title="Trafo merkezlerini göster"
      className={`flex items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition ${BASLIK_YUKSEKLIGI} ${
        acik ? `${SECILI_CIP} border border-white/70` : "cam text-murekkep/80 hover:text-murekkep"
      }`}
    >
      <UtilityPole className="h-5 w-5" aria-hidden />
      <span className={BASLIK_ETIKETI}>Trafo</span>
    </button>
  );
}

/** Sunumdaki QR sayfası (/qr): jüri siteyi telefonundan açar. Trafo düğmesiyle aynı cam görünüm. */
export function QrDugmesi() {
  return (
    <Link
      href="/qr"
      title="Siteyi telefonda açmak için QR kod"
      aria-label="QR kod"
      className={`cam flex items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-murekkep/80 transition hover:text-murekkep ${BASLIK_YUKSEKLIGI}`}
    >
      <QrCode className="h-5 w-5" aria-hidden />
      <span className={BASLIK_ETIKETI}>QR</span>
    </Link>
  );
}
