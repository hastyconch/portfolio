// Inline-SVG art for the Pantry Lane demo: line icons and small flat product drawings. Drawn for
// this demo; no stock imagery, no real packaging or marks.

const ICONS = {
  home: <path d="M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5z" />,
  tag: (
    <>
      <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </>
  ),
  list: (
    <>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="m3.5 6 1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11" />
      <circle cx="5.5" cy="18" r="1.25" />
    </>
  ),
  bowl: (
    <>
      <path d="M3 11h18a9 9 0 0 1-18 0z" />
      <path d="M8 8c0-2 2-2 2-4M12 8c0-2 2-2 2-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M15 5.5a3 3 0 0 1 0 5.5M17 14a5 5 0 0 1 3.5 5" />
    </>
  ),
  spark: <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" />,
  check: <path d="M5 12.5 9.5 17 19 7.5" />,
  receipt: (
    <>
      <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="gro-ico"
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

export function Logo() {
  return (
    <svg className="gro-logo" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <circle cx="14" cy="14" r="13" fill="#f5c451" />
      <path d="M8 19c0-6 4-10 12-11-1 8-5 12-11 12" fill="#134e4a" />
      <path d="M9 19c2-3 5-6 8-8" stroke="#f5c451" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

const PRODUCTS = {
  cereal: (
    <>
      <rect x="16" y="10" width="32" height="46" rx="3" fill="#e9a23b" />
      <rect x="16" y="10" width="32" height="9" rx="3" fill="#c97f1f" />
      <ellipse cx="32" cy="40" rx="11" ry="5" fill="#fff6e2" />
      <path d="M21 40a11 8 0 0 0 22 0" fill="#fff" />
      <circle cx="28" cy="37" r="2" fill="#c97f1f" />
      <circle cx="33" cy="36" r="2" fill="#c97f1f" />
      <circle cx="37" cy="38" r="2" fill="#c97f1f" />
      <rect x="22" y="24" width="20" height="4" rx="2" fill="#fff6e2" />
    </>
  ),
  yogurt: (
    <>
      {[14, 34].map((x) => (
        <g key={x}>
          <path d={`M${x} 26h16l-2 28h-12z`} fill="#fff" stroke="#c9d8d3" />
          <rect x={x - 1} y="22" width="18" height="5" rx="2" fill="#134e4a" />
          <rect x={x + 1} y="36" width="14" height="7" fill="#d7ebe7" />
        </g>
      ))}
    </>
  ),
  berries: (
    <>
      <path d="M22 18c4-6 10-6 12-2-4 0-8 1-12 2z" fill="#3f8f4a" />
      {[
        [24, 34, '#4b3a8f'],
        [36, 30, '#4b3a8f'],
        [30, 44, '#4b3a8f'],
        [42, 42, '#c2185b'],
        [20, 46, '#c2185b'],
        [40, 54, '#4b3a8f'],
        [28, 54, '#c2185b'],
      ].map(([x, y, c]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill={c as string} />
      ))}
      <circle cx="22" cy="32" r="1.6" fill="#fff" opacity="0.6" />
      <circle cx="34" cy="28" r="1.6" fill="#fff" opacity="0.6" />
    </>
  ),
  coffee: (
    <>
      <path d="M18 18h28l3 38H15z" fill="#6b4a2f" />
      <path d="M18 18l4-6h20l4 6z" fill="#563a24" />
      <rect x="22" y="28" width="20" height="16" rx="2" fill="#f3e6d6" />
      <ellipse cx="32" cy="36" rx="4" ry="6" fill="#6b4a2f" />
      <path d="M32 31c-1 3 1 7 0 10" stroke="#f3e6d6" strokeWidth="1.2" fill="none" />
    </>
  ),
};

export type Product = keyof typeof PRODUCTS;

export function ProductArt({ product }: { product: Product }) {
  return (
    <svg className="gro-prod" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {PRODUCTS[product]}
    </svg>
  );
}

/** Overnight oats in a jar, berries on top. */
export function RecipeArt() {
  return (
    <svg
      className="gro-dish"
      viewBox="0 0 304 128"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="304" height="128" fill="#dcebe5" />
      <circle cx="248" cy="24" r="40" fill="#cfe3db" />
      <rect y="100" width="304" height="28" fill="#c7b08a" />
      <rect y="100" width="304" height="4" fill="#b39a72" />
      <path
        d="M114 30h76v62a14 14 0 0 1-14 14h-48a14 14 0 0 1-14-14z"
        fill="#f7fbfa"
        opacity="0.9"
      />
      <path d="M116 58h72v34a12 12 0 0 1-12 12h-48a12 12 0 0 1-12-12z" fill="#ead9b8" />
      <path d="M116 58h72v10h-72z" fill="#f4ead3" />
      <path d="M116 76h72v6h-72z" fill="#b2416e" opacity="0.55" />
      <rect x="110" y="22" width="84" height="10" rx="4" fill="#134e4a" />
      {[
        [130, 54, '#4b3a8f'],
        [142, 50, '#c2185b'],
        [154, 54, '#4b3a8f'],
        [166, 50, '#c2185b'],
        [176, 55, '#4b3a8f'],
      ].map(([x, y, c]) => (
        <circle key={x} cx={x} cy={y} r="6" fill={c as string} />
      ))}
      <path
        d="M208 98c10-30 20-44 34-50"
        stroke="#8a6b47"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="246" cy="46" rx="9" ry="6" fill="#8a6b47" transform="rotate(-30 246 46)" />
      <circle cx="60" cy="94" r="8" fill="#4b3a8f" />
      <circle cx="74" cy="96" r="7" fill="#c2185b" />
      <circle cx="66" cy="84" r="6" fill="#4b3a8f" />
    </svg>
  );
}
