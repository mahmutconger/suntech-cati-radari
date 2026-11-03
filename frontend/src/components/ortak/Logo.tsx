import Link from "next/link";
import { Sun } from "lucide-react";

/**
 * Çatı Radarı logosu: degrade daire içinde güneş ve ad. `cam` verilirse başlıktaki cam hapın içinde durur.
 * `adSinifi` ile adın hangi genişliklerde görüneceği verilir (başlıkta yer darsa yalnızca ikon kalır).
 */
export function Logo({ cam = false, href = "/", adSinifi = "" }: { cam?: boolean; href?: string; adSinifi?: string }) {
  return (
    <Link
      href={href}
      aria-label="Çatı Radarı ana sayfa"
      className={`group flex shrink-0 items-center gap-2.5 text-murekkep ${cam ? "cam h-12 rounded-full p-1" : ""}`}
    >
      <span className="flex aspect-square h-10 items-center justify-center rounded-full bg-gradient-to-br from-limon via-seftali to-mercan shadow-inner">
        <Sun className="h-5 w-5 text-murekkep" strokeWidth={2.4} aria-hidden />
      </span>
      <span className={`pr-3 text-base font-bold tracking-tight md:text-lg ${adSinifi}`}>Çatı Radarı</span>
    </Link>
  );
}
