// Direction C helpers: ticket ids, placeholder detection, status labels.

/** W-01, P-07, S-03… — ticket-style identifiers derived from list position. */
export const ticketId = (prefix: string, n: number) => `${prefix}-${String(n).padStart(2, '0')}`;

/** True for copy the owner still has to supply ("Placeholder", "Placeholder — …"). */
export const isPlaceholder = (s: string) => /^placeholder\b/i.test(s.trim());

export type Tone = 'ok' | 'progress' | 'ph' | 'plan' | 'neutral';

export const workStatus = (s: 'ready' | 'placeholder') =>
  s === 'ready'
    ? { label: 'Delivered', tone: 'ok' as Tone }
    : { label: 'Placeholder', tone: 'ph' as Tone };

export const projectStatus = (s: 'ready' | 'placeholder') =>
  s === 'ready'
    ? { label: 'Shipped', tone: 'ok' as Tone }
    : { label: 'Placeholder', tone: 'ph' as Tone };

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const categoryLabel = { app: 'Apps', game: 'Games', tool: 'Tools' } as const;

export const LAB = '/lab/c/';

/** Section outline of a case-study PRD (ids are anchors on /lab/c/<slug>/). */
export const prdSections = [
  { id: 'problem', label: 'Problem' },
  { id: 'features', label: 'Features' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'engineering', label: 'Engineering notes' },
];
