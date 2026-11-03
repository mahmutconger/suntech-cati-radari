import Link from "next/link";
import type { components } from "@/types/api";

export type VarsayimKaynagi = components["schemas"]["VarsayimKaynagiDto"];

const KAYNAKLAR: VarsayimKaynagi[] = [
  {
    anahtar: "verim_kwh_kwp",
    ad: "Yıllık özgül üretim",
    deger: "1.288-1.341 kWh/kWp, konuma göre",
    sayisal_deger: 1340,
    birim: "kWh/kWp",
    aralik: "sabit",
    min_deger: 1288,
    max_deger: 1341,
    kaynak: "PVGIS v5.3, SARAH3, yatay panel, %14 kayıp, arazi ufku dahil",
    tarih: "1 Kasım 2026 sorgusu",
    aciklama: "Her bina kendine en yakın PVGIS ızgara noktasının değerini alır.",
  },
  {
    anahtar: "panel_yerlesimi",
    ad: "Panel yerleşimi",
    deger: "Çatıya paralel, yatay kabul",
    sayisal_deger: 0,
    birim: "derece",
    aralik: "sabit",
    min_deger: null,
    max_deger: null,
    kaynak:
      "PVGIS: yatay 1.340; 10° güney 1.435; 10° doğu 1.328; 10° batı 1.324; 10° kuzey 1.210 kWh/kWp",
    tarih: "1 Kasım 2026",
    aciklama: "Çatı eğim yönü bilinmediğinden tarafsız yatay kabul yapılmıştır.",
  },
  {
    anahtar: "kullanilabilir_oran",
    ad: "Kullanılabilir çatı oranı",
    deger: "%45",
    sayisal_deger: 0.45,
    birim: "oran",
    aralik: "%30-70",
    min_deger: 0.3,
    max_deger: 0.7,
    kaynak:
      "105 ticari binada ortalama 0,49 (KFUPM, Renewable Energy); sanayi için biraz düşük tutuldu",
    tarih: "2022",
    aciklama:
      "Işıklık, havalandırma, bakım yürüyüş yolları ve kenar boşlukları düşüldükten sonra kalan net alan oranı.",
  },
  {
    anahtar: "m2_kwp",
    ad: "Panel yoğunluğu",
    deger: "6,5 m²/kWp",
    sayisal_deger: 6.5,
    birim: "m²/kWp",
    aralik: "5-10",
    min_deger: 5,
    max_deger: 10,
    kaynak: "Aralıklar dahil 1 kWp için 6-7 m²; 580 Wp modül 2,58 m²",
    tarih: "2026",
    aciklama: "1 kWp kurulu güç için gereken kullanılabilir çatı alanı.",
  },
  {
    anahtar: "tarife_tl_kwh",
    ad: "Sanayi elektrik tarifesi",
    deger: "4,81 TL/kWh, vergisiz",
    sayisal_deger: 4.81,
    birim: "TL/kWh",
    aralik: "3-7 TL",
    min_deger: 3,
    max_deger: 7,
    kaynak: "EPDK, sanayi tek zamanlı: aktif enerji 2,99 + dağıtım 1,83",
    tarih: "4 Nisan 2026",
    aciklama:
      "Öz tüketimde şebekeden çekilmeyen her kWh için sağlanan birim tasarruf.",
  },
  {
    anahtar: "fazla_fiyat_tl_kwh",
    ad: "Fazla enerji fiyatı",
    deger: "2,99 TL/kWh",
    sayisal_deger: 2.99,
    birim: "TL/kWh",
    aralik: "1,5-3 TL",
    min_deger: 1.5,
    max_deger: 3,
    kaynak:
      "Lisanssız Üretim Yönetmeliği değişikliği, Resmî Gazete 33212: saatlik mahsuplaşma, ihtiyaç fazlası 10 yıl alınır, üretim bağlı tüketimin iki katını geçemez",
    tarih: "2 Nisan 2026",
    aciklama:
      "Saatlik tüketimi aşan ve şebekeye verilen ihtiyaç fazlası enerjinin alım bedeli.",
  },
  {
    anahtar: "oz_tuketim_orani",
    ad: "Öz tüketim oranı",
    deger: "%80 (saatlik simülasyonla hesaplanır)",
    sayisal_deger: 0.8,
    birim: "oran",
    aralik: "%50-100",
    min_deger: 0.5,
    max_deger: 1.0,
    kaynak:
      "Varsayım: gündüz çalışan fabrika; saatlik simülasyonda vardiya profiline göre doğrudan hesaplanır",
    tarih: "2026",
    aciklama: "Üretilen elektriğin tesis içinde anında tüketilen oranı.",
  },
  {
    anahtar: "kurulum_maliyeti",
    ad: "Kurulum maliyeti, KDV hariç",
    deger: "≤250 kWp 31.500; 250-1.000 kWp 25.650; ≥1.000 kWp 21.200 TL/kWp",
    sayisal_deger: 21200,
    birim: "TL/kWp",
    aralik: "±%30 (maliyet çarpanı 0,7-1,3)",
    min_deger: 0.7,
    max_deger: 1.3,
    kaynak:
      "Azimut Solar fiyat listesi (100 kW 3.150.000 TL, 500 kW 12.825.000 TL); MY Enerjisolar, ticari/sanayi çatı 400-450 $/kWp",
    tarih: "Nisan-Ağustos 2026",
    aciklama: "Anahtar teslim (EPC) kademeli birim kurulum maliyeti.",
  },
  {
    anahtar: "doviz_kuru",
    ad: "Döviz kuru",
    deger: "49,86 TL/$",
    sayisal_deger: 49.86,
    birim: "TL/USD",
    aralik: "sabit",
    min_deger: null,
    max_deger: null,
    kaynak: "TCMB döviz satış, bülten 2026/204",
    tarih: "30 Ekim 2026",
    aciklama: "Dolar bazlı EPC ve ekipman fiyatlarının TL karşılığı için referans kur.",
  },
  {
    anahtar: "emisyon_faktoru",
    ad: "Şebeke emisyon faktörü",
    deger: "0,6242 tCO₂/MWh",
    sayisal_deger: 0.6242,
    birim: "tCO₂/MWh",
    aralik: "0,36-0,71",
    min_deger: 0.36,
    max_deger: 0.71,
    kaynak:
      "ETKB, 2023 Türkiye Ulusal Elektrik Şebekesi Emisyon Faktörü Bilgi Formu, güneş ve rüzgâr için birleşik marj",
    tarih: "2023 verisi, 31 Aralık 2025'te duyuruldu",
    aciklama: "1 MWh güneş enerjisi üretimiyle önlenen sera gazı emisyonu.",
  },
  {
    anahtar: "omur_yil",
    ad: "Ekonomik ömür",
    deger: "25 yıl",
    sayisal_deger: 25,
    birim: "yıl",
    aralik: "15-30 yıl",
    min_deger: 15,
    max_deger: 30,
    kaynak:
      "IEC 61215 / Tier-1 fotovoltaik modül doğrusal performans garantisi standardı",
    tarih: "2026",
    aciklama:
      "NBD, İVO, LCOE ve 25 yıllık nakit akışı analizinde kullanılan sistem ömrü.",
  },
  {
    anahtar: "degradasyon",
    ad: "Yıllık panel yaşlanması (degradasyon)",
    deger: "%0,5 / yıl",
    sayisal_deger: 0.005,
    birim: "oran/yıl",
    aralik: "%0,2-1,0",
    min_deger: 0.002,
    max_deger: 0.01,
    kaynak:
      "NREL Photovoltaic Degradation Rates incelemesi ve mono-PERC/TOPCon modül katalogları",
    tarih: "2026",
    aciklama: "Modül üretiminin her yıl bir önceki yıla göre azalma oranı.",
  },
  {
    anahtar: "bakim_orani",
    ad: "Yıllık işletme ve bakım (O&M) gideri",
    deger: "Yatırımın %1,0'i / yıl",
    sayisal_deger: 0.01,
    birim: "oran/yıl",
    aralik: "%0,5-2,5",
    min_deger: 0.005,
    max_deger: 0.025,
    kaynak:
      "IRENA Renewable Power Generation Costs & Türkiye sanayi çatı GES temizlik/izleme/sigorta ortalaması",
    tarih: "2025-2026",
    aciklama:
      "Temizlik, inverter kontrolü, izleme ve sigorta için yıllık sabit gider oranı.",
  },
  {
    anahtar: "iskonto_orani",
    ad: "Reel iskonto oranı",
    deger: "%8,0 (reel)",
    sayisal_deger: 0.08,
    birim: "oran",
    aralik: "%4-15",
    min_deger: 0.04,
    max_deger: 0.15,
    kaynak:
      "SHURA / Dünya Bankası Türkiye dağıtık güneş enerjisi reel sermaye maliyeti (WACC) referansı",
    tarih: "2025-2026",
    aciklama:
      "Sabit fiyatlarla (enflasyondan arındırılmış) NBD ve LCOE hesabında kullanılan reel iskonto oranı.",
  },
  {
    anahtar: "tarife_artisi",
    ad: "Reel elektrik tarifesi artışı",
    deger: "%0,0 (reel sabit)",
    sayisal_deger: 0.0,
    birim: "oran/yıl",
    aralik: "-%2 ile +%5",
    min_deger: -0.02,
    max_deger: 0.05,
    kaynak:
      "Muhafazakâr baz senaryo: elektrik fiyatının genel enflasyonla paralel hareket ettiği kabulü",
    tarih: "2026",
    aciklama: "Enflasyon üzerindeki yıllık reel elektrik tarifesi değişim oranı.",
  },
  {
    anahtar: "statik_ek_yuk",
    ad: "Statik ek yük",
    deger: "yaklaşık 12-15 kg/m²",
    sayisal_deger: 13.5,
    birim: "kg/m²",
    aralik: "12-15",
    min_deger: 12,
    max_deger: 15,
    kaynak:
      "Tipik modül ve alüminyum ray ağırlığı; kesin değer statik raporla belirlenir",
    tarih: "2026",
    aciklama: "Panel ve konstrüksiyonun çatıya getirdiği yayılı yük.",
  },
  {
    anahtar: "bina_secimi",
    ad: "Bina seçimi",
    deger: "OSB sınırı içinde, taban alanı ≥1.000 m²",
    sayisal_deger: 1000,
    birim: "m²",
    aralik: "sabit",
    min_deger: 1000,
    max_deger: null,
    kaynak: "OpenStreetMap, sınır way 808798100 ve Manisa ilindeki diğer OSB sınırları",
    tarih: "1-3 Kasım 2026",
    aciklama: "OSB sınırları içindeki ≥1.000 m² sanayi çatıları.",
  },
  {
    anahtar: "geri_odeme",
    ad: "Geri ödeme",
    deger: "basit: yatırım ÷ ilk yıl tasarrufu",
    sayisal_deger: null,
    birim: "yıl",
    aralik: "-",
    min_deger: null,
    max_deger: null,
    kaynak:
      "İlk tarama için basit geri ödeme; 25 yıllık analizde ayrıca NBD, İVO ve LCOE hesaplanır",
    tarih: "2026",
    aciklama: "İlk tarama ve sıralama amaçlı basit geri ödeme süresi.",
  },
];

