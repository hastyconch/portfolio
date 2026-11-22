// The "system apps" of direction B: one per home-page section. Labels are UI chrome, not copy.
import type { IconName } from './icons';

export interface SystemApp {
  id: 'hero' | 'work' | 'projects' | 'music' | 'resume' | 'contact';
  label: string;
  icon: IconName;
  /** gradient: light → deep */
  colors: [string, string];
}

export const APPS: SystemApp[] = [
  { id: 'hero', label: 'About', icon: 'about', colors: ['#38bdf8', '#4f46e5'] },
  { id: 'work', label: 'Work', icon: 'work', colors: ['#818cf8', '#4338ca'] },
  { id: 'projects', label: 'Projects', icon: 'projects', colors: ['#fbbf24', '#ea580c'] },
  { id: 'music', label: 'Music', icon: 'music', colors: ['#f472b6', '#be123c'] },
  { id: 'resume', label: 'Résumé', icon: 'resume', colors: ['#94a3b8', '#334155'] },
  { id: 'contact', label: 'Contact', icon: 'contact', colors: ['#34d399', '#0f766e'] },
];

export const app = (id: SystemApp['id']): SystemApp => APPS.find((a) => a.id === id) ?? APPS[0];

const PROJECT_ICONS: Record<string, IconName> = {
  billable: 'billable',
  mahjong: 'mahjong',
  parking: 'parking',
  fashion: 'fashion',
  boxscores: 'boxscores',
  travel: 'travel',
  tcg: 'tcg',
};

/** Project `demo` key → glyph. */
export const projectIcon = (demo: string): IconName => PROJECT_ICONS[demo] ?? 'sparkle';

export const LAB_BASE = '/lab/b/';
