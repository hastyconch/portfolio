// Invented ICU nurse scheduler (constitution art. 3 + 6): mock staff, mock rules, no network.
// Concept A (week grid + live rule checker) with concept B (guided "fill the open shift")
// running inside it. The grid follows the ARIA grid pattern with a roving tabindex.
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  DAYS,
  NEXT_SHIFT,
  NURSES,
  OPEN_DAY,
  OPEN_SHIFT,
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
  hoursOf,
  rankCandidates,
  rowKey,
  type Candidate,
  type Issue,
  type Shift,
} from './rules';
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
  const candidates = useMemo(() => rankCandidates(week), [week]);
  const taskDone = assigned !== null;
  const openHave = coverageOf(week, OPEN_SHIFT, OPEN_DAY);
  const openTarget = TARGET[OPEN_SHIFT];
  const busy = NURSES.filter((_, r) => week[r][OPEN_DAY] !== 'O').map((n) => n.name);

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
    if (!taskDone && shift === OPEN_SHIFT && c === OPEN_DAY)
      return `${have}/${t} open shift: ${when}, ${t - have} short.`;
    const gap = have < t ? `, ${t - have} short` : have > t ? `, ${have - t} over` : '';
    return `${have}/${t} RNs on the ${when} shift${gap}.`;
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
    const n = NURSES[cand.nurse];
    if (cand.blocks.length) {
      setAnnounce(
        `${n.name} can’t be assigned: ${cand.blocks.map((b) => bareReason(b.reason)).join('; ')}.`,
      );
      return;
    }
    const next = cloneWeek(week);
    next[cand.nurse][OPEN_DAY] = OPEN_SHIFT;
    const nextIssues = checkWeek(next);
    const have = coverageOf(next, OPEN_SHIFT, OPEN_DAY);
    setWeek(next);
    setAssigned(cand.nurse);
    setAnnounce(
      `${n.name} assigned to ${DAYS[OPEN_DAY].full} night. ${DAYS[OPEN_DAY].full} night: ${have} of ${openTarget} RNs. ` +
        `Rule check: ${summarise(nextIssues)} The grid is now editable: Enter or Space cycles a cell.`,
    );
    focusCell(cand.nurse, OPEN_DAY);
  }

  function reset() {
    setWeek(cloneWeek(START));
    setAssigned(null);
    setActive([0, 0]);
    setAnnounce(
      `Scenario reset. ${DAYS[OPEN_DAY].full} night is open again: ${coverageOf(START, OPEN_SHIFT, OPEN_DAY)} of ${openTarget} RNs.`,
    );
  }

  const tab = (r: number, c: number) => (active[0] === r && active[1] === c ? 0 : -1);
  const ref = (r: number, c: number) => (el: HTMLTableCellElement | null) => {
    (cells.current[r] ??= [])[c] = el;
  };

  return (
    <div className="sch-app" role="group" aria-label="Demo: nurse scheduler (mock data)">
      <header className="sch-bar">
        <div>
          <p className="sch-title" id={`${id}-title`}>
            ICU, Unit C · Week roster
          </p>
          <p className="sch-sub">Mock data · invented staff and rules</p>
        </div>
        <button type="button" className="sch-btn" onClick={reset}>
          Reset
        </button>
      </header>

      <div className="sch-body">
        <div className="sch-main">
          <div className="sch-gridwrap">
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
                      className={!taskDone && c === OPEN_DAY ? 'is-open' : undefined}
                    >
                      <span aria-hidden="true">{d.short}</span>
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
                        <span className="sch-name">{n.name}</span>
                        <span className={`sch-hours${ot ? ' is-warn' : ''}`}>
                          {hours}h{ot ? ' · OT' : ''}
                          {n.extraNote && <span className="sch-extra"> incl. {n.extraNote}</span>}
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
                            className={`sch-cell is-${s}${cellIssues ? ' is-bad' : ''}`}
                            onClick={() => {
                              focusCell(r, c);
                              cycle(r, c);
                            }}
                            onKeyDown={(e) => onCellKey(e, r, c)}
                          >
                            <span className="sch-glyph" aria-hidden="true">
                              {SHIFT_GLYPH[s]}
                            </span>
                            {leave && (
                              <span className="sch-tag" aria-hidden="true">
                                leave
                              </span>
                            )}
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
                        <span className="sch-name">
                          {shift === 'D' ? 'Day cover' : 'Night cover'}
                        </span>
                        <span className="sch-hours">target {TARGET[shift]}</span>
                      </th>
                      {DAYS.map((_, c) => {
                        const have = coverageOf(week, shift, c);
                        const bad = marks.has(coverKey(shift, c));
                        const open = !taskDone && shift === OPEN_SHIFT && c === OPEN_DAY;
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
                            </span>
                            {open && ' '}
                            {open && (
                              <span className="sch-tag" aria-hidden="true">
                                open
                              </span>
                            )}
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
          <p className="sch-help" id={`${id}-help`}>
            D day 07–19 · N night 19–07 · – off · ! rule problem. Arrow keys move;{' '}
            {taskDone
              ? 'Enter or Space (or a click) cycles Day → Night → Off.'
              : 'cells unlock once the open shift is filled.'}{' '}
            Coverage counts the whole unit: these six RNs plus colleagues whose shifts are fixed in
            this demo.
          </p>
        </div>

        <div className="sch-side">
          <section className="sch-panel sch-task" aria-labelledby={`${id}-task`}>
            {assigned !== null ? (
              <>
                <p className="sch-kicker">Shift covered</p>
                <h4 id={`${id}-task`}>
                  {NURSES[assigned].name} works {DAYS[OPEN_DAY].short} night
                </h4>
                <p>
                  {DAYS[OPEN_DAY].short} night: {openHave} of {openTarget} RNs. Now edit any cell:
                  Enter, Space or a click cycles Day → Night → Off, and the rule check updates live.
                  Reset restores the scenario.
                </p>
              </>
            ) : (
              <>
                <p className="sch-kicker">Open shift</p>
                <h4 id={`${id}-task`}>
                  {DAYS[OPEN_DAY].short} night, ICU — {openHave} of {openTarget} RNs
                </h4>
                <p>Choose a nurse. Candidates are ranked by the unit’s rules.</p>
                <ol className="sch-cands">
                  {candidates.map((cand) => {
                    const n = NURSES[cand.nurse];
                    const blocked = cand.blocks.length > 0;
                    const reasons = [...cand.blocks, ...cand.warns].map((i) => i.reason);
                    const [lead, ...also] = reasons.length ? reasons : ['Eligible.'];
                    const why = `${id}-why-${cand.nurse}`;
                    return (
                      <li key={n.name} className={`sch-cand${blocked ? ' is-blocked' : ''}`}>
                        <div className="sch-cand-head">
                          <strong>{n.name}</strong>
                          <span className="sch-cand-hours">
                            {cand.hoursNow}h → {cand.hoursAfter}h
                          </span>
                        </div>
                        <p className="sch-reason" id={why}>
                          <span
                            className={`sch-lead${blocked ? ' is-block' : cand.warns.length ? ' is-warn' : ' is-ok'}`}
                          >
                            {lead}
                          </span>
                          {also.map((a) => (
                            <span key={a} className="sch-also">
                              {' '}
                              Also {a.charAt(0).toLowerCase() + a.slice(1)}
                            </span>
                          ))}
                        </p>
                        <button
                          type="button"
                          className="sch-btn sch-assign"
                          aria-disabled={blocked || undefined}
                          aria-describedby={why}
                          onClick={() => assign(cand)}
                        >
                          {blocked ? `Can’t assign ${n.name}` : `Assign ${n.name}`}
                        </button>
                      </li>
                    );
                  })}
                </ol>
                {busy.length > 0 && (
                  <p className="sch-note">
                    {busy.join(' and ')} already work {DAYS[OPEN_DAY].short}.
                  </p>
                )}
              </>
            )}
          </section>

          <section className="sch-panel" aria-labelledby={`${id}-rules`}>
            <h4 id={`${id}-rules`}>Rule check</h4>
            <p className="sch-status">{summarise(issues)}</p>
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
          </section>
        </div>
      </div>

      <p className="sch-vh" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
