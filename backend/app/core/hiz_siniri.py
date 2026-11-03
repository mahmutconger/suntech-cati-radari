# from __future__ import annotations yok: FastAPI sınıf örneğinin __call__ imzasındaki metin tipleri çözemiyor
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class HizSiniri:
    """Kayan pencere: IP başına ve toplamda dakikada en çok N istek.

    ponytail: bellekte, Cloud Run'da sunucu başına sayılır; maxInstances düşük tutulursa yeter, çok sunucuda Firestore/Redis sayaç.
    X-Forwarded-For'un ilk adresi istemci tarafından uydurulabilir; toplam sınır bunun için var.
    """

    def __init__(self, ip_basina: int, toplam: int, pencere_sn: float = 60) -> None:
        self.ip_basina, self.toplam, self.pencere = ip_basina, toplam, pencere_sn
        self._kayit: dict[str, deque[float]] = defaultdict(deque)

    def _dene(self, anahtar: str, sinir: int, simdi: float) -> bool:
        q = self._kayit[anahtar]
        while q and q[0] <= simdi - self.pencere:
            q.popleft()
        if len(q) >= sinir:
            return False
        q.append(simdi)
        return True

    def __call__(self, request: Request) -> None:
        ip = (request.headers.get("x-forwarded-for", "").split(",")[0].strip()
              or (request.client.host if request.client else "bilinmiyor"))
        simdi = time.monotonic()
        if not self._dene(f"ip:{ip}", self.ip_basina, simdi) or not self._dene("*", self.toplam, simdi):
            raise HTTPException(
                429,
                detail={"kod": "cok_istek", "mesaj": "Çok sık istek gönderildi, bir dakika sonra tekrar deneyin."},
                headers={"Retry-After": str(int(self.pencere))},
            )


if __name__ == "__main__":
    s = HizSiniri(ip_basina=2, toplam=3, pencere_sn=60)
    assert s._dene("ip:a", 2, 0) and s._dene("ip:a", 2, 1) and not s._dene("ip:a", 2, 2)
    assert s._dene("ip:a", 2, 61)  # pencere kaydı
    print("tamam")
