import type { Metadata } from "next";
import { DashKabugu } from "@/components/ortak/DashKabugu";
import { KayitlarListesi } from "@/components/oturum/KayitlarListesi";
import { OturumKapisi } from "@/components/oturum/OturumKapisi";

export const metadata: Metadata = { title: "Kayıtlarım · Çatı Radarı" };

export default function KayitlarimSayfasi() {
  return (
    <OturumKapisi>
      <DashKabugu
        aktif="kayitlarim"
        ust="Hesabım"
        baslik="Kayıtlarım"
        aciklama="Kaydettiğiniz analizleri yalnızca siz görürsünüz; her biri kaydedildiği varsayım ve tüketimle açılır."
      >
        <KayitlarListesi />
      </DashKabugu>
    </OturumKapisi>
  );
}
