"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { girisYap, kayitOl, oturumHatasi, SAHTE_OTURUM } from "@/lib/oturum";
import { useOturum } from "@/store/oturum";

type Mod = "giris" | "kayit";

/** Yalnızca site içi yollara dönülür (açık yönlendirme olmasın). */
function guvenliYol(yol: string | null): string {
  return yol && yol.startsWith("/") && !yol.startsWith("//") ? yol : "/";
}

export function GirisFormu() {
  const router = useRouter();
  const sonra = guvenliYol(useSearchParams().get("sonra"));
  const kullanici = useOturum((d) => d.kullanici);
  const [mod, setMod] = useState<Mod>("giris");
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  // Oturum açılınca (ya da zaten açıksa) geldiği yere dön.
  useEffect(() => {
    if (kullanici) router.replace(sonra);
  }, [kullanici, router, sonra]);

  async function gonder(e: FormEvent) {
    e.preventDefault();
    setHata(null);
    setBekliyor(true);
    try {
      await (mod === "giris" ? girisYap(eposta.trim(), sifre) : kayitOl(eposta.trim(), sifre));
    } catch (err) {
      setHata(oturumHatasi(err));
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
      <div>
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Haritaya dön
        </Link>
        <h1 className="mt-3 text-xl font-bold text-slate-50">
          {mod === "giris" ? "Giriş yap" : "Hesap oluştur"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">Analizlerinizi kaydedip Kayıtlarım&apos;da görmek için.</p>
      </div>

      <div className="grid grid-cols-2 rounded-full bg-white/5 p-1 text-sm">
        {(["giris", "kayit"] as Mod[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMod(m);
              setHata(null);
            }}
            aria-pressed={mod === m}
            className={`rounded-full py-1.5 font-medium ${mod === m ? "bg-amber-400 text-slate-900" : "text-slate-300"}`}
          >
            {m === "giris" ? "Giriş" : "Kayıt"}
          </button>
        ))}
      </div>

      <form onSubmit={gonder} className="space-y-3">
        <label className="block text-xs font-medium text-slate-300">
          E-posta
          <input
            type="email"
            autoComplete="email"
            required
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
        <label className="block text-xs font-medium text-slate-300">
          Şifre
          <input
            type="password"
            autoComplete={mod === "giris" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
        {hata && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">{hata}</p>}
        <button
          type="submit"
          disabled={bekliyor}
          className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-50"
        >
          {bekliyor ? "Bekleyin…" : mod === "giris" ? "Giriş yap" : "Hesap oluştur"}
        </button>
      </form>

      {SAHTE_OTURUM && (
        <p className="text-[11px] text-amber-200/80">
          Firebase ayarları girilmedi: sahte oturum açılır, şifre kontrol edilmez (geliştirme).
        </p>
      )}
    </div>
  );
}
