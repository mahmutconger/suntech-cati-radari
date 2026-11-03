import type { Metadata } from "next";
import { OturumKapisi } from "@/components/oturum/OturumKapisi";
import { RaporSayfasi } from "@/components/rapor/RaporSayfasi";

export const metadata: Metadata = { title: "Ön fizibilite raporu · Çatı Radarı" };

export default async function RaporSayfa({ params }: PageProps<"/rapor/[binaId]">) {
  const { binaId } = await params;
  return (
    <OturumKapisi>
      <RaporSayfasi binaId={Number(binaId)} />
    </OturumKapisi>
  );
}
