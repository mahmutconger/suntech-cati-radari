// SAHTE VERİ: backend /binalar ve /hesap/toplu hazır olana kadar arayüzü beslemek için.
// Hesap kaba bir taklittir; gerçek rakamları her zaman backend'in hesap motoru üretir.

import { OSB_SINIR_KUTUSU as K } from "@/lib/sabitler";
import type {
  BinaKoleksiyonu,
  BinaOzelligi,
  HesapSonucu,
  OsbOzeti,
  TopluHesapYaniti,
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
        ad: r() > 0.35 ? `Sahte Fabrika ${i}` : null,
        alan_m2: alanM2,
        merkez: [lon, lat],
      },
    });
  }
  return { type: "FeatureCollection", features };
}

export const SAHTE_BINALAR: BinaKoleksiyonu = binaUret(80);

const SAHTE_VERIM_KWH_KWP = 1340;

function birimMaliyet(kwp: number): number {
  if (kwp <= 250) return 31_500;
  if (kwp <= 1000) return 25_650;
  return 21_200;
}

function sahteBinaHesabi(id: number, alanM2: number, v: Varsayimlar): HesapSonucu {
  const kwp = (alanM2 * v.kullanilabilir_oran) / v.m2_kwp;
  const uretimKwh = kwp * SAHTE_VERIM_KWH_KWP;
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

/** Sahte ağ gecikmesi; yükleniyor durumlarını görmek için. */
export function bekle<T>(deger: T, ms = 250): Promise<T> {
  return new Promise((coz) => setTimeout(() => coz(deger), ms));
}
