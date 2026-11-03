from __future__ import annotations

import io
import math

import httpx
from PIL import Image, ImageDraw

# Frontend'in uydu katmanıyla aynı kaynak (frontend/src/lib/sabitler.ts)
KARO_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
# ponytail: OSB'de z19 gerçek (0,23 m/px), z20 "Map data not yet available"; başka bölgede karo kontrolü gerekir
EN_YAKIN_ZOOM = 19
EN_BUYUK_KENAR_PX = 1280
PAY = 0.15
USER_AGENT = "suntech-cati-radari/0.1 (github.com/nazimhikmetsasi/suntech-cati-radari)"


def _piksel(lon: float, lat: float, z: int) -> tuple[float, float]:
    olcek = 256 * 2**z
    x = (lon + 180) / 360 * olcek
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * olcek
    return x, y


def cati_goruntusu(geom: list[dict]) -> tuple[bytes, int]:
    """Çatıyı kapsayan uydu görüntüsü (JPEG) ve kullanılan zoom; çatı sınırı sarı çizili."""
    for z in range(EN_YAKIN_ZOOM, 14, -1):
        noktalar = [_piksel(p["lon"], p["lat"], z) for p in geom]
        xs, ys = [x for x, _ in noktalar], [y for _, y in noktalar]
        g, y_ = max(xs) - min(xs), max(ys) - min(ys)
        sol, ust = min(xs) - g * PAY - 20, min(ys) - y_ * PAY - 20
        sag, alt = max(xs) + g * PAY + 20, max(ys) + y_ * PAY + 20
        if max(sag - sol, alt - ust) <= EN_BUYUK_KENAR_PX:
            break

    kx0, ky0, kx1, ky1 = int(sol // 256), int(ust // 256), int(sag // 256), int(alt // 256)
    tuval = Image.new("RGB", ((kx1 - kx0 + 1) * 256, (ky1 - ky0 + 1) * 256))
    # ponytail: karolar sırayla iniyor (büyük çatıda ~30 karo, ~3 sn); yavaşlarsa iş parçacığı havuzu
    with httpx.Client(trust_env=False, headers={"User-Agent": USER_AGENT}, timeout=15) as c:
        for kx in range(kx0, kx1 + 1):
            for ky in range(ky0, ky1 + 1):
                r = c.get(KARO_URL.format(z=z, x=kx, y=ky))
                r.raise_for_status()
                tuval.paste(Image.open(io.BytesIO(r.content)).convert("RGB"), ((kx - kx0) * 256, (ky - ky0) * 256))

    ox, oy = kx0 * 256, ky0 * 256
    ImageDraw.Draw(tuval).line([(x - ox, y - oy) for x, y in noktalar] + [(noktalar[0][0] - ox, noktalar[0][1] - oy)],
                               fill=(255, 220, 0), width=3)
    kirpik = tuval.crop((int(sol - ox), int(ust - oy), int(sag - ox), int(alt - oy)))
    tampon = io.BytesIO()
    kirpik.save(tampon, format="JPEG", quality=88)
    return tampon.getvalue(), z
