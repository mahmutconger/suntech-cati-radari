// Tanıtımdaki yatay özellik şeridinin görselleri. Dış fotoğraf yerine paletle çizilmiş SVG:
// internetsiz de görünür, keskin kalır ve uygulamanın kendisini anlatır.
// İki katman: arkada paralaksla kayan desenli zemin (OzellikZemini), önde her zaman tam görünen
// dikey (400×800) bir çizim kartı.

const ZEMIN = "#fdfdfd";
const LIMON = "#e1eb71";
const SEFTALI = "#ecab69";
const MERCAN = "#e36161";
const MUREKKEP = "#1c1a17";
const HARITA = "#f3efe6";
const TASARRUF = ["#e1eb71", "#e7cb6d", "#ecab69", "#e88665", "#e36161"];

const ortak = {
  viewBox: "0 0 400 800",
  preserveAspectRatio: "xMidYMid meet",
  className: "h-full w-full",
  role: "img" as const,
};

export type ZeminTuru = "harita" | "limon" | "uydu" | "mercan";

/** Paralaksla kayan geniş zemin: kartın arkasında, çizimle aynı renk dünyasında desen. */
export function OzellikZemini({ tur }: { tur: ZeminTuru }) {
  const id = `zemin-${tur}`;
  return (
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}-d`} x1="0" y1="0" x2="1" y2="1">
          {tur === "harita" && (
            <>
              <stop offset="0" stopColor={HARITA} />
              <stop offset="1" stopColor="#ebe4d6" />
            </>
          )}
          {tur === "limon" && (
            <>
              <stop offset="0" stopColor={LIMON} />
              <stop offset="1" stopColor={SEFTALI} />
            </>
          )}
          {tur === "uydu" && (
            <>
              <stop offset="0" stopColor="#3a3630" />
              <stop offset="1" stopColor={MUREKKEP} />
            </>
          )}
          {tur === "mercan" && (
            <>
              <stop offset="0" stopColor={SEFTALI} />
              <stop offset="1" stopColor={MERCAN} />
            </>
          )}
        </linearGradient>
        <pattern id={`${id}-p`} width="60" height="60" patternUnits="userSpaceOnUse">
          {tur === "harita" && <path d="M60 0H0V60" fill="none" stroke={MUREKKEP} strokeOpacity="0.07" />}
          {tur === "limon" && <circle cx="30" cy="30" r="2.5" fill={MUREKKEP} fillOpacity="0.12" />}
          {tur === "uydu" && <rect x="8" y="12" width="44" height="34" rx="3" fill={LIMON} fillOpacity="0.06" />}
          {tur === "mercan" && <path d="M0 60L60 0" stroke={ZEMIN} strokeOpacity="0.18" strokeWidth="2" />}
        </pattern>
      </defs>
      <rect width="1200" height="800" fill={`url(#${id}-d)`} />
      <rect width="1200" height="800" fill={`url(#${id}-p)`} />
      {tur === "harita" &&
        Array.from({ length: 18 }, (_, i) => (
          <rect
            key={i}
            x={(i * 173) % 1150}
            y={(i * 271) % 740}
            width={60 + ((i * 37) % 70)}
            height={40 + ((i * 53) % 60)}
            rx="3"
            fill={TASARRUF[i % 5]}
            fillOpacity="0.35"
          />
        ))}
    </svg>
  );
}

