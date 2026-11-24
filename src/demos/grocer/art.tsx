// Line icons for the Pantry Lane demo, one round stroke in the current text colour. Drawn for this
// demo; no stock imagery, no real packaging or marks. The app is type-led: no product art.

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
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10" r="2.25" />
    </>
  ),
  check: <path d="M5 12.5 9.5 17 19 7.5" />,
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
