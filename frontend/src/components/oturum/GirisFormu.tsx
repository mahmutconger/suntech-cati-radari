"use client";

// Giriş ekranının sol sütunu: Giriş ⇄ Kayıt geçişi ve şifre sıfırlama. Yalnızca e-posta ve şifre (Firebase Auth).
// Açık tema: zemin, limon, şeftali, mercan (globals.css).

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { EN_KISA_SIFRE, girisYap, kayitOl, oturumHatasi, SAHTE_OTURUM, sifreSifirlamaGonder } from "@/lib/oturum";
import { guvenliYol } from "@/lib/yonlendirme";
import { useOturum } from "@/store/oturum";

type Mod = "giris" | "kayit" | "sifirla";

const METINLER: Record<Mod, { baslik: string; aciklama: string; dugme: string }> = {
  giris: {
    baslik: "Hoş geldiniz",
    aciklama: "Giriş yapın, çatıları inceleyin ve analizlerinizi Kayıtlarım'da saklayın.",
    dugme: "Giriş yap",
  },
  kayit: {
    baslik: "Hesap oluşturun",
    aciklama: "Çatınızın güneş potansiyelini görmek için birkaç saniyede hesap açın.",
    dugme: "Hesap oluştur",
  },
  sifirla: {
    baslik: "Şifrenizi sıfırlayın",
    aciklama: "E-posta adresinizi yazın, size şifre sıfırlama bağlantısı gönderelim.",
    dugme: "Sıfırlama bağlantısı gönder",
  },
};

/** Sıralı giriş animasyonu: her öğe bir öncekinden biraz sonra belirir. */
function sira(n: number): CSSProperties {
  return { "--sira": n } as CSSProperties;
}

function CamKutu({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-murekkep/10 bg-murekkep/[0.03] backdrop-blur-sm transition-colors focus-within:border-seftali focus-within:bg-limon/10">
      {children}
    </div>
  );
}

const GIRDI = "w-full rounded-2xl bg-transparent p-4 text-sm text-murekkep placeholder:text-murekkep/35 focus:outline-none";
const ANA_DUGME =
  "w-full rounded-2xl bg-limon py-4 font-semibold text-murekkep transition-colors hover:bg-limon/80 disabled:opacity-50";

function SifreAlani({
  etiket,
  deger,
  degistir,
  autoComplete,
  yerTutucu,
}: {
  etiket: string;
  deger: string;
  degistir: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  yerTutucu: string;
}) {
  const id = useId();
  const [gorunur, setGorunur] = useState(false);
  const Ikon = gorunur ? EyeOff : Eye;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-murekkep/60">
        {etiket}
      </label>
      <CamKutu>
        <div className="relative">
          <input
            id={id}
            type={gorunur ? "text" : "password"}
            autoComplete={autoComplete}
            required
            minLength={EN_KISA_SIFRE}
            value={deger}
            onChange={(e) => degistir(e.target.value)}
            placeholder={yerTutucu}
            className={`${GIRDI} pr-12`}
          />
          <button
            type="button"
            onClick={() => setGorunur(!gorunur)}
            aria-label={gorunur ? "Şifreyi gizle" : "Şifreyi göster"}
            className="absolute inset-y-0 right-3 flex items-center text-murekkep/40 transition-colors hover:text-murekkep"
          >
            <Ikon className="h-5 w-5" />
          </button>
        </div>
      </CamKutu>
    </div>
  );
}

function Uyari({ tur, children }: { tur: "hata" | "basari"; children: ReactNode }) {
  return (
    <p
      role={tur === "hata" ? "alert" : "status"}
      className={`rounded-2xl px-4 py-3 text-sm ${tur === "hata" ? "bg-mercan/10 text-mercan-koyu" : "bg-limon/30 text-murekkep"}`}
    >
      {children}
    </p>
  );
}

const BAG = "font-semibold text-murekkep underline decoration-seftali decoration-2 underline-offset-4 transition-colors hover:decoration-mercan";

function BagMetni({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={BAG}>
      {children}
    </button>
  );
}

