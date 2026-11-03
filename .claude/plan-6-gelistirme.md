# Plan: 6 geliştirme (3 Kasım 2026 gece)

Nazım onaylayınca sırayla uygulanır. Kod yazmadan önce adımdaki dosyayı oku; Mahmut değiştirmiş olabilir.

## Kurallar

- Commit, push, PR, merge ve deploy Nazım'da. Ben komutları tam olarak veririm.
- `nazim` dalı. Tek PR.
- Nazım'ın 8000'deki uvicorn'una dokunma. Test: `backend-test` (8001) ve `frontend-test` (3001), `.claude/launch.json`'da hazır. İşin sonunda ikisini de kapat.
- Yeni paket yok. `package.json` ve lock dosyasına dokunma.
- Gemini'ye yalnızca adım 8'de birkaç istek. Birim testleri `uret`i taklit eder, kota harcamaz.
- Mahmut'un dosyalarında küçük parçalar değiştir. Yeni kodu yeni dosyaya koy.

## Adım 0: Hazırlık

```bash
git fetch origin
git merge --ff-only origin/main
git log --oneline origin/main..origin/mahmut
git diff --stat origin/main...origin/mahmut
```

Mahmut pushladıysa aşağıdaki dosyalarda neyi değiştirdiğine bak. Uygulama bitince de aynı kontrolü yap.

PR #32 (Mahmut, tanıtım ekranı) main'de ve `gsap` paketini ekledi. Plandaki dosyalara dokunmadı. Eşitledikten sonra `frontend/` içinde `npm ci --fetch-retries=5` çalıştır, yoksa yerelde derleme paket bulamaz.

## Adım 1: Yanıt şemaları ve `trafo_mesafe_km`

**Yeni dosya `backend/app/schemas/bina.py`:**

```python
"""/binalar, /osblar ve /trafo-merkezleri yanıt şemaları; frontend tipleri bunlardan üretilir (npm run tipler)."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class Cokgen(BaseModel):
    type: Literal["Polygon"]
    coordinates: list[list[list[float]]]


class CokluCokgen(BaseModel):
    type: Literal["MultiPolygon"]
    coordinates: list[list[list[list[float]]]]


class BinaOzet(BaseModel):
    id: int
    ad: str
    alan_m2: float
    merkez: tuple[float, float]  # lon, lat
    osb: str
    trafo_mesafe_km: float | None = None


class YakinBina(BinaOzet):
    mesafe_km: float


class BinaOzelligi(BaseModel):
    type: Literal["Feature"]
    id: int
    geometry: Cokgen
    properties: BinaOzet


class BinaKoleksiyonu(BaseModel):
    type: Literal["FeatureCollection"]
    features: list[BinaOzelligi]


class EnYakinTrafo(BaseModel):
    id: int
    ad: str
    gerilim_kv: float | None
    mesafe_km: float


class BinaDetay(BinaOzet):
    verim_kwh_kwp: float | None
    mevcut_ges: bool
    pvgis_id: str | None
    geometri: Cokgen
    en_yakin_trafo: EnYakinTrafo | None


class TrafoNoktasi(BaseModel):
    type: Literal["Point"]
    coordinates: tuple[float, float]  # lon, lat


class TrafoOzellikleri(BaseModel):
    id: int
    ad: str
    isletmeci: str
    gerilim_kv: float | None
    kalan_kapasite_mw: float | None
    kaynak: str


class TrafoOzelligi(BaseModel):
    type: Literal["Feature"]
    id: int
    geometry: TrafoNoktasi
    properties: TrafoOzellikleri


class TrafoKoleksiyonu(BaseModel):
    type: Literal["FeatureCollection"]
    features: list[TrafoOzelligi]


class Nokta(BaseModel):
    lon: float
    lat: float


class OsbMerkezi(BaseModel):
    lat: float
    lon: float


class SinirKutusu(BaseModel):
    guney: float
    bati: float
    kuzey: float
    dogu: float


class Osb(BaseModel):
    id: str
    ad: str
    merkez: OsbMerkezi
    sinir_kutusu: SinirKutusu
    sinir: list[Nokta]  # en büyük parçanın halkası
    sinir_geojson: CokluCokgen  # bütün parçalar
    bina_sayisi: int
```

