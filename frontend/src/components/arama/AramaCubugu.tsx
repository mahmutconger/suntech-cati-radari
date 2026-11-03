"use client";

// Ad ya da bina numarasıyla arama. Şimdilik yüklü binalar içinde arar;
// backend /binalar/ara hazır olunca sorgu oraya taşınır.

import { useMemo, useState } from "react";
import { Building2, Search, X } from "lucide-react";
import { BASLIK_YUKSEKLIGI } from "@/components/harita/HaritaKontrolleri";
import { useBinalar } from "@/hooks/veri";
import { binaAdi } from "@/components/ortak/Deger";
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
      <label
        className={`cam flex w-full items-center gap-2 rounded-full pl-4 pr-2 transition focus-within:ring-2 focus-within:ring-seftali/60 ${BASLIK_YUKSEKLIGI}`}
      >
        <Search className="h-5 w-5 shrink-0 text-murekkep/60" aria-hidden />
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
          placeholder="Fabrika ya da bina no ara"
          aria-label="Bina ara"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-murekkep outline-none placeholder:text-murekkep/45 [&::-webkit-search-cancel-button]:hidden"
        />
        {sorgu && (
          <button
            type="button"
            onClick={() => setSorgu("")}
            aria-label="Aramayı temizle"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-murekkep/55 hover:bg-murekkep/5"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </label>
      {acik && sorgu && (
        <ul className="cam absolute left-0 right-0 top-full z-[1100] mt-2 overflow-hidden rounded-2xl text-sm">
          {sonuclar.length === 0 ? (
            <li className="px-4 py-3 text-murekkep/55">Sonuç yok</li>
          ) : (
            sonuclar.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => sec(b.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-murekkep hover:bg-limon/30"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-murekkep/45" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{binaAdi(b)}</span>
                  <span className="text-xs text-murekkep/50">{alan(b.alan_m2)}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
