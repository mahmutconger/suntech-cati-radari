"use client";

// Bina verisi yüklenemezse harita sessizce boş kalmasın: hatayı ve "Tekrar dene"yi göster.

import { useBinalar } from "@/hooks/veri";

export function VeriHatasi() {
  const { isError, error, refetch, isFetching } = useBinalar();
  if (!isError) return null;
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-red-400/30 bg-red-950/90 px-4 py-2 text-sm text-red-100 shadow-xl backdrop-blur">
      <span>Bina verisi yüklenemedi: {error.message}</span>
      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        className="rounded-full bg-red-400/20 px-3 py-1 text-xs font-semibold hover:bg-red-400/30 disabled:opacity-50"
      >
        {isFetching ? "Deneniyor…" : "Tekrar dene"}
      </button>
    </div>
  );
}
