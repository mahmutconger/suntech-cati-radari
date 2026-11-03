from __future__ import annotations

import json
import zlib
from datetime import datetime, timezone

from google.genai import types

from app.application.sonuc import Sonuc
from app.core.config import GEMINI_SAHTE
from app.core.firebase import get_firestore_client
from app.infrastructure.depo import HesapDeposu
from app.infrastructure.gemini import uret
from app.infrastructure.uydu_karo import cati_goruntusu

TALIMAT = """Bu bir fabrika çatısının uydu görüntüsü. Sarı çizgi incelenecek çatının sınırıdır; çizginin kendisi panel değildir.
Yalnızca sarı çizginin içine bak ve şunu belirle:
- panel: çatıda güneş paneli (koyu mavi ya da siyah, düzenli sıralar halinde dikdörtgenler) "var", "yok" ya da görüntü yetersizse "belirsiz".
- kaplama_orani: panellerin çatı alanının yaklaşık ne kadarını kapladığı, 0 ile 1 arası; panel yoksa 0.
- guven: cevabından ne kadar eminsin, 0 ile 1 arası.
- aciklama: en fazla iki kısa Türkçe cümle; ışıklık, havalandırma, gölge ya da engel gibi panel kurulumunu etkileyen şeyleri yaz.
Işıklıklar (beyaz ya da açık renkli şeffaf şeritler), koyu çatı kaplaması, gölgeler ve kamyonlar panel değildir."""

SEMA = {
    "type": "object",
    "properties": {
        "panel": {"type": "string", "enum": ["var", "yok", "belirsiz"]},
        "kaplama_orani": {"type": "number", "minimum": 0, "maximum": 1},
        "guven": {"type": "number", "minimum": 0, "maximum": 1},
        "aciklama": {"type": "string"},
    },
    "required": ["panel", "kaplama_orani", "guven", "aciklama"],
}


def _koleksiyon():
    return get_firestore_client().collection("uydu_sonuclari")


def _disari(bina_id: int, v: dict, onbellekten: bool) -> dict:
    return {
        "bina_id": bina_id,
        "panel": v["panel"],
        "kaplama_orani": v["kaplama_orani"],
        "guven": v["guven"],
        "aciklama": v.get("aciklama", ""),
        "model": v["model"],
        "onbellekten": onbellekten,
    }


def _sahte(bina_id: int) -> dict:
    tohum = zlib.crc32(str(bina_id).encode()) % 10  # aynı çatı hep aynı sahte cevabı alsın
    panel = "var" if tohum < 2 else "belirsiz" if tohum == 2 else "yok"
    return {"panel": panel, "kaplama_orani": 0.3 if panel == "var" else 0.0, "guven": 0.5,
            "aciklama": "Sahte mod, Gemini'ye istek gönderilmedi.", "model": "sahte"}


def tespit_et(bina_id: int) -> Sonuc[dict]:
    bina = HesapDeposu().getir(bina_id)
    if bina is None:
        return Sonuc.hatali("bina_yok", "Bina bulunamadı")
    if GEMINI_SAHTE:
        return Sonuc.tamam(_disari(bina_id, _sahte(bina_id), onbellekten=False))

    belge = _koleksiyon().document(str(bina_id))
    anlik = belge.get()
    if anlik.exists:
        return Sonuc.tamam(_disari(bina_id, anlik.to_dict(), onbellekten=True))

    try:
        jpg, zoom = cati_goruntusu(bina["geom"])
    except Exception:
        return Sonuc.hatali("goruntu_yok", "Uydu görüntüsü alınamadı, biraz sonra tekrar deneyin.")

    icerik = [types.Content(role="user", parts=[
        types.Part.from_bytes(data=jpg, mime_type="image/jpeg"),
        types.Part.from_text(text=TALIMAT),
    ])]
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_json_schema=SEMA,
        temperature=0,
        max_output_tokens=400,
    )
    yanit, model = uret(icerik, config)
    try:
        v = json.loads(yanit.text)
        v = {
            "panel": v["panel"] if v["panel"] in ("var", "yok", "belirsiz") else "belirsiz",
            "kaplama_orani": round(min(max(float(v["kaplama_orani"]), 0), 1), 2),
            "guven": round(min(max(float(v["guven"]), 0), 1), 2),
            "aciklama": str(v.get("aciklama", ""))[:300],
        }
    except (TypeError, ValueError, KeyError):
        return Sonuc.hatali("cevap_bozuk", "Uydu analizi okunamadı, tekrar deneyin.")

    v |= {"model": model, "zoom": zoom, "olusturma": datetime.now(timezone.utc)}
    belge.set(v)
    return Sonuc.tamam(_disari(bina_id, v, onbellekten=False))
