// SAHTE VERİ: backend uçları hazır olana kadar arayüzü beslemek için (NEXT_PUBLIC_SAHTE_VERI=1).
// Hesap kaba bir taklittir; gerçek rakamları her zaman backend'in hesap motoru üretir.

import { VARSAYILAN_VARSAYIMLAR } from "@/lib/sabitler";
import type {
  BinaDetay,
  BinaKoleksiyonu,
  BinaOzelligi,
  FinansYili,
  HesapSonucu,
  Kayit,
  KayitIstegi,
  Osb,
  OsbOzeti,
  SohbetIstegi,
  SohbetYaniti,
  TopluHesapYaniti,
  TrafoKoleksiyonu,
  Tuketim,
  UyduSonucu,
  Varsayimlar,
  VarsayimlarYaniti,
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

// --- OSB'ler ---

interface SahteOsbTanimi {
  id: string;
  ad: string;
  sinir: [number, number][]; // [lon, lat]
  binaAdedi: number;
  idBaslangic: number;
  tohum: number;
}

const OSB_TANIMLARI: SahteOsbTanimi[] = [
  {
    id: "manisa",
    ad: "Manisa OSB",
    sinir: [
      [27.299, 38.612],
      [27.33, 38.6095],
      [27.372, 38.613],
      [27.3735, 38.627],
      [27.36, 38.634],
      [27.318, 38.6345],
      [27.2975, 38.626],
    ],
    binaAdedi: 80,
    idBaslangic: 1,
    tohum: 31,
  },
  {
    id: "akhisar",
    ad: "Akhisar OSB",
    sinir: [
      [27.79, 38.905],
      [27.815, 38.902],
      [27.822, 38.918],
      [27.8, 38.924],
      [27.786, 38.915],
    ],
    binaAdedi: 30,
    idBaslangic: 1001,
    tohum: 47,
  },
  {
    id: "turgutlu",
    ad: "Turgutlu OSB",
    sinir: [
      [27.668, 38.488],
      [27.697, 38.486],
      [27.703, 38.501],
      [27.685, 38.508],
      [27.664, 38.5],
    ],
    binaAdedi: 40,
    idBaslangic: 2001,
    tohum: 59,
  },
];

function sinirKutusu(nokta: [number, number][]) {
  const lonlar = nokta.map((n) => n[0]);
  const latlar = nokta.map((n) => n[1]);
  return {
    guney: Math.min(...latlar),
    bati: Math.min(...lonlar),
    kuzey: Math.max(...latlar),
    dogu: Math.max(...lonlar),
  };
}

export const SAHTE_OSBLAR: Osb[] = OSB_TANIMLARI.map((t) => {
  const k = sinirKutusu(t.sinir);
  return {
    id: t.id,
    ad: t.ad,
    merkez: { lat: (k.guney + k.kuzey) / 2, lon: (k.bati + k.dogu) / 2 },
    sinir_kutusu: k,
    sinir: t.sinir.map(([lon, lat]) => ({ lon, lat })),
    sinir_geojson: { type: "MultiPolygon", coordinates: [[[...t.sinir, t.sinir[0]]]] },
    bina_sayisi: t.binaAdedi,
  };
});

function osbTanimi(osb: string): SahteOsbTanimi {
  return OSB_TANIMLARI.find((t) => t.id === osb) ?? OSB_TANIMLARI[0];
}

// --- Binalar ---

function binaUret(t: SahteOsbTanimi): BinaKoleksiyonu {
  const r = tohumluRastgele(t.tohum);
  const k = sinirKutusu(t.sinir);
  const ortaEnlem = (k.guney + k.kuzey) / 2;
  const mEnlem = 1 / 111_320;
  const mBoylam = 1 / (111_320 * Math.cos((ortaEnlem * Math.PI) / 180));
  // Sınırın biraz içinde kalsın.
  const payLon = (k.dogu - k.bati) * 0.12;
  const payLat = (k.kuzey - k.guney) * 0.15;
  const features: BinaOzelligi[] = [];
  for (let n = 0; n < t.binaAdedi; n++) {
    const id = t.idBaslangic + n;
    const lon = k.bati + payLon + r() * (k.dogu - k.bati - 2 * payLon);
    const lat = k.guney + payLat + r() * (k.kuzey - k.guney - 2 * payLat);
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
      return [lon + dx * mBoylam, lat + dy * mEnlem];
    });
    koseler.push(koseler[0]);
    const kisaAd = t.ad.replace(" OSB", "");
    features.push({
      type: "Feature",
      id,
      geometry: { type: "Polygon", coordinates: [koseler] },
      properties: {
        id,
        ad: r() > 0.35 ? `Sahte ${kisaAd} Fabrika ${n + 1}` : "",
        alan_m2: alanM2,
        merkez: [lon, lat],
      },
    });
  }
  return { type: "FeatureCollection", features };
}

