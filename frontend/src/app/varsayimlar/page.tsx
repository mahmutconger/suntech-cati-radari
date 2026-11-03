import type { Metadata } from "next";
import { DashKabugu } from "@/components/ortak/DashKabugu";
import { VarsayimlarIcerigi } from "./VarsayimlarIcerigi";

export const metadata: Metadata = {
  title: "Varsayımlar ve Kaynaklar · Çatı Radarı",
  description:
    "Manisa OSB Çatı Radarı güneş enerjisi ve yatırım ön analizinde kullanılan varsayımlar, formüller, kaynaklar ve tarihler.",
};

export default function VarsayimlarSayfasi() {
  return (
    <DashKabugu
      aktif="varsayimlar"
      ust="Hesap yöntemi"
      baslik="Varsayımlar, Hesap Yöntemi ve Kaynaklar"
      aciklama="Çatı Radarı’ndaki bütün rakamlar deterministik hesap motorundan üretilir. Aşağıdaki varsayımlar ilk kaba tarama ve 25 yıllık finansal analiz içindir; ana ekrandaki kaydırıcılarla değiştirilebilir."
    >
      <VarsayimlarIcerigi />
    </DashKabugu>
  );
}
