// Invented ICU week roster and the scheduling rules the demo checks (constitution art. 3 + 6):
// every name, number and rule wording here is made up; nothing is loaded over the network.

export type Shift = 'D' | 'N' | 'O';

export const DAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
] as const;

/** The open shift of the guided task: Saturday night. */
export const OPEN_DAY = 5;
export const OPEN_SHIFT = 'N' as const;

export const SHIFT_HOURS = 12;
export const OVERTIME_AFTER = 40;
export const MAX_NIGHTS = 3;
export const TARGET: Record<'D' | 'N', number> = { D: 4, N: 4 };

export const SHIFT_WORD: Record<Shift, string> = { D: 'Day', N: 'Night', O: 'Off' };
export const SHIFT_GLYPH: Record<Shift, string> = { D: 'D', N: 'N', O: '–' };
export const NEXT_SHIFT: Record<Shift, Shift> = { O: 'D', D: 'N', N: 'O' };

export interface Nurse {
  name: string;
  /** Non-shift hours already booked this week (e.g. a course). */
  extraHours?: number;
  extraNote?: string;
  /** Day indexes with approved leave. */
  leave?: number[];
}

export const NURSES: Nurse[] = [
  { name: 'Renee' },
  { name: 'Jordan', extraHours: 8, extraNote: '8h course' },
  { name: 'Sam' },
  { name: 'Morgan', leave: [4, 5, 6] },
  { name: 'Odette' },
  { name: 'Theo' },
];

// Starting week: every rule passes except Saturday night coverage (3 of 4).
export const START: Shift[][] = [
  ['D', 'D', 'O', 'O', 'O', 'O', 'O'], // Renee   24h
  ['O', 'O', 'D', 'D', 'O', 'O', 'O'], // Jordan  24h + 8h course
  ['O', 'O', 'N', 'N', 'N', 'O', 'O'], // Sam     3 nights in a row
  ['N', 'N', 'O', 'O', 'O', 'O', 'O'], // Morgan  leave Fri–Sun
  ['O', 'O', 'O', 'N', 'N', 'N', 'O'], // Odette
  ['O', 'O', 'O', 'O', 'D', 'D', 'D'], // Theo
];

/** RNs outside this six-nurse view, per day as [day, night]. Fixed in the demo. */
export const OTHERS: [number, number][] = [
  [3, 3],
  [3, 3],
  [3, 3],
  [3, 2],
  [3, 2],
  [3, 2],
  [3, 4],
];

export const RULES = [
  'At least 12h rest between shifts: a night shift can’t be followed by a day shift.',
  `No more than ${MAX_NIGHTS} nights in a row.`,
  `Overtime starts after ${OVERTIME_AFTER}h in the week (shifts are ${SHIFT_HOURS}h). Allowed, but flagged.`,
  'No shifts on approved leave.',
  `Each day and night needs ${TARGET.D} RNs on the unit.`,
];

/** A reason without its "Blocked:" prefix or final full stop, for use mid-sentence. */
export const bareReason = (reason: string) => reason.replace(/^Blocked: /, '').replace(/\.$/, '');

export const cloneWeek = (w: Shift[][]) => w.map((row) => row.slice());

export const cellKey = (r: number, c: number) => `c${r}-${c}`;
export const coverKey = (shift: 'D' | 'N', c: number) => `v${shift}-${c}`;
export const rowKey = (r: number) => `r${r}`;

export function hoursOf(week: Shift[][], r: number) {
  const shifts = week[r].filter((s) => s !== 'O').length;
  return shifts * SHIFT_HOURS + (NURSES[r].extraHours ?? 0);
}

export function coverageOf(week: Shift[][], shift: 'D' | 'N', c: number) {
  return OTHERS[c][shift === 'D' ? 0 : 1] + week.filter((row) => row[c] === shift).length;
}

export interface Issue {
  key: string;
  severity: 'block' | 'warn';
  nurse?: number;
  /** Cells / rows / coverage cells the issue is shown on. */
  marks: string[];
  /** One line for the rule summary. */
  text: string;
  /** Short plain-words reason for candidate lists and cell labels. */
  reason: string;
}

