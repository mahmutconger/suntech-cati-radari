"use client";

// Giriş, kayıt ve çıkış. Firebase Authentication (e-posta ve şifre) kullanılır.
// Firebase ayarları girilmemiş ve sahte veri açıksa, arayüzü denemek için sahte oturum açılır.

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { SAHTE_VERI } from "@/lib/api";
import { firebaseAuth, firebaseHazir } from "@/lib/firebase";
import { useOturum } from "@/store/oturum";

export const SAHTE_OTURUM = SAHTE_VERI && !firebaseHazir;

const HATA_MESAJLARI: Record<string, string> = {
  "auth/invalid-email": "E-posta adresi geçerli değil.",
  "auth/missing-password": "Şifre girin.",
  "auth/weak-password": "Şifre en az 6 karakter olmalı.",
  "auth/email-already-in-use": "Bu e-postayla zaten bir hesap var. Giriş yapın.",
  "auth/invalid-credential": "E-posta ya da şifre yanlış.",
  "auth/user-not-found": "E-posta ya da şifre yanlış.",
  "auth/wrong-password": "E-posta ya da şifre yanlış.",
  "auth/too-many-requests": "Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.",
  "auth/network-request-failed": "İnternet bağlantısı yok gibi görünüyor.",
  "auth/operation-not-allowed": "E-posta ile giriş Firebase konsolunda açılmamış.",
};

export function oturumHatasi(hata: unknown): string {
  if (hata instanceof FirebaseError) return HATA_MESAJLARI[hata.code] ?? "Giriş yapılamadı. Tekrar deneyin.";
  return hata instanceof Error ? hata.message : "Beklenmeyen bir hata oluştu.";
}

function sahteOturumAc(eposta: string) {
  useOturum.getState().ayarla({ uid: "sahte-kullanici", eposta });
}

export async function girisYap(eposta: string, sifre: string): Promise<void> {
  if (SAHTE_OTURUM) return sahteOturumAc(eposta);
  const auth = firebaseAuth();
  if (!auth) throw new Error("Firebase ayarları eksik.");
  await signInWithEmailAndPassword(auth, eposta, sifre);
}

export async function kayitOl(eposta: string, sifre: string): Promise<void> {
  if (SAHTE_OTURUM) return sahteOturumAc(eposta);
  const auth = firebaseAuth();
  if (!auth) throw new Error("Firebase ayarları eksik.");
  await createUserWithEmailAndPassword(auth, eposta, sifre);
}

export async function cikisYap(): Promise<void> {
  const auth = firebaseAuth();
  if (auth) await signOut(auth);
  else useOturum.getState().ayarla(null);
}
