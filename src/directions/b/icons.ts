// Direction B glyph set: simple 24px line icons drawn for this direction (no brand marks).
export const ICON_PATHS = {
  about: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M3 12.5h18"/>',
  projects:
    '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  music:
    '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  resume:
    '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  contact: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  billable: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  mahjong:
    '<rect x="6" y="3.5" width="12" height="17" rx="2.5"/><circle cx="12" cy="9" r="2"/><circle cx="12" cy="15" r="2"/>',
  parking:
    '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10 16.5v-9h3a2.5 2.5 0 0 1 0 5h-3"/>',
  fashion:
    '<path d="M12 7.5a2 2 0 1 1 2-2c0 1-.8 1.4-2 2.3V9"/><path d="M12 9 3.6 15.4A1.5 1.5 0 0 0 4.5 18h15a1.5 1.5 0 0 0 .9-2.6z"/>',
  boxscores:
    '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5v17"/><path d="M6.2 5.8C8.3 7.6 9.5 9.7 9.5 12s-1.2 4.4-3.3 6.2M17.8 5.8c-2.1 1.8-3.3 3.9-3.3 6.2s1.2 4.4 3.3 6.2"/>',
  travel: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  tcg: '<rect x="3.5" y="6.5" width="10" height="14" rx="2" transform="rotate(-10 8.5 13.5)"/><rect x="10.5" y="3.5" width="10" height="14" rx="2"/>',
  sparkle:
    '<path d="M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5z"/><path d="M18.5 16.5c.2 1.4.8 2 2 2.2-1.2.2-1.8.8-2 2.2-.2-1.4-.8-2-2-2.2 1.2-.2 1.8-.8 2-2.2z"/>',
  chart: '<path d="M4 19.5h16"/><path d="m5.5 15 4-4.5 3.5 3 5.5-6.5"/><path d="M14.5 7h4v4"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5.5l-3 13"/>',
  chevron: '<path d="m14.5 6-6 6 6 6"/>',
  arrow: '<path d="M7.5 16.5 16.5 7.5M9 7.5h7.5V15"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  flag: '<path d="M5.5 21V4.5M5.5 4.5h11l-2.2 4 2.2 4h-11"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  quote:
    '<path d="M9.5 7.5H6a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 6 13.5h3v1.2A3.3 3.3 0 0 1 5.7 18M19.5 7.5H16a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5h3v1.2a3.3 3.3 0 0 1-3.3 3.3"/>',
} as const;

export type IconName = keyof typeof ICON_PATHS;
