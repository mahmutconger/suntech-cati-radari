// Tanıtım ekranı yalnızca ilk ziyarette gösterilir; görüldüğü bilgisi tarayıcıda tutulur.

const ANAHTAR = "cati-radari:tanitim-goruldu";

export function tanitimGoruldu(): boolean {
  try {
    return window.localStorage.getItem(ANAHTAR) === "1";
  } catch {
    // Gizli sekme ya da kapalı depolama: tanıtımı göstermek zararsız.
    return false;
  }
}

export function tanitimiGorulduSay(): void {
  try {
    window.localStorage.setItem(ANAHTAR, "1");
  } catch {
    // Depolama kapalıysa sorun değil; bir sonraki ziyarette tanıtım yine görünür.
  }
}
