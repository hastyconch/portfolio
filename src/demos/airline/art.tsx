// Inline-SVG art for the Skyward Rewards demo: stroke icons for perks and actions, and the
// destination scenes on reward cards. Drawn for this demo; no stock imagery, no real marks.

const ICONS = {
  checkin: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M9 6v12" strokeDasharray="2 2" />
      <path d="M13 10h4M13 14h3" />
    </>
  ),
  bag: (
    <>
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 7V4.5h6V7M9 11v5M15 11v5" />
    </>
  ),
  lounge: (
    <>
      <path d="M6 11V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" />
      <path d="M4 12a2 2 0 0 1 2 2v1h12v-1a2 2 0 1 1 2 2v2H4v-2a2 2 0 0 1 0-4z" />
      <path d="M6 18v2M18 18v2" />
    </>
  ),
  boarding: (
    <>
      <circle cx="8" cy="6" r="2.5" />
      <path d="M4 20v-5a4 4 0 0 1 8 0v5" />
      <path d="M15 12h6M18.5 9.5 21 12l-2.5 2.5" />
    </>
  ),
  upgrade: (
    <>
      <path d="M6 4v9a2 2 0 0 0 2 2h7" />
      <path d="M5 20h11M9 15l-1 5M14 15l1 5" />
      <path d="M19 11V4M16.5 6.5 19 4l2.5 2.5" />
    </>
  ),
  support: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19a3 3 0 0 1-3 3h-3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  plane: (
    <path d="M10.5 3.5c0-.9.7-1.5 1.5-1.5s1.5.6 1.5 1.5V9l7.5 4.5v2L13.5 13v4.5l2 1.5v1.5L12 19.5l-3.5 1V19l2-1.5V13L3 15.5v-2L10.5 9z" />
  ),
  star: <path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8L8 13.5l-4.3-4 5.8-.7z" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="M5 12.5 9.5 17 19 7.5" />,
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="sky-ico"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

export type Scene = 'lisbon' | 'vancouver' | 'tokyo' | 'cancun';

