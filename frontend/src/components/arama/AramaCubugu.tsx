"use client";

// Ad ya da bina numarasıyla arama. Şimdilik yüklü binalar içinde arar;
// backend /binalar/ara hazır olunca sorgu oraya taşınır.

import { useMemo, useState } from "react";
import { useBinalar } from "@/hooks/veri";
import { alan } from "@/lib/bicim";
import { useHaritaDurumu } from "@/store/harita";

function normal(metin: string) {
  return metin.toLocaleLowerCase("tr-TR").trim();
}

export function AramaCubugu() {
  const [sorgu, setSorgu] = useState("");
  const [acik, setAcik] = useState(false);
  const { data } = useBinalar();
  const binaSec = useHaritaDurumu((d) => d.binaSec);

  const sonuclar = useMemo(() => {
    const q = normal(sorgu);
    if (!q || !data) return [];
    return data.features
      .map((f) => f.properties)
      .filter((b) => String(b.id) === q || (b.ad && normal(b.ad).includes(q)))
      .slice(0, 8);
  }, [sorgu, data]);

  function sec(id: number) {
    binaSec(id, true);
    setSorgu("");
    setAcik(false);
  }

  return (
    <div className="relative w-full">
      <input
        type="search"
        value={sorgu}
        onChange={(e) => {
          setSorgu(e.target.value);
          setAcik(true);
        }}
        onFocus={() => setAcik(true)}
        onBlur={() => setTimeout(() => setAcik(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && sonuclar[0]) sec(sonuclar[0].id);
        }}
        placeholder="Fabrika adı ya da bina no ara"
        aria-label="Bina ara"
        className="w-full rounded-full border border-white/15 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 shadow-lg outline-none backdrop-blur placeholder:text-slate-400 focus:border-amber-400"
      />
      {acik && sorgu && (
        <ul className="absolute left-0 right-0 top-full z-[1100] mt-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 text-sm shadow-xl backdrop-blur">
          {sonuclar.length === 0 ? (
            <li className="px-4 py-3 text-slate-400">Sonuç yok</li>
          ) : (
            sonuclar.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => sec(b.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-slate-100 hover:bg-white/10"
                >
                  <span>{b.ad ?? `Bina #${b.id}`}</span>
                  <span className="text-xs text-slate-400">{alan(b.alan_m2)}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
