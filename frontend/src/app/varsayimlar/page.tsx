import type { Metadata } from "next";
import { VarsayimlarIcerigi } from "./VarsayimlarIcerigi";

export const metadata: Metadata = {
  title: "Varsayımlar ve Kaynaklar · Çatı Radarı",
  description:
    "Manisa OSB Çatı Radarı güneş enerjisi ve yatırım ön analizinde kullanılan varsayımlar, formüller, kaynaklar ve tarihler.",
};

export default function VarsayimlarSayfasi() {
  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <VarsayimlarIcerigi />
    </main>
  );
}