export function GirisFormu() {
  const router = useRouter();
  const parametreler = useSearchParams();
  const sonra = guvenliYol(parametreler.get("sonra"));
  const kullanici = useOturum((d) => d.kullanici);
  const epostaId = useId();

  // Tanıtım ekranındaki "Hesap oluştur" düğmeleri ?mod=kayit ile gelir.
  const [mod, setMod] = useState<Mod>(parametreler.get("mod") === "kayit" ? "kayit" : "giris");
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [hatirla, setHatirla] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  /** Kayıt başarılı olunca yönlendirmeden önce doğrulama bilgisini gösteririz. */
  const [kayitSonucu, setKayitSonucu] = useState<{ eposta: string; dogrulama: boolean } | null>(null);
  // Kayıt sırasında Firebase oturumu hemen açar; otomatik yönlendirme bilgi ekranını atlamasın.
  const kayitSurecinde = useRef(false);

  // Oturum açılınca (ya da zaten açıksa) geldiği yere dön.
  useEffect(() => {
    if (kullanici && !kayitSurecinde.current) router.replace(sonra);
  }, [kullanici, router, sonra]);

  function modaGec(yeni: Mod) {
    setMod(yeni);
    setHata(null);
    setBilgi(null);
    setSifre("");
    setSifreTekrar("");
  }

  async function gonder(e: FormEvent) {
    e.preventDefault();
    setHata(null);
    setBilgi(null);
    const temizEposta = eposta.trim();

    if (mod === "kayit" && sifre !== sifreTekrar) {
      setHata("Şifreler eşleşmiyor.");
      return;
    }

    setBekliyor(true);
    try {
      if (mod === "giris") {
        await girisYap(temizEposta, sifre, hatirla);
      } else if (mod === "kayit") {
        kayitSurecinde.current = true;
        const sonuc = await kayitOl(temizEposta, sifre, hatirla);
        setKayitSonucu({ eposta: temizEposta, dogrulama: sonuc.dogrulamaGonderildi });
      } else {
        await sifreSifirlamaGonder(temizEposta);
        setBilgi(
          "Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderdik. Gelen kutunuzu ve istenmeyen klasörünü kontrol edin.",
        );
      }
    } catch (err) {
      kayitSurecinde.current = false;
      setHata(oturumHatasi(err));
    } finally {
      setBekliyor(false);
    }
  }

  if (kayitSonucu) {
    return (
      <div className="giris-oge w-full max-w-md space-y-6" style={sira(0)}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-limon/50 text-murekkep">
          <Mail className="h-7 w-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-tighter text-murekkep">Hesabınız hazır</h1>
          {kayitSonucu.dogrulama ? (
            <p className="text-murekkep/60">
              <span className="font-medium text-murekkep">{kayitSonucu.eposta}</span> adresine bir doğrulama bağlantısı
              gönderdik. Gelen kutunuzu ve istenmeyen klasörünü kontrol edin. Doğrulamadan da uygulamayı kullanmaya
              devam edebilirsiniz.
            </p>
          ) : (
            <p className="text-murekkep/60">
              <span className="font-medium text-murekkep">{kayitSonucu.eposta}</span> ile oturumunuz açıldı.
            </p>
          )}
        </div>
        <button type="button" onClick={() => router.replace(sonra)} className={ANA_DUGME}>
          Devam et
        </button>
      </div>
    );
  }

  const metin = METINLER[mod];

  return (
    // key={mod}: mod değişince giriş animasyonu baştan oynar.
    <div key={mod} className="w-full max-w-md">
      <div className="flex flex-col gap-6">
        <Link
          href={`/tanitim?${new URLSearchParams({ sonra })}`}
          className="giris-oge w-fit text-sm text-murekkep/50 transition-colors hover:text-murekkep"
          style={sira(0)}
        >
          ← Tanıtıma dön
        </Link>

        <div className="space-y-3">
          <h1 className="giris-oge text-4xl font-light leading-tight tracking-tighter text-murekkep md:text-5xl" style={sira(1)}>
            {metin.baslik}
          </h1>
          <p className="giris-oge text-murekkep/60" style={sira(2)}>
            {metin.aciklama}
          </p>
        </div>

        <form onSubmit={gonder} className="space-y-5">
          <div className="giris-oge" style={sira(3)}>
            <label htmlFor={epostaId} className="mb-1.5 block text-sm font-medium text-murekkep/60">
              E-posta adresi
            </label>
            <CamKutu>
              <input
                id={epostaId}
                type="email"
                autoComplete="email"
                required
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                placeholder="ornek@firma.com"
                className={GIRDI}
              />
            </CamKutu>
          </div>

          {mod !== "sifirla" && (
            <div className="giris-oge" style={sira(4)}>
              <SifreAlani
                etiket="Şifre"
                deger={sifre}
                degistir={setSifre}
                autoComplete={mod === "giris" ? "current-password" : "new-password"}
                yerTutucu={mod === "giris" ? "Şifrenizi girin" : `En az ${EN_KISA_SIFRE} karakter`}
              />
            </div>
          )}

          {mod === "kayit" && (
            <div className="giris-oge" style={sira(5)}>
              <SifreAlani
                etiket="Şifre tekrarı"
                deger={sifreTekrar}
                degistir={setSifreTekrar}
                autoComplete="new-password"
                yerTutucu="Şifrenizi tekrar girin"
              />
            </div>
          )}

          {mod !== "sifirla" && (
            <div className="giris-oge flex items-center justify-between gap-3 text-sm" style={sira(6)}>
              <label className="flex cursor-pointer items-center gap-3 text-murekkep/80">
                <input
                  type="checkbox"
                  checked={hatirla}
                  onChange={(e) => setHatirla(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded accent-seftali"
                />
                Beni hatırla
              </label>
              {mod === "giris" && <BagMetni onClick={() => modaGec("sifirla")}>Şifremi unuttum</BagMetni>}
            </div>
          )}

          {hata && <Uyari tur="hata">{hata}</Uyari>}
          {bilgi && <Uyari tur="basari">{bilgi}</Uyari>}

          <button type="submit" disabled={bekliyor} className={`giris-oge ${ANA_DUGME}`} style={sira(7)}>
            {bekliyor ? "Bekleyin…" : metin.dugme}
          </button>
        </form>

        <p className="giris-oge text-center text-sm text-murekkep/60" style={sira(8)}>
          {mod === "giris" && (
            <>
              Hesabınız yok mu? <BagMetni onClick={() => modaGec("kayit")}>Hesap oluşturun</BagMetni>
            </>
          )}
          {mod === "kayit" && (
            <>
              Zaten hesabınız var mı? <BagMetni onClick={() => modaGec("giris")}>Giriş yapın</BagMetni>
            </>
          )}
          {mod === "sifirla" && <BagMetni onClick={() => modaGec("giris")}>← Girişe dön</BagMetni>}
        </p>

        {SAHTE_OTURUM && (
          <p className="text-[11px] text-murekkep/50">
            Firebase ayarları girilmedi: sahte oturum açılır, şifre kontrol edilmez (geliştirme).
          </p>
        )}
      </div>
    </div>
  );
}
