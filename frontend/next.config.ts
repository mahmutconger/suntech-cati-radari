import type { NextConfig } from "next";

// Backend (FastAPI, Cloud Run) adresi. Tarayıcı yalnızca /api/v1'i görür,
// Next.js istekleri bu adrese yönlendirir; böylece CORS ve adres karmaşası olmaz.
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Cache Components kapalı: açıkken Next.js sayfadan çıkınca haritayı <Activity> ile gizleyip
  // geri getiriyor; Leaflet haritası bunu desteklemiyor ve "Map container is being reused" hatası veriyor.
  // Uygulama zaten istemci tarafında çalıştığı için bu özelliğe ihtiyacımız yok.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async rewrites() {
    if (!API_BASE_URL) return [];
    return [{ source: "/api/v1/:yol*", destination: `${API_BASE_URL}/api/v1/:yol*` }];
  },
};

export default nextConfig;