**`backend/app/api/v1/binalar.py`:** şunları `response_model` olarak ekle, başka değişiklik yok:

| Uç | response_model |
|---|---|
| `GET /osblar` | `list[Osb]` |
| `GET /binalar` | `BinaKoleksiyonu` |
| `GET /binalar/ara` | `list[BinaOzet]` |
| `GET /binalar/yakin` | `list[YakinBina]` |
| `GET /binalar/{bina_id}` | `BinaDetay` |
| `GET /trafo-merkezleri` | `TrafoKoleksiyonu` |

**`backend/app/application/bina.py`:**
- `ozet()` sözlüğüne ekle: `"trafo_mesafe_km": b.get("trafo_mesafe_km"),`
- `detay()` içindeki ayrı `"trafo_mesafe_km"` satırını sil, artık `ozet`ten geliyor.

**Yeni test `backend/tests/test_binalar_api.py`:** `depo._onbellek`'i `monkeypatch.setattr` ile sahte `binalar`, `trafo_merkezleri`, `osblar` kayıtlarına çevir, ağa çıkma. `TestClient(app)` `with` olmadan (lifespan çalışmasın). Kontrol et: `/api/v1/osblar` 200, `sinir` liste, `sinir_geojson.type == "MultiPolygon"`; `/binalar?osb=a` yalnız o OSB ve `trafo_mesafe_km` dolu; `/binalar/{id}` 200, olmayan id 404; bilinmeyen OSB 404; `/trafo-merkezleri` `osblar` listesine göre süzülüyor; `id` alanı int.

**Canlı veriyle kontrol (salt okunur):** `TestClient` ile üç OSB'nin `/binalar`, `/trafo-merkezleri` ve bir `/binalar/{id}` çağrısı 200 dönmeli. Şema ile gerçek Firestore verisi uyuşmazsa yanıt 500 olur; deploy'dan önce burada yakala. Süreyi öncekiyle karşılaştır, `/binalar` belirgin yavaşlamamalı.

## Adım 2: Asistan cevap önbelleği

**`backend/app/application/sohbet.py`:**

```python
import json  # dosyanın üstüne

AZAMI_ONBELLEK = 256
# Aynı konuşma + çatı + OSB + varsayımlar aynı cevabı verir (hesap motoru deterministik); kota harcanmasın.
# ponytail: süreç içi, deploy'da sıfırlanır, dolunca hepsi silinir; birden çok instance olursa Firestore'a taşı
_cevaplar: dict[str, dict] = {}


def cevaplari_unut() -> None:
    _cevaplar.clear()
```

`cevapla()` içinde:
- `varsayimlar or VarsayimlarDto()` değerini `v` değişkenine al, `_araclar(v, acik_osb)`.
- `if GEMINI_SAHTE: ...` satırından hemen sonra:
  ```python
  anahtar = json.dumps([mesajlar, bina_id, acik_osb, v.model_dump()], ensure_ascii=False, sort_keys=True)
  if (kayit := _cevaplar.get(anahtar)) is not None:
      return kayit
  ```
- Döngüdeki son cevap:
  ```python
  if not cagrilar:
      metin = "".join(p.text or "" for p in (yanit.candidates[0].content.parts or []) if not p.thought).strip()
      if not metin:
          return {"cevap": "Bu soruya cevap üretemedim, farklı sorar mısınız?", "araclar": kullanilan, "model": model}
      sonuc = {"cevap": metin, "araclar": kullanilan, "model": model}
      if len(_cevaplar) >= AZAMI_ONBELLEK:
          _cevaplar.clear()
      _cevaplar[anahtar] = sonuc
      return sonuc
  ```
- Boş cevap, "çok fazla adım" ve `GeminiHatasi` önbelleğe girmez.

**`backend/app/application/uydu.py`:** `_mevcut_ges_isaretle()` sonuna `cevaplari_unut()` ekle (`from app.application.sohbet import cevaplari_unut`). Skor değişince eski cevaplar kalmasın.