export function nurseIssues(week: Shift[][], r: number): Issue[] {
  const { name, leave = [] } = NURSES[r];
  const row = week[r];
  const out: Issue[] = [];

  for (let c = 0; c < row.length - 1; c++) {
    if (row[c] === 'N' && row[c + 1] === 'D') {
      out.push({
        key: `rest-${r}-${c}`,
        severity: 'block',
        nurse: r,
        marks: [cellKey(r, c), cellKey(r, c + 1)],
        text: `${name}: night ${DAYS[c].short} then day ${DAYS[c + 1].short} leaves under 12h rest.`,
        reason: `Blocked: under 12h rest between ${DAYS[c].short} night and ${DAYS[c + 1].short} day.`,
      });
    }
  }

  let run = 0;
  row.forEach((s, c) => {
    run = s === 'N' ? run + 1 : 0;
    if (run > MAX_NIGHTS) {
      out.push({
        key: `nights-${r}-${c}`,
        severity: 'block',
        nurse: r,
        marks: [cellKey(r, c)],
        text: `${name}: ${DAYS[c].short} is the ${run}th night in a row (max ${MAX_NIGHTS}).`,
        reason: `Blocked: ${run}th night in a row.`,
      });
    }
  });

  for (const c of leave) {
    if (row[c] !== 'O') {
      out.push({
        key: `leave-${r}-${c}`,
        severity: 'block',
        nurse: r,
        marks: [cellKey(r, c)],
        text: `${name}: scheduled on approved leave (${DAYS[c].short}).`,
        reason: 'Blocked: approved leave.',
      });
    }
  }

  const hours = hoursOf(week, r);
  if (hours > OVERTIME_AFTER) {
    out.push({
      key: `ot-${r}`,
      severity: 'warn',
      nurse: r,
      marks: [rowKey(r)],
      text: `${name}: ${hours}h this week, ${hours - OVERTIME_AFTER}h overtime.`,
      reason: `Overtime: goes to ${hours}h.`,
    });
  }
  return out;
}

export function checkWeek(week: Shift[][]): Issue[] {
  const out = NURSES.flatMap((_, r) => nurseIssues(week, r));
  for (const shift of ['D', 'N'] as const) {
    DAYS.forEach((d, c) => {
      const have = coverageOf(week, shift, c);
      if (have < TARGET[shift]) {
        const label = `${d.short} ${shift === 'D' ? 'day' : 'night'}`;
        out.push({
          key: `cover-${shift}-${c}`,
          severity: 'block',
          marks: [coverKey(shift, c)],
          text: `${label}: ${have} of ${TARGET[shift]} RNs.`,
          reason: `${TARGET[shift] - have} short of target.`,
        });
      }
    });
  }
  return out;
}

export interface Candidate {
  nurse: number;
  hoursNow: number;
  hoursAfter: number;
  blocks: Issue[];
  warns: Issue[];
}

/** The first shift of the week that is short of its target, or null when all are covered. */
export function findGap(week: Shift[][]): { day: number; shift: 'D' | 'N' } | null {
  for (let c = 0; c < DAYS.length; c++)
    for (const shift of ['D', 'N'] as const)
      if (coverageOf(week, shift, c) < TARGET[shift]) return { day: c, shift };
  return null;
}

/** Nurses free on `day`, ranked for `shift`: eligible, then eligible with overtime, then blocked. */
export function rankCandidates(
  week: Shift[][],
  day: number = OPEN_DAY,
  shift: 'D' | 'N' = OPEN_SHIFT,
): Candidate[] {
  return NURSES.flatMap((_, r) => {
    if (week[r][day] !== 'O') return [];
    const before = new Set(nurseIssues(week, r).map((i) => i.key));
    const trial = cloneWeek(week);
    trial[r][day] = shift;
    const added = nurseIssues(trial, r).filter((i) => !before.has(i.key));
    return [
      {
        nurse: r,
        hoursNow: hoursOf(week, r),
        hoursAfter: hoursOf(trial, r),
        blocks: added.filter((i) => i.severity === 'block'),
        warns: added.filter((i) => i.severity === 'warn'),
      },
    ];
  }).sort((a, b) => {
    const rank = (x: Candidate) => (x.blocks.length ? 2 : x.warns.length ? 1 : 0);
    // Blocked nurses can't be ranked against each other: they keep roster order.
    return rank(a) - rank(b) || (rank(a) < 2 ? a.hoursAfter - b.hoursAfter : 0);
  });
}