/** 01: OSB haritası, tasarrufa göre renkli çatılar, seçili çatının kartı. */
export function HaritaGorseli() {
  const catilar: [number, number, number, number, number, number][] = [
    // x, y, en, boy, açı, renk sırası
    [40, 170, 90, 60, -8, 4],
    [150, 150, 60, 44, 6, 2],
    [235, 175, 110, 70, -4, 3],
    [60, 280, 70, 90, 4, 1],
    [155, 255, 120, 80, -6, 4],
    [300, 290, 60, 52, 10, 0],
    [45, 410, 100, 64, 2, 2],
    [175, 390, 70, 110, -3, 3],
    [270, 400, 90, 60, 5, 1],
    [90, 520, 64, 48, -10, 0],
    [190, 540, 130, 76, 3, 4],
    [60, 610, 80, 60, 6, 2],
    [300, 640, 60, 70, -5, 1],
  ];
  return (
    <svg {...ortak} aria-label="Tasarrufa göre renklenmiş çatıların olduğu OSB haritası">
      <defs>
        <pattern id="izgara-1" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={MUREKKEP} strokeOpacity="0.06" />
        </pattern>
      </defs>
      <rect width="400" height="800" fill={HARITA} />
      <rect width="400" height="800" fill="url(#izgara-1)" />
      <path d="M0 350 C120 330 260 380 400 340" stroke={ZEMIN} strokeWidth="14" fill="none" />
      <path d="M210 0 C190 260 230 520 200 800" stroke={ZEMIN} strokeWidth="10" fill="none" />
      <path
        d="M24 140 L210 112 L376 150 L384 700 L250 728 L30 700 Z"
        fill={MERCAN}
        fillOpacity="0.05"
        stroke={MERCAN}
        strokeWidth="3"
        strokeDasharray="10 8"
      />
      {catilar.map(([x, y, en, boy, aci, renk], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={en}
          height={boy}
          rx="3"
          fill={TASARRUF[renk]}
          fillOpacity="0.9"
          stroke={MUREKKEP}
          strokeOpacity="0.25"
          transform={`rotate(${aci} ${x + en / 2} ${y + boy / 2})`}
        />
      ))}
      <rect
        x="155"
        y="255"
        width="120"
        height="80"
        rx="3"
        fill="none"
        stroke={MUREKKEP}
        strokeWidth="4"
        transform="rotate(-6 215 295)"
      />
      <g transform="translate(150 196)">
        <rect width="150" height="52" rx="14" fill={ZEMIN} stroke={MUREKKEP} strokeOpacity="0.12" />
        <text x="14" y="21" fontSize="11" fill={MUREKKEP} fillOpacity="0.55">
          Yıllık tasarruf
        </text>
        <text x="14" y="40" fontSize="16" fontWeight="700" fill={MUREKKEP}>
          12,4 milyon TL
        </text>
      </g>
      <g transform="translate(24 744)">
        {TASARRUF.map((r, i) => (
          <rect key={r} x={i * 30} width="24" height="10" rx="2" fill={r} />
        ))}
      </g>
    </svg>
  );
}

