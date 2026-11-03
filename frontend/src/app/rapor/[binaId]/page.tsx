import type { Metadata } from "next";
import { RaporSayfasi } from "@/components/rapor/RaporSayfasi";

export const metadata: Metadata = { title: "Ön fizibilite raporu · Çatı Radarı" };

export default async function RaporSayfa({ params }: PageProps<"/rapor/[binaId]">) {
  const { binaId } = await params;
  return <RaporSayfasi binaId={Number(binaId)} />;
}
