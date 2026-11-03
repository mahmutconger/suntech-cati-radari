import { AnaEkran } from "@/components/AnaEkran";
import { BinaAdresi } from "@/components/harita/BinaAdresi";

// Harita herkese açık (jüri QR'dan girişsiz açar); giriş yalnızca kaydetmek ve Kayıtlarım için.
export default function Sayfa() {
  return (
    <>
      <BinaAdresi />
      <AnaEkran />
    </>
  );
}
