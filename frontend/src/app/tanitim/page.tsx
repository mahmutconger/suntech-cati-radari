import type { Metadata } from "next";
import { TanitimEkrani } from "@/components/tanitim/TanitimEkrani";
import { guvenliYol } from "@/lib/yonlendirme";

export const metadata: Metadata = { title: "Çatı Radarı · Çatınızın güneş potansiyeli" };

export default async function TanitimSayfasi({ searchParams }: PageProps<"/tanitim">) {
  const { sonra } = await searchParams;
  return <TanitimEkrani sonra={guvenliYol(typeof sonra === "string" ? sonra : null)} />;
}