**Yeni test `backend/tests/test_sohbet_onbellek.py`:** `sohbet.GEMINI_SAHTE=False`, `sohbet.uret` sayaçlı sahte, `depo._onbellek` sahte. Her testten önce `cevaplari_unut()`. Sahte yanıt:
`SimpleNamespace(function_calls=None, candidates=[SimpleNamespace(content=SimpleNamespace(parts=[SimpleNamespace(text="cevap", thought=False)]))])`, `uret` bunu `(yanit, "test")` olarak döner.
Kontrol et: aynı çağrı iki kez, `uret` 1 kez; farklı varsayım, farklı OSB ve farklı `bina_id` yeniden çağırır; boş metin önbelleğe girmez; `GeminiHatasi` önbelleğe girmez; `cevaplari_unut` sonrası yeniden çağırır.

## Adım 3: Firma adları

Ölçüm (3 Kasım): 663 çatının 87'sinin adı var. OSM'den yaklaşık 30 çatı daha gelir, toplam yaklaşık 120. "İlk 20" listelerinde adlı çatı 60 üzerinden 7'den 12'ye çıkar. Gelen adlar: Bosch, PepsiCo, HABAŞ, Indesit, Mubea, Maxion, Vestel Güç Elektroniği, Çimbeton, Korel, La Lorraine, Sun Tekstil, SABAF...

**Yeni dosya `backend/scripts/ad_esle.py`:**