const BINALAR_OSB: Record<string, BinaKoleksiyonu> = Object.fromEntries(
  OSB_TANIMLARI.map((t) => [t.id, binaUret(t)]),
);

export function sahteBinalar(osb: string): BinaKoleksiyonu {
  return BINALAR_OSB[osbTanimi(osb).id];
}

function sahteBina(id: number) {
  for (const koleksiyon of Object.values(BINALAR_OSB)) {
    const f = koleksiyon.features.find((b) => b.properties.id === id);
    if (f) return f;
  }
  throw new Error("Bina bulunamadı");
}

// --- Varsayımlar ---

const SAHTE_GELISMIS = {
  omur_yil: 25,
  degradasyon: 0.005,
  bakim_orani: 0.01,
  iskonto_orani: 0.08,
  tarife_artisi: 0,
};

/** GET /varsayimlar taklidi: §22'nin yeni varsayımlarıyla birlikte. */
export const SAHTE_VARSAYIMLAR_YANITI: VarsayimlarYaniti = {
  varsayimlar: VARSAYILAN_VARSAYIMLAR,
  kaynaklar: [
    ["omur_yil", "Sistem ömrü", "25 yıl", 25, "yıl", "15-30", 15, 30],
    ["degradasyon", "Yıllık verim kaybı", "%0,5", 0.005, "oran", "%0-1", 0, 0.01],
    ["bakim_orani", "Yıllık bakım", "yatırımın %1'i", 0.01, "oran", "%0-3", 0, 0.03],
    ["iskonto_orani", "İskonto oranı (reel)", "%8", 0.08, "oran", "%0-20", 0, 0.2],
    ["tarife_artisi", "Tarife artışı (reel)", "%0", 0, "oran", "%-2-5", -0.02, 0.05],
  ].map(([anahtar, ad, deger, sayisal, birim, aralik, min, max]) => ({
    anahtar: anahtar as string,
    ad: ad as string,
    deger: deger as string,
    sayisal_deger: sayisal as number,
    birim: birim as string,
    aralik: aralik as string,
    min_deger: min as number,
    max_deger: max as number,
    kaynak: "sahte",
    tarih: "2026",
    aciklama: "",
  })),
};

// --- Hesap ---

/** Konuma göre 1.288-1.341 kWh/kWp arası (PROJE.md Bölüm 16 aralığı). */
function sahteVerim(id: number): number {
  return 1288 + ((id * 37) % 54);
}

function sahteTrafoMesafesi(id: number): number {
  return 0.3 + (id % 17) / 10;
}

function sahteMevcutGes(id: number): boolean {
  return id % 13 === 0;
}

function birimMaliyet(kwp: number): number {
  if (kwp <= 250) return 31_500;
  if (kwp <= 1000) return 25_650;
  return 21_200;
}

function gelismis(v: Varsayimlar) {
  return {
    omur: v.omur_yil ?? SAHTE_GELISMIS.omur_yil,
    deg: v.degradasyon ?? SAHTE_GELISMIS.degradasyon,
    bakim: v.bakim_orani ?? SAHTE_GELISMIS.bakim_orani,
    iskonto: v.iskonto_orani ?? SAHTE_GELISMIS.iskonto_orani,
    artis: v.tarife_artisi ?? SAHTE_GELISMIS.tarife_artisi,
  };
}

function nakitAkisi(uretimMwh: number, tasarruf: number, yatirim: number, v: Varsayimlar): FinansYili[] {
  const g = gelismis(v);
  const yillar: FinansYili[] = [];
  let kumulatif = -yatirim;
  for (let yil = 1; yil <= g.omur; yil++) {
    const kayip = Math.pow(1 - g.deg, yil - 1);
    const uretim = uretimMwh * kayip;
    const yilTasarrufu = tasarruf * kayip * Math.pow(1 + g.artis, yil - 1);
    const bakim = yatirim * g.bakim;
    const net = yilTasarrufu - bakim;
    kumulatif += net;
    yillar.push({ yil, uretim_mwh: uretim, tasarruf_tl: yilTasarrufu, bakim_tl: bakim, net_akis_tl: net, kumulatif_tl: kumulatif });
  }
  return yillar;
}

function nbd(oran: number, yatirim: number, yillar: FinansYili[]): number {
  return yillar.reduce((t, y) => t + y.net_akis_tl / Math.pow(1 + oran, y.yil), -yatirim);
}

