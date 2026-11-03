"use client";

// Panel sekmeleri. Çubuk panelin üstüne yapışır; seçili sekmenin degrade zemini sekmeden sekmeye kayar.
// Sekme içerikleri ilk açılışta takılır ve sonra gizlenip kalır: simülasyon ayarları gibi
// girilmiş değerler sekme değişince kaybolmaz.

import { motion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { SekmeTanimi } from "@/lib/bolumler";

export function SekmeCubugu<T extends string>({
  sekmeler,
  secili,
  onSec,
  etiket,
  ilgili,
}: {
  sekmeler: SekmeTanimi<T>[];
  secili: T;
  onSec: (sekme: T) => void;
  /** Ekran okuyucu için sekme grubunun adı. */
  etiket: string;
  /** Haritadaki düğmeyle gidilen bölümün ilgili bölümlerini içeren sekmeler (küçük nokta). */
  ilgili?: ReadonlySet<T>;
}) {
  const kimlik = useId();

  const dugmeler = useRef<(HTMLButtonElement | null)[]>([]);

  // Ok tuşları, Home ve End ile sekmeler arasında gezinme.
  function tus(e: KeyboardEvent, i: number) {
    const son = sekmeler.length - 1;
    const hedef =
      e.key === "ArrowRight"
        ? i === son
          ? 0
          : i + 1
        : e.key === "ArrowLeft"
          ? i === 0
            ? son
            : i - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? son
              : null;
    if (hedef === null) return;
    e.preventDefault();
    onSec(sekmeler[hedef].ad);
    dugmeler.current[hedef]?.focus();
  }

  return (
    <div className="sticky top-[calc(var(--panel-ust,0px)*-1)] z-30 -mx-(--panel-pay) bg-[#f3efe5]/90 px-(--panel-pay) py-2.5 backdrop-blur-md">
      <div
        role="tablist"
        aria-label={etiket}
        className="flex gap-1 rounded-2xl bg-white/80 p-1 shadow-[0_1px_3px_rgb(28_26_23/0.08)] ring-1 ring-murekkep/[0.12]"
      >
        {sekmeler.map((s, i) => {
          const acik = s.ad === secili;
          return (
            <button
              key={s.ad}
              ref={(el) => {
                dugmeler.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={acik}
              tabIndex={acik ? 0 : -1}
              title={s.etiket}
              onClick={() => onSec(s.ad)}
              onKeyDown={(e) => tus(e, i)}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-seftali/70 @xl:flex-row @xl:justify-center @xl:gap-2 @xl:py-2 @xl:text-xs ${
                acik ? "text-murekkep" : "text-murekkep/60 hover:bg-murekkep/5 hover:text-murekkep"
              }`}
            >
              {acik && (
                <motion.span
                  layoutId={`${kimlik}-secili`}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-limon to-seftali shadow-sm"
                />
              )}
              <s.Ikon className="relative h-4 w-4 shrink-0" aria-hidden />
              <span className="relative max-w-full truncate">
                <span className="@xl:hidden">{s.kisa ?? s.etiket}</span>
                <span className="hidden @xl:inline">{s.etiket}</span>
              </span>
              {ilgili?.has(s.ad) && !acik && (
                <span
                  aria-label="ilgili bölüm"
                  className="absolute right-1.5 top-1 h-1.5 w-1.5 rounded-full bg-seftali ring-2 ring-white"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Sekmelerin içerikleri. Açılan sekme takılır ve takılı kalır; açık olmayanlar `hidden` ile gizlenir.
 * `sekmeler` yalnızca ekran okuyucu etiketleri içindir.
 */
export function SekmeIcerikleri<T extends string>({
  sekmeler,
  secili,
  icerikler,
}: {
  sekmeler: SekmeTanimi<T>[];
  secili: T;
  icerikler: Partial<Record<T, ReactNode>>;
}) {
  const [takili, setTakili] = useState<ReadonlySet<T>>(() => new Set([secili]));
  // Yeni açılan sekmeyi takılılara ekle (render sırasında; React'in önerdiği "önceki değere göre" kalıbı).
  if (!takili.has(secili)) setTakili(new Set([...takili, secili]));

  return (
    <>
      {(Object.keys(icerikler) as T[]).map((ad) =>
        takili.has(ad) || ad === secili ? (
          <div
            key={ad}
            role="tabpanel"
            hidden={ad !== secili}
            aria-label={sekmeler.find((s) => s.ad === ad)?.etiket ?? ad}
            className="sekme-paneli space-y-4 pt-1"
          >
            {icerikler[ad]}
          </div>
        ) : null,
      )}
    </>
  );
}
