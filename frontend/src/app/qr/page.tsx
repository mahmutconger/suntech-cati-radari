import type { Metadata } from "next";
import { QrEkrani } from "@/components/sunum/QrEkrani";

export const metadata: Metadata = { title: "QR · Çatı Radarı" };

export default function QrSayfasi() {
  return <QrEkrani />;
}