/** İç verim oranı: NBD'yi sıfırlayan oran, ikiye bölme yöntemiyle. */
function icVerim(yatirim: number, yillar: FinansYili[]): number | null {
  let alt = -0.99;
  let ust = 1;
  if (nbd(alt, yatirim, yillar) * nbd(ust, yatirim, yillar) > 0) return null;
  for (let i = 0; i < 80; i++) {
    const orta = (alt + ust) / 2;
    if (nbd(alt, yatirim, yillar) * nbd(orta, yatirim, yillar) <= 0) ust = orta;
    else alt = orta;
  }
  return (alt + ust) / 2;
}

const sinirla = (x: number) => Math.min(1, Math.max(0, x));

/** Uygunluk skoru (§22.3 önerilen ağırlıklar). */
function sahteSkor(id: number, kwp: number, geriOdeme: number): number {
  const odeme = sinirla((12 - geriOdeme) / 9) * 40;
  const verim = sinirla((sahteVerim(id) - 1280) / 65) * 20;
  const guc = sinirla(Math.log10(Math.max(kwp, 1)) / Math.log10(5000)) * 20;
  const trafo = sinirla((3 - sahteTrafoMesafesi(id)) / 3) * 10;
  const ges = sahteMevcutGes(id) ? 0 : 10;
  return Math.round(odeme + verim + guc + trafo + ges);
}

function sahteBinaHesabi(id: number, alanM2: number, v: Varsayimlar, tuketim: Tuketim | null = null) {
  const verim = sahteVerim(id);
  let kwp = (alanM2 * v.kullanilabilir_oran) / v.m2_kwp;
  if (tuketim && tuketim.yillik_kwh > 0) kwp = Math.min(kwp, tuketim.yillik_kwh / verim);
  const uretimKwh = kwp * verim;
  const tasarruf =
    uretimKwh * (v.oz_tuketim_orani * v.tarife_tl_kwh + (1 - v.oz_tuketim_orani) * v.fazla_fiyat_tl_kwh);
  const yatirim = kwp * birimMaliyet(kwp) * v.maliyet_carpani;
  const geriOdeme = yatirim / tasarruf;
  const yillar = nakitAkisi(uretimKwh / 1000, tasarruf, yatirim, v);
  const g = gelismis(v);
  const iskontoluUretim = yillar.reduce((t, y) => t + (y.uretim_mwh * 1000) / Math.pow(1 + g.iskonto, y.yil), 0);
  const iskontoluBakim = yillar.reduce((t, y) => t + y.bakim_tl / Math.pow(1 + g.iskonto, y.yil), 0);
  const sonuc: HesapSonucu = {
    bina_id: id,
    kwp,
    uretim_mwh: uretimKwh / 1000,
    tasarruf_tl: tasarruf,
    yatirim_tl: yatirim,
    geri_odeme_yil: geriOdeme,
    co2_ton: (uretimKwh / 1000) * v.emisyon_faktoru,
    nbd_tl: nbd(g.iskonto, yatirim, yillar),
    ic_verim_orani: icVerim(yatirim, yillar) ?? 0,
    net_kazanc_25y_tl: yillar.at(-1)?.kumulatif_tl ?? 0,
    lcoe_tl_kwh: (yatirim + iskontoluBakim) / iskontoluUretim,
    uygunluk_skoru: sahteSkor(id, kwp, geriOdeme),
  };
  return { sonuc, yillar };
}

export function sahteTopluHesap(v: Varsayimlar, osb = "manisa"): TopluHesapYaniti {
  const sonuclar = sahteBinalar(osb).features.map(
    (f) => sahteBinaHesabi(f.properties.id, f.properties.alan_m2, v).sonuc,
  );
  const topla = (alan: (s: HesapSonucu) => number) => sonuclar.reduce((t, s) => t + alan(s), 0);
  const ozet: OsbOzeti = {
    bina_sayisi: sonuclar.length,
    toplam_mwp: topla((s) => s.kwp) / 1000,
    toplam_gwh: topla((s) => s.uretim_mwh) / 1000,
    toplam_tasarruf_tl: topla((s) => s.tasarruf_tl),
    toplam_yatirim_tl: topla((s) => s.yatirim_tl),
    toplam_co2_ton: topla((s) => s.co2_ton),
    toplam_nbd_tl: topla((s) => s.nbd_tl ?? 0),
    ortalama_skor: sonuclar.length ? topla((s) => s.uygunluk_skoru ?? 0) / sonuclar.length : 0,
  };
  return { sonuclar, ozet };
}

export function sahteBinaDetay(id: number): BinaDetay {
  const f = sahteBina(id);
  const trafoNo = id % 7;
  return {
    ...f.properties,
    verim_kwh_kwp: sahteVerim(id),
    mevcut_ges: sahteMevcutGes(id),
    pvgis_id: "38.62_27.33",
    geometri: f.geometry,
    en_yakin_trafo: { id: 900 + trafoNo, ad: `Sahte TM ${trafoNo + 1}`, gerilim_kv: 154, mesafe_km: sahteTrafoMesafesi(id) },
  };
}

