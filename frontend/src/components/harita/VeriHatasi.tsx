"use client";

// Bina verisi yüklenemezse harita sessizce boş kalmasın: hatayı ve "Tekrar dene"yi göster.

import { RotateCw, TriangleAlert } from "lucide-react";
import { useBinalar } from "@/hooks/veri";

export function VeriHatasi() {
  const { isError, error, refetch, isFetching } = useBinalar();
  if (!isError) return null;
  return (
    <div className="cam pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2 text-sm text-mercan-koyu">
      <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
      <span>Bina verisi yüklenemedi: {error.message}</span>
      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        className="flex items-center gap-1.5 rounded-full bg-mercan/15 px-3 py-1 text-xs font-semibold hover:bg-mercan/25 disabled:opacity-50"
      >
        <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} aria-hidden />
        {isFetching ? "Deneniyor…" : "Tekrar dene"}
      </button>
    </div>
  );
}
