import type { Metadata, Viewport } from "next";
import { Saglayicilar } from "@/components/Saglayicilar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Çatı Radarı · Manisa OSB güneş potansiyeli",
  description:
    "Manisa OSB çatıları için bina bazında güneş enerjisi ve yatırım ön analizi: kWp, yıllık üretim, tasarruf, geri ödeme ve önlenen CO₂.",
  // iPhone'da "Ana Ekrana Ekle" ile tam ekran açılsın.
  appleWebApp: { capable: true, title: "Çatı Radarı", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function KokDuzen({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full">
        <Saglayicilar>{children}</Saglayicilar>
      </body>
    </html>
  );
}