/** A destination as a small flat illustration, 304×96, cropped to fill its box. */
export function SceneArt({ scene, id }: { scene: Scene; id: string }) {
  const sky = `${id}-sky`;
  const body = {
    lisbon: (
      <>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe2b8" />
          <stop offset="1" stopColor="#f6a56f" />
        </linearGradient>
        <rect width="304" height="96" fill={`url(#${sky})`} />
        <circle cx="236" cy="34" r="16" fill="#fff4dc" />
        <path d="M0 70 Q60 42 128 56 T304 50 V96 H0z" fill="#d9774a" />
        <path d="M0 80 Q80 60 170 72 T304 66 V96 H0z" fill="#b5532f" />
        {[18, 46, 74, 102, 196, 226, 258].map((x, i) => (
          <g key={x} transform={`translate(${x} ${60 - (i % 3) * 5})`}>
            <rect width="20" height="22" fill={i % 2 ? '#fbe8d0' : '#f4d3ae'} />
            <path d="M-2 0 10 -8 22 0z" fill="#9c3d1d" />
            <rect x="7" y="9" width="6" height="7" fill="#7a3a22" />
          </g>
        ))}
        <rect x="120" y="70" width="46" height="18" rx="3" fill="#f2c230" />
        <rect x="124" y="73" width="9" height="7" fill="#fff6d6" />
        <rect x="136" y="73" width="9" height="7" fill="#fff6d6" />
        <rect x="148" y="73" width="9" height="7" fill="#fff6d6" />
        <path d="M100 88 H190" stroke="#5c2a17" strokeWidth="2" />
        <path d="M143 70 V58" stroke="#5c2a17" strokeWidth="1.5" />
      </>
    ),
    vancouver: (
      <>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7ecf5" />
          <stop offset="1" stopColor="#a6cfe2" />
        </linearGradient>
        <rect width="304" height="96" fill={`url(#${sky})`} />
        <path d="M0 64 L58 20 L104 52 L150 14 L214 58 L260 30 L304 56 V96 H0z" fill="#557f8f" />
        <path d="M150 14 L136 25 L146 23 L152 28 L160 22 L166 26z" fill="#fff" />
        <path d="M58 20 L46 29 L56 28 L62 32 L68 27z" fill="#fff" />
        <path d="M0 74 Q76 58 152 70 T304 66 V96 H0z" fill="#2f5d6b" />
        <rect y="78" width="304" height="18" fill="#28698a" />
        <path d="M20 84h40M90 88h56M180 84h36M240 89h44" stroke="#8cc3db" strokeWidth="1.5" />
        {[8, 26, 268, 286].map((x, i) => (
          <path
            key={x}
            d={`M${x} 80 l9 -${22 + (i % 2) * 6} l9 ${22 + (i % 2) * 6}z`}
            fill="#1f4a3a"
          />
        ))}
      </>
    ),
    tokyo: (
      <>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbd6df" />
          <stop offset="1" stopColor="#ec9bb2" />
        </linearGradient>
        <rect width="304" height="96" fill={`url(#${sky})`} />
        <circle cx="84" cy="40" r="22" fill="#fff1ef" />
        <path d="M150 70 L206 24 L262 70z" fill="#9a5577" />
        <path d="M206 24 L194 34 L202 33 L208 37 L214 33 L218 34z" fill="#fff" />
        {[
          [0, 22],
          [18, 34],
          [34, 18],
          [52, 28],
          [70, 40],
          [92, 24],
          [112, 32],
          [132, 20],
          [216, 26],
          [236, 36],
          [256, 22],
          [276, 30],
          [292, 18],
        ].map(([x, h]) => (
          <rect key={x} x={x} y={96 - h - 6} width="16" height={h + 6} fill="#5e2c4b" />
        ))}
        <path d="M176 96 V40 M170 52 h12 M168 66 h16" stroke="#5e2c4b" strokeWidth="3" />
      </>
    ),
    cancun: (
      <>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9f1f2" />
          <stop offset="1" stopColor="#8adbe0" />
        </linearGradient>
        <rect width="304" height="96" fill={`url(#${sky})`} />
        <circle cx="62" cy="30" r="14" fill="#fff7cf" />
        <rect y="54" width="304" height="20" fill="#25a6b6" />
        <rect y="62" width="304" height="12" fill="#1b8fa0" />
        <path d="M60 60h46M150 58h60M236 64h40" stroke="#bdf0f3" strokeWidth="1.5" />
        <path d="M0 78 Q150 64 304 76 V96 H0z" fill="#f3e2b8" />
        <path d="M232 84 Q238 56 250 36" stroke="#7a5532" strokeWidth="4" fill="none" />
        <g fill="#2e7d4f">
          <path d="M250 36 q-22 -6 -32 8 q16 -6 32 -8z" />
          <path d="M250 36 q20 -10 32 2 q-16 -4 -32 -2z" />
          <path d="M250 36 q-6 -18 -22 -20 q14 8 22 20z" />
          <path d="M250 36 q10 -18 26 -16 q-16 4 -26 16z" />
        </g>
      </>
    ),
  }[scene];
  return (
    <svg
      className="sky-scene"
      viewBox="0 0 304 96"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {body}
    </svg>
  );
}

/** A plausible-looking member barcode (not a real symbology), from a fixed seed. */
export function Barcode({ seed = 4821 }: { seed?: number }) {
  const bars: [number, number][] = [];
  let x = 0;
  let s = seed;
  while (x < 220) {
    s = (s * 9301 + 49297) % 233280;
    const w = 1 + (s % 4);
    if ((s >> 3) % 3) bars.push([x, w]);
    x += w + 1 + ((s >> 5) % 2);
  }
  return (
    <svg className="sky-barcode" viewBox="0 0 220 44" aria-hidden="true" focusable="false">
      {bars.map(([bx, w]) => (
        <rect key={bx} x={bx} width={w} height="44" />
      ))}
    </svg>
  );
}
