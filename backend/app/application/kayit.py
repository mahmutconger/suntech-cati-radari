from __future__ import annotations

from datetime import datetime, timezone

from google.cloud.firestore_v1.base_query import FieldFilter

from app.application import bina
from app.application.sonuc import Sonuc
from app.core.firebase import get_firestore_client

AZAMI_KAYIT = 100  # kullanıcı başına; Firestore kotasını korur


def _koleksiyon():
    return get_firestore_client().collection("kayitlar")


def _disari(belge) -> dict:
    v = belge.to_dict()
    v.pop("kullanici_id")
    return v | {"id": belge.id}


def _kullanicinin(uid: str) -> list:
    # Tek alanlı sorgu: bileşik indeks gerekmesin diye sıralama Python'da
    return list(_koleksiyon().where(filter=FieldFilter("kullanici_id", "==", uid)).stream())


def listele(uid: str) -> list[dict]:
    kayitlar = [_disari(b) for b in _kullanicinin(uid)]
    return sorted(kayitlar, key=lambda k: k["olusturma"], reverse=True)


def ekle(uid: str, istek: dict) -> Sonuc[dict]:
    b = bina.detay(istek["bina_id"])
    if b is None:
        return Sonuc.hatali("bina_yok", "Bina bulunamadı")
    if len(_kullanicinin(uid)) >= AZAMI_KAYIT:
        return Sonuc.hatali("kayit_siniri", f"En çok {AZAMI_KAYIT} kayıt tutulabilir, eskilerden silin.")
    belge = _koleksiyon().document()
    veri = istek | {"kullanici_id": uid, "bina_ad": b["ad"], "olusturma": datetime.now(timezone.utc)}
    belge.set(veri)
    veri.pop("kullanici_id")
    return Sonuc.tamam(veri | {"id": belge.id})


def sil(uid: str, kayit_id: str) -> Sonuc[None]:
    belge = _koleksiyon().document(kayit_id)
    anlik = belge.get()
    # Başkasının kaydı da "yok" görünür; var olduğu sızdırılmaz
    if not anlik.exists or anlik.get("kullanici_id") != uid:
        return Sonuc.hatali("kayit_yok", "Kayıt bulunamadı")
    belge.delete()
    return Sonuc.tamam(None)