const ORNEK_CATILAR = [
  {
    sistem: "100 kWp",
    uretim: "134 MWh/yıl",
    tasarruf: "0,60 M TL/yıl",
    yatirim: "3,15 M TL",
    geriOdeme: "5,3 yıl",
    co2: "84 t/yıl",
  },
  {
    sistem: "500 kWp",
    uretim: "670 MWh/yıl",
    tasarruf: "2,98 M TL/yıl",
    yatirim: "12,8 M TL",
    geriOdeme: "4,3 yıl",
    co2: "418 t/yıl",
  },
  {
    sistem: "1.000 kWp",
    uretim: "1.340 MWh/yıl",
    tasarruf: "5,96 M TL/yıl",
    yatirim: "21,2 M TL",
    geriOdeme: "3,6 yıl",
    co2: "836 t/yıl",
  },
  {
    sistem: "10.000 m² çatı (692 kWp)",
    uretim: "928 MWh/yıl",
    tasarruf: "4,12 M TL/yıl",
    yatirim: "17,8 M TL",
    geriOdeme: "4,3 yıl",
    co2: "579 t/yıl",
  },
];

export function VarsayimlarIcerigi() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:underline"
        >
          ← Haritaya ve analize dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          Varsayımlar, Hesap Yöntemi ve Kaynaklar
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Çatı Radarı’ndaki bütün rakamlar deterministik hesap motorundan üretilir.
          Aşağıdaki tüm varsayımlar ilk kaba tarama ve 25 yıllık finansal analiz
          içindir; ana ekrandaki kaydırıcılarla değiştirilebilir.
        </p>
      </header>

      {/* Varsayımlar ve Kaynaklar Tablosu */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-slate-100">
            1. Varsayılan Değerler ve Resmî Kaynaklar
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Varsayım</th>
                <th className="px-4 py-3">Varsayılan Değer</th>
                <th className="px-4 py-3">Kaydırıcı Aralığı</th>
                <th className="px-4 py-3">Kaynak ve Açıklama</th>
                <th className="px-4 py-3">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {KAYNAKLAR.map((k) => (
                <tr key={k.anahtar} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-slate-100">{k.ad}</td>
                  <td className="px-4 py-3 font-semibold text-amber-300">{k.deger}</td>
                  <td className="px-4 py-3 text-slate-400">{k.aralik}</td>
                  <td className="px-4 py-3 leading-relaxed">
                    <p className="text-slate-200">{k.kaynak}</p>
                    {k.aciklama && (
                      <p className="mt-0.5 text-[11px] text-slate-400">{k.aciklama}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                    {k.tarih}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deterministik Formüller */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-100">
            2. Yıllık Hesap, 25Y Finans ve Skor Formülleri
          </h2>
          <pre className="overflow-x-auto rounded-xl bg-slate-900/90 p-3.5 text-xs leading-relaxed text-amber-200">
{`kwp       = alan_m2 × kullanilabilir_oran ÷ m2_kwp
uretim_1  = kwp × verim                                     [kWh/yıl]
tasarruf_1= uretim_1 × (oz × tarife + (1 − oz) × fazla)     [TL/yıl]
yatirim   = kwp × birim_maliyet(kwp) × maliyet_carpani      [TL]
geri_od   = yatirim ÷ tasarruf_1                            [yıl]

# 25 Yıllık Finans (t = 1..25)
uretim_t  = uretim_1 × (1 − degradasyon)^(t−1)
net_akis_t= tasarruf_1 × (1−d)^(t−1) × (1+g)^(t−1) − yatirim×bakim
NBD       = −yatirim + Σ [ net_akis_t ÷ (1 + iskonto)^t ]
İVO (IRR) = NBD(r) = 0 kökünü veren r (ikiye bölme yöntemi)
LCOE      = [yatirim + Σ bakim_t/(1+r)^t] ÷ [Σ uretim_t/(1+r)^t]

# Uygunluk Skoru (0–100)
skor      = %40 geri_ödeme + %20 verim + %20 kWp
            + %10 trafo_mesafesi + %10 mevcut_GES_yok`}
          </pre>
          <p className="text-xs leading-relaxed text-slate-400">
            1 Mayıs 2026’dan itibaren sanayi tesislerinde elektrik mahsuplaşması saatlik
            yapılmaktadır (Resmî Gazete, 2 Nisan 2026, sayı 33212). Trafo mesafesi verisi
            olmayan binalarda o bileşen nötr (5/10 puan) kabul edilir.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-100">
            3. Referans Kontrol Tablosu (1.340 kWh/kWp, %80 Öz Tüketim)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 text-[11px] text-slate-400">
                <tr>
                  <th className="py-2 pr-2">Sistem</th>
                  <th className="py-2 px-2">Üretim</th>
                  <th className="py-2 px-2">Tasarruf</th>
                  <th className="py-2 px-2">Yatırım</th>
                  <th className="py-2 px-2">Geri Ödeme</th>
                  <th className="py-2 pl-2">CO₂</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ORNEK_CATILAR.map((o) => (
                  <tr key={o.sistem}>
                    <td className="py-2 pr-2 font-medium text-slate-100">{o.sistem}</td>
                    <td className="py-2 px-2">{o.uretim}</td>
                    <td className="py-2 px-2 text-amber-300">{o.tasarruf}</td>
                    <td className="py-2 px-2">{o.yatirim}</td>
                    <td className="py-2 px-2 font-semibold text-emerald-300">{o.geriOdeme}</td>
                    <td className="py-2 pl-2">{o.co2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            * Bu bir ön taramadır. Çatı statiği (12–15 kg/m² yayılı ek yük), mevcut
            elektrik tesisatı ve trafo bağlantı kapasitesi için yerinde mühendislik keşfi
            yapılmalıdır.
          </p>
        </div>
      </section>
    </div>
  );
}
