"use client";

// Firebase istemcisi. Frontend Firebase'i yalnızca giriş (Authentication) için kullanır;
// veri her zaman bizim API'mizden gelir, Firestore'a tarayıcıdan bağlanılmaz.

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const ayarlar = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Ayarlar girilmemişse giriş özellikleri gizlenir, uygulamanın geri kalanı çalışır. */
export const firebaseHazir = Boolean(ayarlar.apiKey && ayarlar.projectId && ayarlar.appId);

let uygulama: FirebaseApp | null = null;

function firebaseUygulamasi(): FirebaseApp | null {
  if (!firebaseHazir || typeof window === "undefined") return null;
  if (!uygulama) uygulama = getApps().length ? getApp() : initializeApp(ayarlar);
  return uygulama;
}

export function firebaseAuth(): Auth | null {
  const app = firebaseUygulamasi();
  return app ? getAuth(app) : null;
}

/** Oturum açıksa backend'e gönderilecek Firebase ID token'ı; değilse null. */
export async function kimlikTokeni(): Promise<string | null> {
  const kullanici = firebaseAuth()?.currentUser;
  return kullanici ? kullanici.getIdToken() : null;
}