/** 02: Saatlik simülasyon ve 25 yıllık kümülatif nakit akışı; geri ödeme yılı işaretli. */
export function FinansGorseli() {
  const yillar = Array.from({ length: 26 }, (_, i) => i);
  // Kümülatif: 0. yıl yatırım (eksi), sonra yıllık net akışla yükselir; ~4. yılda sıfırı geçer.
  const kumulatif = yillar.map((y) => -100 + y * 26 - y * y * 0.12);
  const enBuyuk = Math.max(...kumulatif);
  const x = (y: number) => 40 + (y / 25) * 320;
  const yy = (v: number) => 560 - ((v + 100) / (enBuyuk + 100)) * 300;
  const cizgi = kumulatif.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${yy(v).toFixed(1)}`).join(" ");
  const saatler = [0, 0, 0, 0, 0, 1, 8, 22, 40, 58, 72, 80, 82, 78, 66, 50, 32, 14, 3, 0, 0, 0, 0, 0];
  return (
    <svg {...ortak} aria-label="25 yıllık nakit akışı grafiği ve günlük üretim eğrisi">
      <defs>
        <linearGradient id="zemin-2" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={LIMON} />
          <stop offset="1" stopColor={SEFTALI} />
        </linearGradient>
      </defs>
      <rect width="400" height="800" fill="url(#zemin-2)" />
      {/* Günlük üretim / tüketim (saatlik simülasyon) */}
      <g transform="translate(28 90)">
        <rect width="344" height="150" rx="20" fill={ZEMIN} />
        <text x="18" y="28" fontSize="12" fontWeight="600" fill={MUREKKEP}>
          Bir gün, saat saat
        </text>
        {saatler.map((s, i) => (
          <rect key={i} x={20 + i * 13} y={128 - s} width="9" height={s} rx="2" fill={SEFTALI} />
        ))}
        <path d="M20 104 H108 V70 H254 V104 H330" fill="none" stroke={MUREKKEP} strokeWidth="2" strokeDasharray="4 3" />
        <text x="250" y="62" fontSize="10" fill={MUREKKEP} fillOpacity="0.6">
          tüketim
        </text>
      </g>
      {/* 25 yıllık kümülatif */}
      <g>
        <rect x="28" y="270" width="344" height="330" rx="20" fill={ZEMIN} />
        <text x="46" y="300" fontSize="12" fontWeight="600" fill={MUREKKEP}>
          25 yıllık nakit akışı
        </text>
        <line x1="40" x2="360" y1={yy(0)} y2={yy(0)} stroke={MUREKKEP} strokeOpacity="0.35" />
        {yillar.slice(1).map((y) => (
          <rect key={y} x={x(y) - 4} y={yy(0) - 22} width="8" height="22" rx="1.5" fill={SEFTALI} fillOpacity="0.75" />
        ))}
        <rect x={x(0) - 5} y={yy(0)} width="10" height={yy(-100) - yy(0)} rx="1.5" fill={MERCAN} />
        <path d={cizgi} fill="none" stroke={MUREKKEP} strokeWidth="3.5" strokeLinecap="round" />
        <line x1={x(4)} x2={x(4)} y1="320" y2="575" stroke={MERCAN} strokeWidth="2" strokeDasharray="5 4" />
        <text x={x(4) + 6} y="334" fontSize="11" fontWeight="700" fill={MERCAN}>
          4. yıl
        </text>
      </g>
      <g transform="translate(28 630)">
        <rect width="166" height="74" rx="18" fill={ZEMIN} />
        <text x="16" y="28" fontSize="11" fill={MUREKKEP} fillOpacity="0.55">
          Net bugünkü değer
        </text>
        <text x="16" y="54" fontSize="20" fontWeight="800" fill={MUREKKEP}>
          65,7 M TL
        </text>
        <rect x="178" width="166" height="74" rx="18" fill={MUREKKEP} />
        <text x="194" y="28" fontSize="11" fill={LIMON} fillOpacity="0.85">
          İç verim oranı
        </text>
        <text x="194" y="54" fontSize="20" fontWeight="800" fill={LIMON}>
          %26,5
        </text>
      </g>
    </svg>
  );
}

/** 03: Uydu görüntüsünde panel taraması ve araç kullanan asistan. */
export function YapayZekaGorseli() {
  return (
    <svg {...ortak} aria-label="Uydu görüntüsünde çatı taraması ve asistan cevabı">
      <defs>
        <radialGradient id="tarama-3" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={SEFTALI} stopOpacity="0.55" />
          <stop offset="1" stopColor={SEFTALI} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="800" fill="#2a2722" />
      {/* Uydu: çatılar ve yol, yukarıdan */}
      <rect x="0" y="0" width="400" height="460" fill="#3a3630" />
      <path d="M0 300 L400 260" stroke="#4a463f" strokeWidth="26" />
      <rect x="70" y="90" width="260" height="170" rx="4" fill="#cfcac0" transform="rotate(-6 200 175)" />
      <g transform="rotate(-6 200 175)">
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => (
            <rect
              key={`${r}-${c}`}
              x={86 + c * 30}
              y={104 + r * 26}
              width="26"
              height="21"
              rx="2"
              fill={MUREKKEP}
              fillOpacity="0.85"
              stroke={LIMON}
              strokeOpacity="0.35"
            />
          )),
        )}
      </g>
      <rect x="40" y="330" width="150" height="100" rx="4" fill="#bdb7ab" transform="rotate(4 115 380)" />
      <circle cx="200" cy="175" r="170" fill="url(#tarama-3)" />
      <circle cx="200" cy="175" r="120" fill="none" stroke={SEFTALI} strokeWidth="2" strokeDasharray="6 6" />
      <circle cx="200" cy="175" r="70" fill="none" stroke={LIMON} strokeWidth="2" />
      <g transform="translate(212 300)">
        <rect width="164" height="58" rx="16" fill={LIMON} />
        <text x="14" y="23" fontSize="11" fontWeight="700" fill={MUREKKEP}>
          Çatıda panel var
        </text>
        <text x="14" y="42" fontSize="11" fill={MUREKKEP} fillOpacity="0.7">
          %62 kaplı · güven %88
        </text>
      </g>
      {/* Asistan */}
      <g transform="translate(28 500)">
        <rect x="96" width="248" height="52" rx="18" fill={SEFTALI} />
        <text x="112" y="31" fontSize="12" fontWeight="600" fill={MUREKKEP}>
          Geri ödemesi 4 yıldan kısa kaç çatı?
        </text>
        <rect y="70" width="290" height="96" rx="18" fill={ZEMIN} />
        <text x="16" y="98" fontSize="12" fill={MUREKKEP}>
          Manisa OSB&apos;de 142 çatının geri
        </text>
        <text x="16" y="116" fontSize="12" fill={MUREKKEP}>
          ödemesi 4 yılın altında. Sayılar
        </text>
        <text x="16" y="134" fontSize="12" fill={MUREKKEP}>
          hesap motorundan geldi.
        </text>
        <g transform="translate(0 182)">
          <rect width="92" height="26" rx="13" fill={LIMON} />
          <text x="14" y="17" fontSize="11" fontWeight="600" fill={MUREKKEP}>
            ⚙ Sıralama
          </text>
          <rect x="100" width="100" height="26" rx="13" fill={LIMON} />
          <text x="114" y="17" fontSize="11" fontWeight="600" fill={MUREKKEP}>
            ⚙ OSB özeti
          </text>
        </g>
      </g>
    </svg>
  );
}

/** 04: Uygunluk skoru ve tek sayfalık ön fizibilite raporu. */
export function RaporGorseli() {
  return (
    <svg {...ortak} aria-label="Uygunluk skoru ve ön fizibilite raporu sayfası">
      <defs>
        <linearGradient id="zemin-4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SEFTALI} />
          <stop offset="1" stopColor={MERCAN} />
        </linearGradient>
      </defs>
      <rect width="400" height="800" fill="url(#zemin-4)" />
      <g transform="translate(46 120) rotate(-3 154 260)">
        <rect width="308" height="440" rx="10" fill={ZEMIN} />
        <rect x="22" y="22" width="120" height="8" rx="4" fill={SEFTALI} />
        <rect x="22" y="40" width="180" height="16" rx="5" fill={MUREKKEP} />
        <rect x="22" y="64" width="110" height="7" rx="3.5" fill={MUREKKEP} fillOpacity="0.25" />
        <line x1="22" x2="286" y1="84" y2="84" stroke={LIMON} strokeWidth="4" />
        <rect x="22" y="100" width="112" height="112" rx="6" fill={HARITA} />
        <rect
          x="40"
          y="128"
          width="76"
          height="52"
          rx="2"
          fill={LIMON}
          stroke={MUREKKEP}
          strokeOpacity="0.4"
          transform="rotate(-6 78 154)"
        />
        {[0, 1, 2].map((r) =>
          [0, 1].map((c) => (
            <g key={`${r}-${c}`}>
              <rect
                x={148 + c * 72}
                y={100 + r * 38}
                width="66"
                height="32"
                rx="5"
                fill={r === 0 ? LIMON : ZEMIN}
                stroke={MUREKKEP}
                strokeOpacity="0.12"
              />
              <rect
                x={156 + c * 72}
                y={108 + r * 38}
                width="30"
                height="5"
                rx="2.5"
                fill={MUREKKEP}
                fillOpacity="0.3"
              />
              <rect x={156 + c * 72} y={118 + r * 38} width="44" height="8" rx="3" fill={MUREKKEP} />
            </g>
          )),
        )}
        <path
          d="M30 296 L60 310 L90 294 L120 282 L150 272 L180 263 L210 256 L240 250 L270 244"
          fill="none"
          stroke={MUREKKEP}
          strokeWidth="3"
        />
        <line x1="22" x2="286" y1="312" y2="312" stroke={MUREKKEP} strokeOpacity="0.2" />
        {Array.from({ length: 6 }, (_, i) => (
          <g key={i}>
            <rect x="22" y={348 + i * 13} width="120" height="5" rx="2.5" fill={MUREKKEP} fillOpacity="0.2" />
            <rect x="160" y={348 + i * 13} width="40" height="5" rx="2.5" fill={MUREKKEP} fillOpacity="0.45" />
          </g>
        ))}
      </g>
      <g transform="translate(236 70)">
        <circle cx="62" cy="62" r="62" fill={MUREKKEP} />
        <circle cx="62" cy="62" r="48" fill="none" stroke={ZEMIN} strokeOpacity="0.15" strokeWidth="10" />
        <circle
          cx="62"
          cy="62"
          r="48"
          fill="none"
          stroke={LIMON}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 48 * 0.92} ${2 * Math.PI * 48}`}
          transform="rotate(-90 62 62)"
        />
        <text x="62" y="70" textAnchor="middle" fontSize="28" fontWeight="800" fill={LIMON}>
          92
        </text>
      </g>
      <g transform="translate(46 620)">
        <rect width="308" height="64" rx="32" fill={MUREKKEP} />
        <text x="154" y="39" textAnchor="middle" fontSize="16" fontWeight="700" fill={LIMON}>
          PDF olarak indir
        </text>
      </g>
    </svg>
  );
}
