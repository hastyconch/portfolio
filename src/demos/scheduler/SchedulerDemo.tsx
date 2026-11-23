// Invented ICU nurse scheduler (constitution art. 3 + 6): mock staff, mock rules, no network.
// Concept A (week grid + live rule checker) with concept B (guided "fill the open shift")
// running inside it. The grid follows the ARIA grid pattern with a roving tabindex.
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  DAYS,
  NEXT_SHIFT,
  NURSES,
  OPEN_DAY,
  OTHERS,
  OPEN_SHIFT,
  OVERTIME_AFTER,
  RULES,
  SHIFT_GLYPH,
  SHIFT_WORD,
  START,
  TARGET,
  bareReason,
  checkWeek,
  cellKey,
  cloneWeek,
  coverKey,
  coverageOf,
  findGap,
  hoursOf,
  rankCandidates,
  rowKey,
  type Candidate,
  type Issue,
  type Shift,
} from './rules';
import '../kit.css';
import './scheduler.css';

const COVER_ROWS = ['D', 'N'] as const;
const ROWS = NURSES.length + COVER_ROWS.length;
const COLS = DAYS.length;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function summarise(issues: Issue[]) {
  const blocks = issues.filter((i) => i.severity === 'block').length;
  const warns = issues.length - blocks;
  if (!issues.length) return 'All rules pass.';
  return [blocks && plural(blocks, 'problem'), warns && plural(warns, 'warning')]
    .filter(Boolean)
    .join(', ')
    .concat('.');
}

function marksOf(issues: Issue[]) {
  const map = new Map<string, Issue[]>();
  for (const issue of issues)
    for (const m of issue.marks) map.set(m, [...(map.get(m) ?? []), issue]);
  return map;
}