export function sahteBinaHesap(id: number, v: Varsayimlar, tuketim: Tuketim | null): HesapSonucu {
  return sahteBinaHesabi(id, sahteBina(id).properties.alan_m2, v, tuketim).sonuc;
}

export function sahteFinans(id: number, v: Varsayimlar, tuketim: Tuketim | null): FinansYili[] {
  return sahteBinaHesabi(id, sahteBina(id).properties.alan_m2, v, tuketim).yillar;
}

// --- Asistan ---

/** Asistan taklidi: gerçek asistan Gemini ile araç çağırır; burada aynı biçimde sabit cevap döner. */
export function sahteSohbet(istek: SohbetIstegi, v: Varsayimlar): SohbetYaniti {
  const { sonuclar, ozet } = sahteTopluHesap(v);
  const soru = (istek.mesajlar.at(-1)?.metin ?? "").toLocaleLowerCase("tr-TR");
  if (soru.includes("geri ödeme") || soru.includes("geri odeme")) {
    const sinir = Number(soru.match(/(\d+)\s*yıl/)?.[1] ?? 4);
    const adet = sonuclar.filter((s) => s.geri_odeme_yil < sinir).length;
    return {
      cevap: `Geri ödemesi ${sinir} yılın altında ${adet} çatı var (toplam ${ozet.bina_sayisi} çatı içinde). Sayılar hesap motorundan geldi.`,
      araclar: [{ ad: "sirala", girdi: { olcut: "geri_odeme_yil", adet: ozet.bina_sayisi } }],
      model: "sahte",
    };
  }
  const enIyi = [...sonuclar].sort((a, b) => b.tasarruf_tl - a.tasarruf_tl)[0];
  return {
    cevap:
      `OSB'de ${ozet.bina_sayisi} çatı için kurulabilir güç yaklaşık ${ozet.toplam_mwp.toFixed(1)} MWp. ` +
      `En çok kazandıracak çatı #${enIyi.bina_id}: yılda yaklaşık ${(enIyi.tasarruf_tl / 1e6).toFixed(1)} milyon TL tasarruf, ` +
      `${enIyi.geri_odeme_yil.toFixed(1)} yıl geri ödeme.\n\n` +
      "Bu bir ön taramadır. Çatı statiği, mevcut tesisat ve şebeke bağlantısı için yerinde keşif gerekir.",
    araclar: [{ ad: "osb_ozeti", girdi: {} }, { ad: "sirala", girdi: { olcut: "tasarruf_tl", adet: 1 } }],
    model: "sahte",
  };
}

// --- Trafolar ---

export function sahteTrafolar(osb = "manisa"): TrafoKoleksiyonu {
  const t = osbTanimi(osb);
  const k = sinirKutusu(t.sinir);
  const r = tohumluRastgele(t.tohum + 7);
  return {
    type: "FeatureCollection",
    features: Array.from({ length: 6 }, (_, i) => {
      const lon = k.bati + r() * (k.dogu - k.bati);
      const lat = k.guney + r() * (k.kuzey - k.guney);
      const id = t.idBaslangic + 900 + i;
      return {
        type: "Feature" as const,
        id,
        geometry: { type: "Point" as const, coordinates: [lon, lat] as [number, number] },
        properties: {
          id,
          ad: `Sahte TM ${i + 1}`,
          isletmeci: "TEİAŞ",
          gerilim_kv: i % 3 === 0 ? 380 : 154,
          kalan_kapasite_mw: i % 3 === 0 ? 12 + i : null,
          kaynak: "sahte",
        },
      };
    }),
  };
}

// --- Uydu ---

/** Uydu kontrolü taklidi: gerçekte Gemini çatının uydu görüntüsüne bakar. */
export function sahteUydu(id: number): UyduSonucu {
  const panel = id % 13 === 0 ? "var" : id % 5 === 0 ? "belirsiz" : "yok";
  return {
    bina_id: id,
    panel,
    kaplama_orani: panel === "var" ? 0.35 : 0,
    guven: panel === "belirsiz" ? 0.45 : 0.85,
    aciklama:
      panel === "var"
        ? "Çatının güney yarısında düzenli dizilmiş koyu mavi paneller görünüyor."
        : panel === "yok"
          ? "Çatı yüzeyi düz ve açık renkli; panel görünmüyor."
          : "Görüntü çözünürlüğü düşük, gölge nedeniyle kesin değil.",
    model: "sahte",
    onbellekten: false,
  };
}

// --- Kayıtlar: yalnızca bu sekmede, bellekte durur ---

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