```python
"""
OSM'deki işletme adlarını adsız çatılara yazar; veri_yukle binaya yalnızca kendi name etiketini verir.
Önce scripts.veri_yukle aynı --osb ile çalışmış olmalı. veri_yukle yeniden çalışırsa adları sıfırlar, bu betik de yeniden çalıştırılır.
Sonra Cloud Run yeniden başlatılmalı (süreç içi önbellek), en kolayı deploy.
Kullanım (backend/ klasöründe):
    python -m scripts.ad_esle --osb manisa --kuru   # yazmadan listeler
    python -m scripts.ad_esle --osb manisa
Kaynaklar (ad_kaynak alanı):
    osm_nokta: işletme noktası çatının içinde
    osm_yakin: nokta en çok 25 m uzakta ve ona en yakın bina bu çatı
    osm_alan:  çatı, adlı bir sanayi alanının içinde (ör. Bosch yerleşkesi)
"""
from __future__ import annotations

import json
import math
import re
import sys

from shapely.geometry import Point, Polygon
from shapely.ops import transform

from scripts.veri_yukle import HAM_KLASOR, binalari_hazirla, onbellekli, secili_osb, sinir_kutusu, sinir_oku, sinir_sekli

from app.core.firebase import get_firestore_client  # noqa: E402

YAKIN_M = 25
EN_BUYUK_NOKTA_M2 = 3000  # bundan küçük adlı şekil nokta sayılır
EN_BUYUK_ALAN_M2 = 500_000  # bundan büyüğü firma değil, OSB gibi genel alan
GENEL = re.compile(r"organize sanayi|\bosb\b|sanayi sitesi|yönetim binası|yemekhane|kantin|lisesi|okul|cami", re.I)
YORUM = re.compile(r"\s*\d,\d·\d+ yorum$")  # bazı OSM adlarına harita yorumu karışmış


def ad_temizle(ad: str) -> str:
    return YORUM.sub("", ad.strip())


def isletme_mi(t: dict) -> bool:
    return (t.get("man_made") == "works" or t.get("landuse") == "industrial"
            or "office" in t or "industrial" in t or "craft" in t or "building" in t)


def adli_sekiller(veri: dict, cati_kimlikleri: set[int], metre) -> tuple[list, list]:
    noktalar, alanlar = [], []
    for e in veri["elements"]:
        t = e.get("tags", {})
        if e["id"] in cati_kimlikleri or not isletme_mi(t) or GENEL.search(t["name"]):
            continue
        try:
            if e["type"] == "node":
                s = Point(e["lon"], e["lat"])
            elif e["type"] == "way" and len(e.get("geometry", [])) >= 4 and e["geometry"][0] == e["geometry"][-1]:
                s = Polygon([(p["lon"], p["lat"]) for p in e["geometry"]]).buffer(0)
            elif e["type"] == "relation":
                s = sinir_sekli(e)
            else:
                continue
        except Exception:  # bozuk OSM geometrisi: bu adı atla
            continue
        s = transform(metre, s)
        ad = ad_temizle(t["name"])
        if s.geom_type == "Point" or s.area < EN_BUYUK_NOKTA_M2:
            noktalar.append((ad, s.representative_point()))
        elif s.area < EN_BUYUK_ALAN_M2:
            alanlar.append((ad, s))
    return noktalar, alanlar


def esle(catilar: list, kucukler: list, noktalar: list, alanlar: list) -> dict[int, tuple[str, str]]:
    atanan: dict[int, tuple[str, str]] = {}
    en_yakin = lambda p: min(((r.distance(p), b["osm_id"], b["ad"]) for b, r in catilar), key=lambda x: x[0])  # noqa: E731
    for ad, p in noktalar:
        d, i, mevcut = en_yakin(p)
        if not mevcut and d == 0 and i not in atanan:
            atanan[i] = (ad, "osm_nokta")
    for ad, p in noktalar:
        d, i, mevcut = en_yakin(p)
        # Noktaya başka bir küçük bina daha yakınsa işletme o binadadır, komşu büyük çatıya yazılmaz
        if not mevcut and 0 < d <= YAKIN_M and i not in atanan and not any(u.distance(p) < d for u in kucukler):
            atanan[i] = (ad, "osm_yakin")
    for ad, a in sorted(alanlar, key=lambda x: x[1].area):  # küçük (özel) alan önce
        for b, r in catilar:
            if not b["ad"] and b["osm_id"] not in atanan and a.contains(r.representative_point()):
                atanan[b["osm_id"]] = (ad, "osm_alan")
    return atanan


if __name__ == "__main__":
    assert ad_temizle("X Ltd. Şti. 5,0·4 yorum") == "X Ltd. Şti." and GENEL.search("Manisa OSB Yönetim Binası")
    slug, osb = secili_osb()
    sinir = sinir_oku(slug, osb)
    k = sinir_kutusu(sinir)
    ham = json.loads((HAM_KLASOR / f"binalar_{slug}.json").read_text(encoding="utf-8"))
    binalar = binalari_hazirla(slug, sinir, ham)
    pay = 0.002
    sorgu = f'[out:json][timeout:120];nwr["name"]({k["guney"]-pay},{k["bati"]-pay},{k["kuzey"]+pay},{k["dogu"]+pay});out geom;'
    veri = onbellekli(HAM_KLASOR / f"adlar_{slug}.json", sorgu, "--yeniden" in sys.argv)

    lat0 = math.radians((k["guney"] + k["kuzey"]) / 2)
    metre = lambda x, y, z=None: (x * 111320 * math.cos(lat0), y * 110540)  # noqa: E731
    catilar = [(b, transform(metre, Polygon([(p["lon"], p["lat"]) for p in b["geom"]]).buffer(0))) for b in binalar]
    kimlikler = {b["osm_id"] for b in binalar}
    kucukler = [transform(metre, Polygon([(p["lon"], p["lat"]) for p in e["geometry"]]).buffer(0))
                for e in ham["elements"]
                if e["type"] == "way" and "building" in e.get("tags", {}) and e["id"] not in kimlikler
                and len(e.get("geometry", [])) >= 4]
    atanan = esle(catilar, kucukler, *adli_sekiller(veri, kimlikler, metre))
    temizlenen = {b["osm_id"]: ad_temizle(b["ad"]) for b in binalar if b["ad"] and ad_temizle(b["ad"]) != b["ad"]}

    for i, (ad, kaynak) in sorted(atanan.items(), key=lambda x: x[1]):
        print(f"  {i}: {ad} [{kaynak}]")
    print(f"{slug}: {len(atanan)} çatıya ad, {len(temizlenen)} ad temizlendi, toplam adlı {sum(1 for b in binalar if b['ad']) + len(atanan)}/{len(binalar)}")
    if "--kuru" not in sys.argv:
        db = get_firestore_client()
        batch = db.batch()
        for i, (ad, kaynak) in atanan.items():
            batch.update(db.collection("binalar").document(str(i)), {"ad": ad, "ad_kaynak": kaynak})
        for i, ad in temizlenen.items():
            batch.update(db.collection("binalar").document(str(i)), {"ad": ad})
        batch.commit()
        print("yazıldı")
```

