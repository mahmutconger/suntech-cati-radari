// SAHTE VERİ: backend /binalar ve /hesap/toplu hazır olana kadar arayüzü beslemek için.
// Hesap kaba bir taklittir; gerçek rakamları her zaman backend'in hesap motoru üretir.

import { OSB_SINIR_KUTUSU as K } from "@/lib/sabitler";
import type {
  BinaDetay,
  BinaKoleksiyonu,
  BinaOzelligi,
  HesapSonucu,
  Kayit,
  KayitIstegi,
  OsbOzeti,
  SohbetIstegi,
  SohbetYaniti,
  TopluHesapYaniti,
  Tuketim,
  Varsayimlar,
} from "@/types/gecici";

/** Tekrarlanabilir sahte rastgele sayı üretici (her açılışta aynı çatılar). */
function tohumluRastgele(tohum: number) {
  let s = tohum >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ORTA_ENLEM = (K.guney + K.kuzey) / 2;
const M_ENLEM = 1 / 111_320;
const M_BOYLAM = 1 / (111_320 * Math.cos((ORTA_ENLEM * Math.PI) / 180));

/** Sahte OSB sınırı (kutunun içinde düzensiz bir çokgen), [lon, lat]. */
export const SAHTE_OSB_SINIRI: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: "Feature",
  properties: { ad: "Manisa OSB (sahte sınır)" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [27.299, 38.612],
        [27.33, 38.6095],
        [27.372, 38.613],
        [27.3735, 38.627],
        [27.36, 38.634],
        [27.318, 38.6345],
        [27.2975, 38.626],
        [27.299, 38.612],
      ],
    ],
  },
};

function binaUret(adet: number): BinaKoleksiyonu {
  const r = tohumluRastgele(31);
  const features: BinaOzelligi[] = [];
  for (let i = 1; i <= adet; i++) {
    const lon = 27.304 + r() * (27.367 - 27.304);
    const lat = 38.6145 + r() * (38.631 - 38.6145);
    // Alan dağılımı: çoğu 1.000-15.000 m², birkaçı çok büyük.
    const alanM2 = Math.round(1000 + Math.pow(r(), 2.4) * 60_000);
    const oran = 0.5 + r() * 1.5; // en / boy
    const genislik = Math.sqrt(alanM2 * oran);
    const yukseklik = alanM2 / genislik;
    const aci = (r() - 0.5) * 0.6; // radyan
    const koseler = [
      [-genislik / 2, -yukseklik / 2],
      [genislik / 2, -yukseklik / 2],
      [genislik / 2, yukseklik / 2],
      [-genislik / 2, yukseklik / 2],
    ].map(([x, y]) => {
      const dx = x * Math.cos(aci) - y * Math.sin(aci);
      const dy = x * Math.sin(aci) + y * Math.cos(aci);
      return [lon + dx * M_BOYLAM, lat + dy * M_ENLEM];
    });
    koseler.push(koseler[0]);
    features.push({
      type: "Feature",
      id: i,
      geometry: { type: "Polygon", coordinates: [koseler] },
      properties: {
        id: i,
        ad: r() > 0.35 ? `Sahte Fabrika ${i}` : "",
        alan_m2: alanM2,
        merkez: [lon, lat],
      },
    });
  }
  return { type: "FeatureCollection", features };
}

export const SAHTE_BINALAR: BinaKoleksiyonu = binaUret(80);

/** Konuma göre 1.288-1.341 kWh/kWp arası (PROJE.md Bölüm 16 aralığı). */
function sahteVerim(id: number): number {
  return 1288 + ((id * 37) % 54);
}

function birimMaliyet(kwp: number): number {
  if (kwp <= 250) return 31_500;
  if (kwp <= 1000) return 25_650;
  return 21_200;
}

function sahteBinaHesabi(id: number, alanM2: number, v: Varsayimlar, tuketim: Tuketim | null = null): HesapSonucu {
  const verim = sahteVerim(id);
  let kwp = (alanM2 * v.kullanilabilir_oran) / v.m2_kwp;
  if (tuketim && tuketim.yillik_kwh > 0) kwp = Math.min(kwp, tuketim.yillik_kwh / verim);
  const uretimKwh = kwp * verim;
  const tasarruf =
    uretimKwh * (v.oz_tuketim_orani * v.tarife_tl_kwh + (1 - v.oz_tuketim_orani) * v.fazla_fiyat_tl_kwh);
  const yatirim = kwp * birimMaliyet(kwp) * v.maliyet_carpani;
  return {
    bina_id: id,
    kwp,
    uretim_mwh: uretimKwh / 1000,
    tasarruf_tl: tasarruf,
    yatirim_tl: yatirim,
    geri_odeme_yil: yatirim / tasarruf,
    co2_ton: (uretimKwh / 1000) * v.emisyon_faktoru,
  };
}

