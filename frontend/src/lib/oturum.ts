"use client";

// Giriş, kayıt, şifre sıfırlama ve çıkış. Firebase Authentication (yalnızca e-posta ve şifre) kullanılır.
// Firebase ayarları girilmemiş ve sahte veri açıksa, arayüzü denemek için sahte oturum açılır.

import {
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { SAHTE_VERI } from "@/lib/api";
import { firebaseAuth, firebaseHazir } from "@/lib/firebase";
import { useOturum } from "@/store/oturum";

export const SAHTE_OTURUM = SAHTE_VERI && !firebaseHazir;

/** Firebase'in e-posta/şifre şartı: en az 6 karakter. */
export const EN_KISA_SIFRE = 6;

const HATA_MESAJLARI: Record<string, string> = {
  "auth/invalid-email": "E-posta adresi geçerli değil.",
  "auth/missing-email": "E-posta adresinizi girin.",
  "auth/missing-password": "Şifre girin.",
  "auth/weak-password": `Şifre en az ${EN_KISA_SIFRE} karakter olmalı.`,
  "auth/email-already-in-use": "Bu e-postayla zaten bir hesap var. Giriş yapın.",
  "auth/invalid-credential": "E-posta ya da şifre yanlış.",
  "auth/user-not-found": "E-posta ya da şifre yanlış.",
  "auth/wrong-password": "E-posta ya da şifre yanlış.",
  "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
  "auth/too-many-requests": "Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.",
  "auth/network-request-failed": "İnternet bağlantısı yok gibi görünüyor.",
  "auth/operation-not-allowed": "E-posta ile giriş Firebase konsolunda açılmamış.",
};

export function oturumHatasi(hata: unknown): string {
  if (hata instanceof FirebaseError) return HATA_MESAJLARI[hata.code] ?? "İşlem tamamlanamadı. Tekrar deneyin.";
  return hata instanceof Error ? hata.message : "Beklenmeyen bir hata oluştu.";
}

function sahteOturumAc(eposta: string) {
  useOturum.getState().ayarla({ uid: "sahte-kullanici", eposta });
}

function hazirAuth(): Auth {
  const auth = firebaseAuth();
  if (!auth) throw new Error("Firebase ayarları eksik.");
  return auth;
}

/**
 * "Beni hatırla" işaretliyse oturum tarayıcı kapansa da sürer; değilse sekme kapanınca biter.
 *
 * Kalıcı oturum IndexedDB'de tutulur, çünkü Firebase her sayfa açılışında oturumu kendi ilk tercihi olan
 * IndexedDB'ye taşır. Önceden localStorage seçiliydi: yeni açılan sekme oturumu IndexedDB'ye taşıyıp
 * localStorage'dan siliyor, eski sekme bunu çıkış sanıyordu; çıkış da yalnızca bir kopyayı sildiği için
 * sayfa yeniden açılınca kalan kopyayla aynı hesaba giriliyordu.
 */
async function kaliciligiAyarla(auth: Auth, hatirla: boolean): Promise<void> {
  if (!hatirla) {
    await setPersistence(auth, browserSessionPersistence);
    return;
  }
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
  } catch {
    // IndexedDB kapalıysa (bazı gizli pencereler) localStorage'a düş.
    await setPersistence(auth, browserLocalPersistence);
  }
}

const OTURUM_ANAHTARI = "firebase:authUser:";

/**
 * Çıkıştan sonra tarayıcıda kalmış oturum kopyalarını siler (localStorage, sessionStorage, IndexedDB).
 * Önceki sürümün bıraktığı ikinci kopya, çıkıştan sonra aynı hesaba geri girilmesine yol açıyordu.
 */
async function oturumKopyalariniSil(): Promise<void> {
  for (const depo of [window.localStorage, window.sessionStorage]) {
    try {
      Object.keys(depo)
        .filter((k) => k.startsWith(OTURUM_ANAHTARI))
        .forEach((k) => depo.removeItem(k));
    } catch {
      // Depo erişilemiyorsa (gizlilik ayarı) geç.
    }
  }
  await new Promise<void>((bitti) => {
    let istek: IDBOpenDBRequest;
    try {
      istek = indexedDB.open("firebaseLocalStorageDb");
    } catch {
      bitti();
      return;
    }
    // Veritabanı hiç yoksa oluşturma: Firebase onu kendi şemasıyla açar.
    istek.onupgradeneeded = () => istek.transaction?.abort();
    istek.onerror = () => bitti();
    istek.onblocked = () => bitti();
    istek.onsuccess = () => {
      const db = istek.result;
      const depoAdi = "firebaseLocalStorage";
      if (!db.objectStoreNames.contains(depoAdi)) {
        db.close();
        bitti();
        return;
      }
      const islem = db.transaction(depoAdi, "readwrite");
      const imlec = islem.objectStore(depoAdi).openCursor();
      imlec.onsuccess = () => {
        const c = imlec.result;
        if (!c) return;
        if (String(c.key).startsWith(OTURUM_ANAHTARI)) c.delete();
        c.continue();
      };
      islem.oncomplete =
        islem.onerror =
        islem.onabort =
          () => {
            db.close();
            bitti();
          };
    };
  });
}

export async function girisYap(eposta: string, sifre: string, hatirla = true): Promise<void> {
  if (SAHTE_OTURUM) return sahteOturumAc(eposta);
  const auth = hazirAuth();
  await kaliciligiAyarla(auth, hatirla);
  await signInWithEmailAndPassword(auth, eposta, sifre);
}

export interface KayitSonucu {
  /** Doğrulama e-postası gönderilebildiyse true. Gönderilemese de hesap açılmış olur. */
  dogrulamaGonderildi: boolean;
}

export async function kayitOl(eposta: string, sifre: string, hatirla = true): Promise<KayitSonucu> {
  if (SAHTE_OTURUM) {
    sahteOturumAc(eposta);
    return { dogrulamaGonderildi: false };
  }
  const auth = hazirAuth();
  await kaliciligiAyarla(auth, hatirla);
  const { user } = await createUserWithEmailAndPassword(auth, eposta, sifre);
  try {
    // Doğrulama girişi engellemez; yalnızca bilgilendirme amaçlı gönderilir.
    await sendEmailVerification(user);
    return { dogrulamaGonderildi: true };
  } catch {
    return { dogrulamaGonderildi: false };
  }
}

/**
 * Şifre sıfırlama bağlantısı gönderir. Firebase, e-posta numaralandırma koruması açıkken
 * adres kayıtlı olmasa da hata vermez; arayüz de bu yüzden "kayıtlıysa gönderdik" der.
 */
export async function sifreSifirlamaGonder(eposta: string): Promise<void> {
  if (SAHTE_OTURUM) return;
  await sendPasswordResetEmail(hazirAuth(), eposta);
}

export async function cikisYap(): Promise<void> {
  const auth = firebaseAuth();
  if (auth) {
    await signOut(auth);
    await oturumKopyalariniSil();
  } else {
    useOturum.getState().ayarla(null);
  }
  // replace: geri tuşu oturumlu sayfaya dönmesin; tam yükleme bellekteki eski durumu da temizler.
  window.location.replace("/giris");
}
