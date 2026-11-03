"use client";

// Bizim API'mize (FastAPI, /api/v1) giden bütün istekler buradan geçer.
// Oturum açıksa Firebase ID token'ı "Authorization: Bearer" başlığına eklenir;
// backend bu token'ı firebase-admin ile doğrular.

import { kimlikTokeni } from "@/lib/firebase";
import type { ApiHatasiGovdesi } from "@/types/gecici";

export const SAHTE_VERI = process.env.NEXT_PUBLIC_SAHTE_VERI === "1";

const TABAN = "/api/v1";

export class ApiHatasi extends Error {
  constructor(
    public readonly kod: string,
    mesaj: string,
    public readonly durum: number,
  ) {
    super(mesaj);
    this.name = "ApiHatasi";
  }
}

type Yontem = "GET" | "POST" | "DELETE";

async function istek<T>(yontem: Yontem, yol: string, govde?: unknown): Promise<T> {
  const basliklar: Record<string, string> = { Accept: "application/json" };
  if (govde !== undefined) basliklar["Content-Type"] = "application/json";
  const token = await kimlikTokeni();
  if (token) basliklar.Authorization = `Bearer ${token}`;

  let yanit: Response;
  try {
    yanit = await fetch(`${TABAN}${yol}`, {
      method: yontem,
      headers: basliklar,
      body: govde === undefined ? undefined : JSON.stringify(govde),
    });
  } catch {
    throw new ApiHatasi("baglanti", "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.", 0);
  }

  if (!yanit.ok) {
    let kod = "bilinmeyen";
    let mesaj = "Beklenmeyen bir hata oluştu.";
    try {
      const veri = (await yanit.json()) as Partial<ApiHatasiGovdesi>;
      if (veri.hata) ({ kod, mesaj } = veri.hata);
    } catch {
      // Gövde JSON değilse varsayılan mesaj kalır.
    }
    throw new ApiHatasi(kod, mesaj, yanit.status);
  }

  if (yanit.status === 204) return undefined as T;
  return (await yanit.json()) as T;
}

export const api = {
  get: <T>(yol: string) => istek<T>("GET", yol),
  post: <T>(yol: string, govde?: unknown) => istek<T>("POST", yol, govde),
  sil: <T>(yol: string) => istek<T>("DELETE", yol),
};