export function sahteTopluHesap(v: Varsayimlar): TopluHesapYaniti {
  const sonuclar = SAHTE_BINALAR.features.map((f) => sahteBinaHesabi(f.properties.id, f.properties.alan_m2, v));
  const ozet: OsbOzeti = {
    bina_sayisi: sonuclar.length,
    toplam_mwp: sonuclar.reduce((t, s) => t + s.kwp, 0) / 1000,
    toplam_gwh: sonuclar.reduce((t, s) => t + s.uretim_mwh, 0) / 1000,
    toplam_tasarruf_tl: sonuclar.reduce((t, s) => t + s.tasarruf_tl, 0),
    toplam_yatirim_tl: sonuclar.reduce((t, s) => t + s.yatirim_tl, 0),
    toplam_co2_ton: sonuclar.reduce((t, s) => t + s.co2_ton, 0),
  };
  return { sonuclar, ozet };
}

function sahteBina(id: number) {
  const f = SAHTE_BINALAR.features.find((b) => b.properties.id === id);
  if (!f) throw new Error("Bina bulunamadı");
  return f;
}

export function sahteBinaDetay(id: number): BinaDetay {
  const f = sahteBina(id);
  return {
    ...f.properties,
    verim_kwh_kwp: sahteVerim(id),
    mevcut_ges: id % 13 === 0,
    pvgis_id: "38.62_27.33",
    geometri: f.geometry,
    en_yakin_trafo: { id: 900 + (id % 7), ad: `Sahte TM ${(id % 7) + 1}`, gerilim_kv: 154, mesafe_km: 0.3 + (id % 17) / 10 },
  };
}

export function sahteBinaHesap(id: number, v: Varsayimlar, tuketim: Tuketim | null): HesapSonucu {
  return sahteBinaHesabi(id, sahteBina(id).properties.alan_m2, v, tuketim);
}

/** Asistan taklidi: gerçek asistan Gemini ile araç çağırır; burada aynı biçimde sabit cevap döner. */
export function sahteSohbet(istek: SohbetIstegi, v: Varsayimlar): SohbetYaniti {
  const { sonuclar, ozet } = sahteTopluHesap(v);
  const soru = istek.mesaj.toLocaleLowerCase("tr-TR");
  if (soru.includes("geri ödeme") || soru.includes("geri odeme")) {
    const sinir = Number(soru.match(/(\d+)\s*yıl/)?.[1] ?? 4);
    const adet = sonuclar.filter((s) => s.geri_odeme_yil < sinir).length;
    return {
      cevap: `Geri ödemesi ${sinir} yılın altında ${adet} çatı var (toplam ${ozet.bina_sayisi} çatı içinde). Sayılar hesap motorundan geldi.`,
      araclar: [{ ad: "sirala", girdi: { olcut: "geri_odeme_yil", adet: ozet.bina_sayisi } }],
    };
  }
  const enIyi = [...sonuclar].sort((a, b) => b.tasarruf_tl - a.tasarruf_tl)[0];
  return {
    cevap:
      `OSB'de ${ozet.bina_sayisi} çatı için kurulabilir güç yaklaşık ${ozet.toplam_mwp.toFixed(1)} MWp. ` +
      `En çok kazandıracak çatı #${enIyi.bina_id}: yılda yaklaşık ${(enIyi.tasarruf_tl / 1e6).toFixed(1)} milyon TL tasarruf, ` +
      `${enIyi.geri_odeme_yil.toFixed(1)} yıl geri ödeme.\n\n` +
      "Bu bir ön taramadır. Çatı statiği, mevcut tesisat ve şebeke bağlantısı için yerinde keşif gerekir.",
    araclar: [{ ad: "osb_ozeti" }, { ad: "sirala", girdi: { olcut: "tasarruf_tl", adet: 1 } }],
  };
}

// Kayıtlar taklidi: yalnızca bu sekmede, bellekte durur.
let sahteKayitlar: Kayit[] = [];

export function sahteKayitListesi(): Kayit[] {
  return [...sahteKayitlar].reverse();
}

export function sahteKayitEkle(istek: KayitIstegi): Kayit {
  const kayit: Kayit = {
    ...istek,
    id: `sahte-${Date.now()}`,
    bina_ad: sahteBina(istek.bina_id).properties.ad,
    olusturma: new Date().toISOString(),
  };
  sahteKayitlar.push(kayit);
  return kayit;
}

export function sahteKayitSil(id: string): void {
  sahteKayitlar = sahteKayitlar.filter((k) => k.id !== id);
}

/** Sahte ağ gecikmesi; yükleniyor durumlarını görmek için. */
export function bekle<T>(deger: T, ms = 250): Promise<T> {
  return new Promise((coz) => setTimeout(() => coz(deger), ms));
}