export default function SchedulerDemo() {
  const [week, setWeek] = useState<Shift[][]>(() => cloneWeek(START));
  const [assigned, setAssigned] = useState<number | null>(null);
  const [active, setActive] = useState<[number, number]>([0, 0]);
  const [announce, setAnnounce] = useState('');
  const cells = useRef<(HTMLTableCellElement | null)[][]>([]);
  const id = useId();

  const issues = useMemo(() => checkWeek(week), [week]);
  const marks = useMemo(() => marksOf(issues), [issues]);
  const taskDone = assigned !== null;
  // The open shift: Saturday night for the guided task, then whatever gap the visitor's edits open.
  const gap = useMemo(
    () => (taskDone ? findGap(week) : { day: OPEN_DAY, shift: OPEN_SHIFT }),
    [taskDone, week],
  );
  const candidates = useMemo(
    () => (gap ? rankCandidates(week, gap.day, gap.shift) : []),
    [week, gap],
  );
  const gapWord = (g: { day: number; shift: 'D' | 'N' }, full = false) =>
    `${full ? DAYS[g.day].full : DAYS[g.day].short} ${g.shift === 'D' ? 'day' : 'night'}`;
  const gapHave = gap ? coverageOf(week, gap.shift, gap.day) : 0;
  const busy = gap ? NURSES.filter((_, r) => week[r][gap.day] !== 'O').map((n) => n.name) : [];
  const gridWrap = useRef<HTMLDivElement | null>(null);
  // Which edges of the roster have more columns past them (drives the fade and the hint).
  const [edges, setEdges] = useState<'' | 'start' | 'end' | 'both'>('');

  useEffect(() => {
    const wrap = gridWrap.current;
    if (!wrap) return;
    const update = () => {
      const max = wrap.scrollWidth - wrap.clientWidth;
      if (max <= 1) return setEdges('');
      const atStart = wrap.scrollLeft <= 1;
      const atEnd = wrap.scrollLeft >= max - 1;
      setEdges(atStart ? 'end' : atEnd ? 'start' : 'both');
    };
    update();
    wrap.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => {
      wrap.removeEventListener('scroll', update);
      removeEventListener('resize', update);
    };
  }, []);

  // On a narrow screen the grid scrolls sideways: bring the open shift's column into view.
  useEffect(() => {
    const wrap = gridWrap.current;
    if (!wrap || !gap || wrap.scrollWidth <= wrap.clientWidth) return;
    const head = wrap.querySelectorAll('thead th')[gap.day + 1] as HTMLElement | undefined;
    if (head) wrap.scrollLeft = Math.max(0, head.offsetLeft - wrap.clientWidth / 2);
  }, [gap?.day]);

  function focusCell(r: number, c: number) {
    setActive([r, c]);
    cells.current[r]?.[c]?.focus();
  }

  function nurseCellLabel(w: Shift[][], r: number, c: number, cellIssues: Issue[] = []) {
    const n = NURSES[r];
    const leave = n.leave?.includes(c) ? ', approved leave' : '';
    const probs = cellIssues.map((i) => bareReason(i.reason)).join('; ');
    return `${n.name}, ${DAYS[c].full}: ${SHIFT_WORD[w[r][c]]}${leave}.${probs ? ` Problem: ${probs}.` : ''}`;
  }

  function coverCellLabel(shift: 'D' | 'N', c: number) {
    const have = coverageOf(week, shift, c);
    const t = TARGET[shift];
    const when = `${DAYS[c].full} ${shift === 'D' ? 'day' : 'night'}`;
    // Names start with the visible text ("3/4", "3/4 open") to satisfy WCAG 2.5.3.
    const others = OTHERS[c][shift === 'D' ? 0 : 1];
    const incl = `, including ${others} RNs not shown here`;
    if (gap && shift === gap.shift && c === gap.day)
      return `${have}/${t} open shift: ${when}, ${t - have} short${incl}.`;
    const diff = have < t ? `, ${t - have} short` : have > t ? `, ${have - t} over` : '';
    // Starts with the visible text ("4/4 +3 more") to satisfy WCAG 2.5.3.
    return `${have}/${t} +${others} more: RNs on the ${when} shift${diff}${incl}.`;
  }

  function cycle(r: number, c: number) {
    if (r >= NURSES.length) return;
    if (!taskDone) {
      setAnnounce('Fill the open shift first: choose a nurse in the Open shift panel.');
      return;
    }
    const next = cloneWeek(week);
    next[r][c] = NEXT_SHIFT[next[r][c]];
    const nextIssues = checkWeek(next);
    const here = marksOf(nextIssues).get(cellKey(r, c));
    setWeek(next);
    setAnnounce(`${nurseCellLabel(next, r, c, here)} Rule check: ${summarise(nextIssues)}`);
  }

  function onCellKey(e: KeyboardEvent<HTMLTableCellElement>, r: number, c: number) {
    let [nr, nc] = [r, c];
    switch (e.key) {
      case 'ArrowRight':
        nc = Math.min(COLS - 1, c + 1);
        break;
      case 'ArrowLeft':
        nc = Math.max(0, c - 1);
        break;
      case 'ArrowDown':
        nr = Math.min(ROWS - 1, r + 1);
        break;
      case 'ArrowUp':
        nr = Math.max(0, r - 1);
        break;
      case 'Home':
        nc = 0;
        if (e.ctrlKey || e.metaKey) nr = 0;
        break;
      case 'End':
        nc = COLS - 1;
        if (e.ctrlKey || e.metaKey) nr = ROWS - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        cycle(r, c);
        return;
      default:
        return;
    }
    e.preventDefault();
    focusCell(nr, nc);
  }

  function assign(cand: Candidate) {
    if (!gap) return;
    const n = NURSES[cand.nurse];
    if (cand.blocks.length) {
      setAnnounce(
        `${n.name} can’t be assigned: ${cand.blocks.map((b) => bareReason(b.reason)).join('; ')}.`,
      );
      return;
    }
    const next = cloneWeek(week);
    next[cand.nurse][gap.day] = gap.shift;
    const nextIssues = checkWeek(next);
    const have = coverageOf(next, gap.shift, gap.day);
    setWeek(next);
    setAssigned(cand.nurse);
    setAnnounce(
      `${n.name} assigned to ${gapWord(gap, true)}: ${have} of ${TARGET[gap.shift]} RNs. ` +
        `Rule check: ${summarise(nextIssues)}` +
        (taskDone ? '' : ' The grid is now editable: Enter or Space cycles a cell.'),
    );
    focusCell(cand.nurse, gap.day);
  }

  function reset() {
    setWeek(cloneWeek(START));
    setAssigned(null);
    setActive([0, 0]);
    setAnnounce(
      `Scenario reset. ${DAYS[OPEN_DAY].full} night is open again: ${coverageOf(START, OPEN_SHIFT, OPEN_DAY)} of ${TARGET[OPEN_SHIFT]} RNs.`,
    );
  }

  const tab = (r: number, c: number) => (active[0] === r && active[1] === c ? 0 : -1);
  const ref = (r: number, c: number) => (el: HTMLTableCellElement | null) => {
    (cells.current[r] ??= [])[c] = el;
  };

  // Header figures, computed from the live week.
  const slots = DAYS.length * 2;
  const covered = DAYS.reduce(
    (n, _, c) =>
      n + (['D', 'N'] as const).filter((s) => coverageOf(week, s, c) >= TARGET[s]).length,
    0,
  );
  const overtime = NURSES.reduce(
    (n, _, r) => n + Math.max(0, hoursOf(week, r) - OVERTIME_AFTER),
    0,
  );
  const blocks = issues.filter((i) => i.severity === 'block').length;

  return (
    <div className="sch-app" role="group" aria-label="Demo: nurse scheduler (mock data)">
      <header className="sch-bar">
        <span className="sch-mark" aria-hidden="true">
          <Glyph name="cal" />
        </span>
        <div className="sch-heading">
          <p className="sch-title" id={`${id}-title`}>
            ICU, Unit C · Week roster
          </p>
          <p className="sch-sub">Mon 10 to Sun 16 March · mock data, invented staff and rules</p>
        </div>
        <dl className="sch-kpis">
          <div className={covered < slots ? 'is-bad' : 'is-ok'}>
            <dt>Covered</dt>
            <dd>
              {covered}/{slots}
            </dd>
          </div>
          <div className={overtime ? 'is-warn' : undefined}>
            <dt>Overtime</dt>
            <dd>{overtime}h</dd>
          </div>
          <div className={blocks ? 'is-bad' : 'is-ok'}>
            <dt>Problems</dt>
            <dd>{blocks}</dd>
          </div>
        </dl>
        <button type="button" className="sch-btn" onClick={reset}>
          Reset
        </button>
      </header>

      <div className="sch-body">
        <div className="sch-main">
          {edges && (
            <p className="sch-scrollhint">
              The roster scrolls sideways for the whole week
              <span aria-hidden="true"> →</span>
            </p>
          )}
          <div className="sch-gridwrap" ref={gridWrap} data-more={edges || undefined}>
            <table
              className="sch-grid"
              role="grid"
              aria-labelledby={`${id}-title`}
              aria-describedby={`${id}-help`}
              aria-readonly={taskDone ? undefined : true}
            >
              <thead>
                <tr role="row">
                  <th role="columnheader" scope="col" className="sch-corner">
                    Nurse
                  </th>
                  {DAYS.map((d, c) => (
                    <th
                      key={d.short}
                      role="columnheader"
                      scope="col"
                      className={gap && c === gap.day ? 'is-open' : undefined}
                    >
                      <span aria-hidden="true">
                        {d.short}
                        <span className="sch-date">{10 + c}</span>
                      </span>
                      <span className="sch-vh">{d.full}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NURSES.map((n, r) => {
                  const hours = hoursOf(week, r);
                  const ot = marks.get(rowKey(r));
                  return (
                    <tr role="row" key={n.name}>
                      <th role="rowheader" scope="row" className="sch-nurse">
                        <span className="dk-av" style={avatar(r)} aria-hidden="true">
                          {n.name[0]}
                        </span>
                        <span className="sch-who">
                          <span className="sch-name">{n.name}</span>
                          <span className={`sch-hours${ot ? ' is-warn' : ''}`}>
                            <span
                              className="sch-meter"
                              aria-hidden="true"
                              style={{ '--h': Math.min(hours, 48) / 48 } as CSSProperties}
                            />
                            {hours}h{ot ? ' · OT' : ''}
                            {n.extraNote && <span className="sch-extra"> incl. {n.extraNote}</span>}
                          </span>
                        </span>
                      </th>
                      {week[r].map((s, c) => {
                        const cellIssues = marks.get(cellKey(r, c));
                        const leave = n.leave?.includes(c);
                        return (
                          <td
                            key={c}
                            ref={ref(r, c)}
                            role="gridcell"
                            tabIndex={tab(r, c)}
                            aria-label={nurseCellLabel(week, r, c, cellIssues)}
                            className={`sch-cell is-${s}${cellIssues ? ' is-bad' : ''}${leave ? ' is-leave' : ''}${gap && c === gap.day ? ' in-open' : ''}`}
                            onClick={() => {
                              focusCell(r, c);
                              cycle(r, c);
                            }}
                            onKeyDown={(e) => onCellKey(e, r, c)}
                          >
                            <span className="sch-pill">
                              {s !== 'O' && <Glyph name={s === 'D' ? 'sun' : 'moon'} />}
                              <span className="sch-glyph" aria-hidden="true">
                                {SHIFT_GLYPH[s]}
                              </span>
                              {leave && (
                                <span className="sch-tag" aria-hidden="true">
                                  leave
                                </span>
                              )}
                            </span>
                            {cellIssues && (
                              <span className="sch-flag" aria-hidden="true">
                                !
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {COVER_ROWS.map((shift, i) => {
                  const r = NURSES.length + i;
                  return (
                    <tr role="row" key={shift} className={`sch-cover${i === 0 ? ' is-first' : ''}`}>
                      <th role="rowheader" scope="row" className="sch-nurse">
                        <span className="sch-cover-ico" aria-hidden="true">
                          <Glyph name={shift === 'D' ? 'sun' : 'moon'} />
                        </span>
                        <span className="sch-who">
                          <span className="sch-name">
                            {shift === 'D' ? 'Day cover' : 'Night cover'}
                          </span>
                          <span className="sch-hours">target {TARGET[shift]}</span>
                        </span>
                      </th>
                      {DAYS.map((_, c) => {
                        const have = coverageOf(week, shift, c);
                        const bad = marks.has(coverKey(shift, c));
                        const open = !!gap && shift === gap.shift && c === gap.day;
                        const others = OTHERS[c][i];
                        return (
                          <td
                            key={c}
                            ref={ref(r, c)}
                            role="gridcell"
                            aria-readonly="true"
                            tabIndex={tab(r, c)}
                            aria-label={coverCellLabel(shift, c)}
                            className={`sch-cell sch-count${bad ? ' is-bad' : ''}${open ? ' is-open' : ''}`}
                            onClick={() => focusCell(r, c)}
                            onKeyDown={(e) => onCellKey(e, r, c)}
                          >
                            <span className="sch-glyph" aria-hidden="true">
                              {have}/{TARGET[shift]}
                            </span>{' '}
                            <span className="sch-tag" aria-hidden="true">
                              {open ? 'open' : `+${others} more`}
                            </span>
                            <span className="sch-dots" aria-hidden="true">
                              {Array.from({ length: TARGET[shift] }, (_, k) => (
                                <span key={k} className={k < have ? 'is-on' : undefined} />
                              ))}
                            </span>
                            {bad && !open && (
                              <span className="sch-flag" aria-hidden="true">
                                !
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sch-foot">
            <ul className="sch-legend" aria-hidden="true">
              <li className="is-D">
                <Glyph name="sun" /> Day 07–19
              </li>
              <li className="is-N">
                <Glyph name="moon" /> Night 19–07
              </li>
              <li className="is-O">– Off</li>
              <li className="is-bad">! Rule problem</li>
            </ul>
            <p className="sch-help" id={`${id}-help`}>
              <span className="sch-vh">D day 07–19 · N night 19–07 · – off · ! rule problem. </span>
              Arrow keys move;{' '}
              {taskDone
                ? 'Enter or Space (or a click) cycles Day → Night → Off.'
                : 'cells become editable once the open shift is filled.'}{' '}
              Cover counts the whole unit: the RNs above plus colleagues not shown (“+3 more”),
              whose shifts are fixed in this demo.
            </p>
          </div>

          <div role="group" className="sch-rulebar" aria-labelledby={`${id}-rules`}>
            <h4 id={`${id}-rules`}>
              <Glyph name={issues.length ? 'alert' : 'check'} />
              Rule check
            </h4>
            <p
              className={`sch-status${blocks ? ' is-block' : issues.length ? ' is-warn' : ' is-ok'}`}
            >
              {summarise(issues)}
            </p>
            {issues.length > 0 && (
              <ul className="sch-issues">
                {issues.map((i) => (
                  <li key={i.key} className={i.severity === 'block' ? 'is-block' : 'is-warn'}>
                    <span className="sch-sev">
                      {i.severity === 'block' ? 'Problem' : 'Warning'}
                    </span>{' '}
                    {i.text}
                  </li>
                ))}
              </ul>
            )}
            <details className="sch-rules">
              <summary>Rules checked</summary>
              <ul>
                {RULES.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>

        <div role="group" className="sch-task" aria-labelledby={`${id}-task`}>
          {!gap ? (
            <div className="sch-allset">
              <span className="sch-allset-mark" aria-hidden="true">
                <Glyph name="check" />
              </span>
              <p className="sch-kicker">All shifts covered</p>
              <h4 id={`${id}-task`}>Every shift meets its target</h4>
              <p>
                Edit any cell: Enter, Space or a click cycles Day → Night → Off, and the rule check
                updates live. Take someone off a shift and this panel finds who can cover it. Reset
                restores the scenario.
              </p>
            </div>
          ) : (
            <>
              <div className="sch-task-head">
                <p className="sch-kicker">{taskDone ? 'New gap' : 'Open shift'}</p>
                <h4 id={`${id}-task`}>
                  {gapWord(gap)}, ICU: {gapHave} of {TARGET[gap.shift]} RNs
                </h4>
                <p className="sch-note">
                  Choose a nurse. Candidates are ranked by the unit’s rules.
                </p>
              </div>
              <ol className="sch-cands">
                {candidates.map((cand) => {
                  const n = NURSES[cand.nurse];
                  const blocked = cand.blocks.length > 0;
                  const reasons = [...cand.blocks, ...cand.warns].map((i) => i.reason);
                  const [lead, ...also] = reasons.length ? reasons : ['Eligible.'];
                  const why = `${id}-why-${cand.nurse}`;
                  const tone = blocked ? 'block' : cand.warns.length ? 'warn' : 'ok';
                  return (
                    <li key={n.name} className={`sch-cand is-${tone}`}>
                      <span className="dk-av" style={avatar(cand.nurse)} aria-hidden="true">
                        {n.name[0]}
                      </span>
                      <div className="sch-cand-head">
                        <strong>{n.name}</strong>
                        <span className="sch-cand-hours">
                          {cand.hoursNow}h → {cand.hoursAfter}h
                        </span>
                      </div>
                      <button
                        type="button"
                        className="sch-btn sch-assign"
                        aria-disabled={blocked || undefined}
                        aria-describedby={why}
                        onClick={() => assign(cand)}
                      >
                        {blocked ? `Can’t assign ${n.name}` : `Assign ${n.name}`}
                      </button>
                      <p className="sch-reason" id={why}>
                        <span className={`sch-lead is-${tone}`}>
                          <Glyph
                            name={tone === 'ok' ? 'check' : tone === 'warn' ? 'alert' : 'block'}
                          />
                          {lead}
                        </span>
                        {also.map((a) => (
                          <span key={a} className="sch-also">
                            {' '}
                            Also {a.charAt(0).toLowerCase() + a.slice(1)}
                          </span>
                        ))}
                      </p>
                    </li>
                  );
                })}
              </ol>
              {candidates.length > 0 && candidates.every((c) => c.blocks.length) && (
                <p className="sch-note">
                  No one can cover this without breaking a rule. Free someone up in the grid.
                </p>
              )}
              {busy.length > 0 && (
                <p className="sch-note">
                  {busy.length > 2
                    ? `${busy.slice(0, -1).join(', ')} and ${busy.at(-1)}`
                    : busy.join(' and ')}{' '}
                  already work {DAYS[gap.day].short}.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <p className="sch-vh" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

// Avatar tints, one per nurse; white initials hold 4.5:1 on each.
const TINTS = ['#6d28d9', '#0f766e', '#b45309', '#be123c', '#1d4ed8', '#4d7c0f'];
const avatar = (r: number) => ({ '--av': TINTS[r % TINTS.length] }) as CSSProperties;

const GLYPHS = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />,
  cal: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" />
    </>
  ),
  check: <path d="M5 12.5 9.5 17 19 7.5" />,
  alert: (
    <>
      <path d="M12 4 21 19.5H3z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 18 18 6" />
    </>
  ),
};

function Glyph({ name }: { name: keyof typeof GLYPHS }) {
  return (
    <svg
      className="sch-ico"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  );
}
