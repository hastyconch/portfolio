// Inline-SVG art for the Skyward Rewards demo: line icons (one 1.5px stroke, sized to the text) and
// the member barcode. Drawn for this demo; no stock imagery, no real marks.

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
  chevron: <path d="M9.5 6 15.5 12l-6 6" />,
  barcode: <path d="M4 6v12M6.5 6v12M10 6v12M12.5 6v12M16 6v12M18 6v12M20.5 6v12" />,
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
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
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
