// Backend'in OpenAPI şemasından src/types/api.ts dosyasını üretir.
// Kullanım: npm run tipler
// Şema adresi OPENAPI_URL ile değiştirilebilir (Windows, macOS ve Linux'ta aynı çalışır).
//   PowerShell: $env:OPENAPI_URL="https://<cloud-run-adresi>/openapi.json"; npm run tipler
//   bash/zsh:   OPENAPI_URL=https://<cloud-run-adresi>/openapi.json npm run tipler
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const kaynak = process.env.OPENAPI_URL ?? "http://localhost:8000/openapi.json";
const paketDizini = path.dirname(require.resolve("openapi-typescript/package.json"));
const cli = path.join(paketDizini, "bin", "cli.js");

console.log(`Şema okunuyor: ${kaynak}`);
execFileSync(process.execPath, [cli, kaynak, "-o", "src/types/api.ts"], { stdio: "inherit" });
console.log("src/types/api.ts üretildi. Bu dosya elle değiştirilmez.");
