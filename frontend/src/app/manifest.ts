import type { MetadataRoute } from "next";

// "Ana ekrana ekle" için web uygulaması bildirimi. Çevrimdışı çalışma yok (PROJE.md 4.5, madde 1).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Çatı Radarı · Manisa OSB güneş potansiyeli",
    short_name: "Çatı Radarı",
    description:
      "Manisa OSB çatıları için bina bazında güneş enerjisi ve yatırım ön analizi: kWp, üretim, tasarruf, geri ödeme, CO₂.",
    lang: "tr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [
      { src: "/ikonlar/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ikonlar/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/ikonlar/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