Çalıştırma: önce üç OSB için `--kuru`, listeye göz at (firma olmayan ad varsa `GENEL`'e ekle). Sonra üçünü de yaz. Plan onayıyla Firestore'a yazma onaylanmış sayılır. Geri alma: `python -m scripts.veri_yukle --osb <id>` adları OSM'deki hâline döndürür.

Yazdıktan sonra sayıyı Firestore'dan doğrula. Canlıda görünmesi deploy ister.

**Yalnızca Nazım "elle liste" derse (3b):**
- Betik `backend/data/ad_elle.csv` (`osm_id;ad`) dosyasını okur, en yüksek öncelikle yazar, `ad_kaynak: "elle"`.
- `--liste` bayrağı üç OSB'nin ilk 20'sinde hâlâ adsız kalan çatıları `osm_id;ad;harita bağlantısı` olarak basar (ölçümde 39 çatı). Ekipten biri haritaya bakıp doldurur, yaklaşık 20 dakika. Emin olunmayan satır boş bırakılır.

## Adım 4: Frontend tipleri

`backend-test` (8001) açıkken:

```powershell
$env:OPENAPI_URL="http://localhost:8001/openapi.json"; npm run tipler --prefix frontend
```

Çalışma dizini `frontend/` olmalı (betik `src/types/api.ts`'e yazar); `--prefix` çalışmazsa `Set-Location frontend`.

**`frontend/src/types/gecici.ts`:** elle yazılan arayüzleri şemadan al, üst yorumu güncelle:

```ts
export type BinaOzet = Sema["BinaOzet"];
export type EnYakinTrafo = Sema["EnYakinTrafo"];
export type BinaDetay = Sema["BinaDetay"];
export type BinaOzelligi = Sema["BinaOzelligi"];
export type BinaKoleksiyonu = Sema["BinaKoleksiyonu"];
export type TrafoOzellikleri = Sema["TrafoOzellikleri"];
export type TrafoKoleksiyonu = Sema["TrafoKoleksiyonu"];
export type Osb = Sema["Osb"];
```

Kalanlar: `Konum`, `CokgenGeometri` (rapor kullanıyor), `ApiHatasiGovdesi`, `FinansYili`.

**`frontend/src/components/harita/Harita.tsx`:** artık tek biçim var.
- `sinirGeometrisi` fonksiyonunu ve `Osb` tip importunu sil.
- `OsbSiniri`:
  ```tsx
  function OsbSiniri() {
    const osb = useSeciliOsb();
    if (!osb) return null;
    const ozellik: GeoJSON.Feature = { type: "Feature", properties: { ad: osb.ad }, geometry: osb.sinir_geojson };
    return (
      <GeoJSON key={osb.id} data={ozellik} interactive={false} style={{ color: "#e36161", weight: 2.5, dashArray: "6 6", fillOpacity: 0.03 }} />
    );
  }
  ```

Sonra: `node node_modules\typescript\bin\tsc --noEmit` (frontend'de). Hataları düzelt; `mocks/veri.ts`'te `type` değerleri için `as const` gerekebilir.

## Adım 5: Seçili çatı adreste (`?bina=`)

**Yeni dosya `frontend/src/components/harita/BinaAdresi.tsx`:**

```tsx
"use client";

// Seçili çatıyı adreste tutar (/?bina=501234569): bağlantı paylaşılınca aynı çatı, kendi OSB'siyle açılır.
// useSearchParams yerine window: sayfa statik kalsın, Suspense gerekmesin.

import { useEffect, useRef, useState } from "react";
import { useBinaDetay, useOsblar } from "@/hooks/veri";
import { useHaritaDurumu } from "@/store/harita";

function adrestekiBina(): number | null {
  if (typeof window === "undefined") return null;
  const deger = Number(new URLSearchParams(window.location.search).get("bina"));
  return Number.isSafeInteger(deger) && deger > 0 ? deger : null;
}

export function BinaAdresi() {
  const [hedef] = useState(adrestekiBina);
  const uygulandi = useRef(hedef === null);
  const { data: detay, isError } = useBinaDetay(hedef);
  // OSB listesi beklenir: harita önce OSB'ye sığsın, sonra çatıya uçsun.
  const { isFetched: osblarGeldi } = useOsblar();
  const seciliId = useHaritaDurumu((d) => d.seciliBinaId);
  const seciliOsb = useHaritaDurumu((d) => d.seciliOsb);
  const osbSec = useHaritaDurumu((d) => d.osbSec);
  const binaSec = useHaritaDurumu((d) => d.binaSec);

  useEffect(() => {
    if (uygulandi.current || !detay || !osblarGeldi) return;
    uygulandi.current = true;
    if (detay.osb !== seciliOsb) osbSec(detay.osb); // önce OSB: osbSec seçimi sıfırlar
    binaSec(detay.id, true);
  }, [detay, osblarGeldi, seciliOsb, osbSec, binaSec]);

  useEffect(() => {
    if (isError) uygulandi.current = true; // olmayan bina: adres temizlensin
    if (!uygulandi.current) return;
    const adres = new URL(window.location.href);
    if (seciliId === null) adres.searchParams.delete("bina");
    else adres.searchParams.set("bina", String(seciliId));
    if (adres.href !== window.location.href) window.history.replaceState(null, "", `${adres.pathname}${adres.search}`);
  }, [seciliId, isError]);

  return null;
}
```

**`frontend/src/app/page.tsx`:** `<><BinaAdresi /><AnaEkran /></>`. `AnaEkran.tsx`'e dokunma (Mahmut çalışıyor olabilir).

`replaceState` kullanılır, geçmişe kayıt eklemez. Next belgesi: `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`.

Kapsam dışı: seçili OSB adreste tutulmaz, `?bina=` OSB'yi zaten çözüyor. Arama seçili OSB içinde kalır.

## Adım 6: Senaryo paneli

**Yeni dosya `frontend/src/components/panel/SenaryoPaneli.tsx`:**

```tsx
"use client";

// OSB yönetimi için senaryo: en uygun çatılardan başlayarak kurulum yapılırsa OSB toplamı.
// Çatısında zaten GES olan (skor 0) sayılmaz. Veri toplu hesaptan gelir, ek istek gitmez.

import { useMemo, useState } from "react";
import { Deger } from "@/components/ortak/Deger";
import { sayi, tl } from "@/lib/bicim";
import { KART, SECILI_CIP } from "@/lib/stil";
import type { HesapSonucu } from "@/types/gecici";

const SECENEKLER = [
  { oran: 0.25, etiket: "%25" },
  { oran: 0.5, etiket: "%50" },
  { oran: 1, etiket: "Hepsi" },
];

function senaryo(sonuclar: HesapSonucu[], oran: number) {
  const adaylar = sonuclar.filter((s) => s.uygunluk_skoru > 0).sort((a, b) => b.uygunluk_skoru - a.uygunluk_skoru);
  const secilen = adaylar.slice(0, Math.ceil(adaylar.length * oran));
  const topla = (alan: (s: HesapSonucu) => number) => secilen.reduce((toplam, s) => toplam + alan(s), 0);
  return {
    cati: secilen.length,
    mwp: topla((s) => s.kwp) / 1000,
    tasarruf: topla((s) => s.tasarruf_tl),
    co2: topla((s) => s.co2_ton),
    yatirim: topla((s) => s.yatirim_tl),
  };
}

export function SenaryoPaneli({ sonuclar }: { sonuclar: HesapSonucu[] }) {
  const [oran, setOran] = useState(0.25);
  const s = useMemo(() => senaryo(sonuclar, oran), [sonuclar, oran]);
  return (
    <div className={`${KART} space-y-2 p-3`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-murekkep">Çatıların ne kadarı kurarsa?</h3>
        <div className="flex rounded-full bg-murekkep/5 p-0.5 text-[11px]">
          {SECENEKLER.map((x) => (
            <button
              key={x.oran}
              type="button"
              onClick={() => setOran(x.oran)}
              aria-pressed={oran === x.oran}
              className={`rounded-full px-2.5 py-0.5 font-medium ${oran === x.oran ? SECILI_CIP : "text-murekkep/60 hover:bg-murekkep/5"}`}
            >
              {x.etiket}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-murekkep/55">En uygundan başlayarak {sayi(s.cati)} çatı kurarsa</p>
      <div className="grid grid-cols-2 gap-2">
        <Deger etiket="Kurulu güç" deger={`${sayi(s.mwp, 1)} MWp`} vurgu />
        <Deger etiket="Yıllık tasarruf" deger={`${tl(s.tasarruf)}/yıl`} vurgu />
        <Deger etiket="Önlenen CO₂" deger={`${sayi(s.co2)} t/yıl`} />
        <Deger etiket="Yatırım" deger={tl(s.yatirim)} />
      </div>
    </div>
  );
}
```

`Deger` Mahmut'un yeni temasında farklı imzaya geçtiyse güncel halini oku.

**`frontend/src/components/panel/PanelIcerigi.tsx`:** toplam kutucuklarının altına, listenin üstüne tek satır: `<SenaryoPaneli sonuclar={hesap.sonuclar} />`. Yatırım kutusu istenen üç değere ek; karar verici için gerekli, Nazım istemezse çıkar.

## Adım 7: Listeyi indirme (CSV)

**Yeni dosya `frontend/src/lib/csv.ts`:**

```ts
// Türkçe Excel'de doğrudan açılan CSV: ayraç ";", ondalık virgül, başta BOM.

type Hucre = string | number | null | undefined;

function hucre(deger: Hucre): string {
  if (deger === null || deger === undefined) return "";
  if (typeof deger === "number") return String(deger).replace(".", ",");
  // OSM adlarını herkes düzenleyebilir: "=..." Excel'de formül olarak çalışmasın.
  const metin = /^[=+\-@\t\r]/.test(deger) ? `'${deger}` : deger;
  return /[";\r\n]/.test(metin) ? `"${metin.replaceAll('"', '""')}"` : metin;
}

export function csvIndir(dosyaAdi: string, satirlar: Hucre[][]): void {
  const metin = "﻿" + satirlar.map((s) => s.map(hucre).join(";")).join("\r\n");
  const adres = URL.createObjectURL(new Blob([metin], { type: "text/csv;charset=utf-8" }));
  const bag = document.createElement("a");
  bag.href = adres;
  bag.download = dosyaAdi;
  bag.click();
  URL.revokeObjectURL(adres);
}
```

**`frontend/src/components/panel/PanelIcerigi.tsx`:**
- `adlar` haritasını `ozetler`e çevir:
  ```ts
  const ozetler = new Map(binalar.features.map((f) => [f.properties.id, f.properties]));
  ...
  .map((s) => ({ ...s, ad: ozetler.get(s.bina_id)?.ad ?? "", trafoKm: ozetler.get(s.bina_id)?.trafo_mesafe_km ?? null }));
  ```
- Fonksiyon:
  ```ts
  function listeyiIndir() {
    const yuvarla = (x: number, basamak: number) => Math.round(x * 10 ** basamak) / 10 ** basamak;
    csvIndir(`${osb?.id ?? "osb"}-${olcut === "skor" ? "ilk-gidilecek" : "en-cok-kazandiracak"}-20.csv`, [
      ["Sıra", "Çatı", "OSM no", "Uygunluk skoru", "Yıllık tasarruf (TL)", "Geri ödeme (yıl)", "NBD (TL)", "En yakın trafo (km)", "Bağlantı"],
      ...ilk20.map((s, i) => [
        i + 1,
        binaAdi({ id: s.bina_id, ad: s.ad }),
        s.bina_id,
        yuvarla(s.uygunluk_skoru, 1),
        Math.round(s.tasarruf_tl),
        yuvarla(s.geri_odeme_yil, 1),
        Math.round(s.nbd_tl),
        s.trafoKm,
        `${window.location.origin}/?bina=${s.bina_id}`,
      ]),
    ]);
  }
  ```
- Liste başlığına, sıralama düğmelerinin yanına küçük düğme (`Download`, lucide-react): `aria-label="Listeyi indir (CSV)"`, `title` aynı, `h-7 w-7 rounded-full`. Başlığa `min-w-0 flex-1` ver ki düğmeler sağda toplansın.

## Adım 8: Test

Backend: `python -m pytest -q` (backend'de). Frontend: `tsc --noEmit`, sonra `next build` (dev sunucusu kapalıyken).

`backend-test` ve `frontend-test` ile tarayıcıda, masaüstü ve telefon (375 px):

1. `/?bina=501185693`: Muradiye'ye geçer, kart açılır, harita çatıya uçar, "Çatıda GES var".
2. Kartı kapat: adresten `bina` kalkar. Başka çatı seç: adres güncellenir.
3. `/?bina=1` ve `/?bina=abc`: hata yok, adres temizlenir, harita normal.
4. Manisa'da `Bosch` ve `Indesit` ara: bulunuyor.
5. Senaryo: %25, %50, Hepsi değerleri API'den Python'la hesaplanan toplamlarla aynı (skor > 0 olanlar, skora göre sıralı). Varsayım kaydırıcısı değişince güncelleniyor.
6. CSV: gerçek indirme yapma. `javascript_tool` ile `URL.createObjectURL`'i sarıp `HTMLAnchorElement.prototype.click`'i boşalt, düğmeye bas, `Blob.text()` içeriğini oku. BOM, `;`, ondalık virgül, 20 satır + başlık, trafo km dolu.
7. Asistan: aynı örnek soruyu iki kez sor. İkincisi anında gelir, backend logunda ikinci Gemini isteği yok. Toplam birkaç istek.
8. `/kayitlar` girişsiz hâlâ 401; `/qr`, `/varsayimlar` ve rapor sayfası açılıyor.

Sunucuları kapat, görünümü masaüstüne döndür.

## Adım 9: Belge ve teslim

- `PROJE.md`: §22.1'de bina özetine `trafo_mesafe_km`; §22 sonuna kısa "22.6 Sonradan eklenenler"; §7'ye `ad_esle` adımı. §12'deki asistan önbelleği cümlesi artık doğru.
- Hafıza: `proje-durumu.md` güncelle, `bekleyen-gelistirmeler.md`'de biteni işaretle.
- Son mesaj: Nazım için kontrol listesi ve sırayla komutlar:
  1. `git add` dosyaları tek tek (`.claude/` asla), commit, push, PR, merge.
  2. Backend deploy (`backend/` klasöründen): adlar, önbellek ve `trafo_mesafe_km` için şart.
  3. App Hosting main'den kendisi yayınlar. Adres 5-10 dakikada güncellenir.
  4. Mahmut'a: `git pull origin main`, çakışırsa nerede çıkar.
- Deploy sonrası canlıda tekrar kontrol: `/osblar`, `/binalar`, `?bina=` bağlantısı, senaryo, CSV.

## Çakışma notu (Mahmut)

Değişen Mahmut dosyaları: `PanelIcerigi.tsx` (OsbOzetiBolumu), `Harita.tsx` (OsbSiniri), `types/gecici.ts`, `types/api.ts` (üretilen), `app/page.tsx`. Çakışırsa:
- `api.ts`: elle çözme, `npm run tipler` yeniden üret.
- `PanelIcerigi.tsx`: onun tasarımını koru, benim 3 ekimi (ozetler, SenaryoPaneli, indir düğmesi) üstüne koy.

Sıra: Mahmut önce pushlarsa `git pull origin main` çakışmasını ben çözerim, commit'i Nazım atar.
