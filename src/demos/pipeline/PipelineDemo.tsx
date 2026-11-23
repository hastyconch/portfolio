// AI-assisted program management, as a step-through diagram (constitution art. 3 + 6):
// invented project, people and tickets; every "AI output" here is a local fixture.
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import '../kit.css';
import './pipeline.css';

type Rag = 'green' | 'amber' | 'red';

const ragLabel: Record<Rag, string> = { green: 'Green', amber: 'Amber', red: 'Red' };
const ragIcon: Record<Rag, string> = { green: '●', amber: '▲', red: '■' };

function RagChip({ rag }: { rag: Rag }) {
  return (
    <span className={`pl-rag pl-rag-${rag}`}>
      <span aria-hidden="true">{ragIcon[rag]}</span> {ragLabel[rag]}
    </span>
  );
}

// People on the invented project, each with an avatar tint (white initials hold 4.5:1).
const PEOPLE: Record<string, string> = {
  Lorna: '#9a3412',
  Jonah: '#1d4ed8',
  Carmen: '#0f766e',
  Theo: '#6d28d9',
};
function Av({ who }: { who: string }) {
  return (
    <span className="dk-av" style={{ '--av': PEOPLE[who] } as CSSProperties} aria-hidden="true">
      {who[0]}
    </span>
  );
}

const transcript = [
  { who: 'Lorna', role: 'TPM', at: '09:30', line: 'Where are we on the lease-data migration?' },
  {
    who: 'Jonah',
    role: 'Backend',
    at: '09:31',
    line: 'The script is done, but it is waiting on review. Theo said he would look on Friday.',
  },
  {
    who: 'Carmen',
    role: 'Design',
    at: '09:33',
    line: 'We agreed: the tenant dashboard ships in Release 3 without the saved-search panel.',
  },
  {
    who: 'Jonah',
    role: 'Backend',
    at: '09:36',
    line: 'The payments sandbox is still flaky. It could slip the integration test.',
  },
  {
    who: 'Lorna',
    role: 'TPM',
    at: '09:41',
    line: 'Let’s lock scope at today’s list. Carmen, final specs by Thursday?',
  },
];

// Each extracted item cites the transcript line it came from (index into `transcript`).
const extracted = [
  {
    kind: 'Decisions',
    tone: 'decision',
    icon: '✓',
    items: [
      { text: 'Tenant dashboard ships without saved search.', src: 2 },
      { text: 'Release 3 scope is locked.', src: 4 },
    ],
  },
  {
    kind: 'Risks',
    tone: 'risk',
    icon: '!',
    items: [{ text: 'Flaky payments sandbox may delay integration testing.', src: 3 }],
  },
  {
    kind: 'Action items',
    tone: 'action',
    icon: '→',
    items: [
      { text: 'Theo: review the migration script (was due Friday).', src: 1, owner: 'Theo' },
      { text: 'Carmen: final tenant specs by Thursday.', src: 4, owner: 'Carmen' },
      { text: 'Jonah: raise a sandbox ticket with the payments team.', src: 3, owner: 'Jonah' },
    ],
  },
];

const workstreams: { name: string; owner: string; was: Rag; rag: Rag; note: string }[] = [
  {
    name: 'Tenant dashboard',
    owner: 'Carmen',
    was: 'green',
    rag: 'green',
    note: 'On track; scope trimmed by agreement.',
  },
  {
    name: 'Lease-data migration',
    owner: 'Theo',
    was: 'green',
    rag: 'amber',
    note: 'Review 2 days overdue; nudge sent.',
  },
  {
    name: 'Payments integration',
    owner: 'Jonah',
    was: 'amber',
    rag: 'red',
    note: 'Sandbox unstable; fallback plan agreed.',
  },
];

const followUps = [
  { who: 'Theo', task: 'Migration script review', due: '2 days overdue', overdue: true },
  { who: 'Carmen', task: 'Final tenant specs', due: 'Due Thursday', overdue: false },
  { who: 'Jonah', task: 'Sandbox ticket', due: 'Due today', overdue: false },
];

const columns = ['To do', 'In progress', 'Done'] as const;
type Column = (typeof columns)[number];
const tickets: { id: string; title: string; who: string; from: Column | 'New'; to: Column }[] = [
  { id: 'LAR-157', title: 'Payments sandbox ticket', who: 'Jonah', from: 'New', to: 'To do' },
  {
    id: 'LAR-142',
    title: 'Review migration script',
    who: 'Theo',
    from: 'To do',
    to: 'In progress',
  },
  { id: 'LAR-131', title: 'Final tenant specs', who: 'Carmen', from: 'To do', to: 'In progress' },
  {
    id: 'LAR-118',
    title: 'Drop saved search from R3',
    who: 'Lorna',
    from: 'In progress',
    to: 'Done',
  },
];

/** `uid` groups one demo's citations, so opening one closes the others (one source at a time). */
type View = { nudged: boolean; synced: boolean; uid: string };
type Step = {
  short: string;
  /** what the step produces, under its name in the rail */
  sub: string;
  title: string;
  say: string;
  /** the TPM's action that moves to the next step */
  action?: string;
  body: ReactNode | ((v: View) => ReactNode);
};

const wave = [4, 9, 6, 12, 8, 14, 10, 5, 11, 7, 13, 6, 9, 4, 10, 12, 7, 5, 9, 11, 6, 8, 12, 5];

const steps: Step[] = [
  {
    short: 'Transcript',
    sub: 'Stand-up recording',
    title: 'Meeting transcript in',
    action: 'Extract with AI',
    say: 'A stand-up transcript for Project Larch, Release 3, comes in.',
    body: (
      <div className="pl-card pl-transcript">
        <div className="pl-rec">
          <span className="pl-rec-dot" aria-hidden="true" />
          <p className="pl-meta">Stand-up · Tuesday 09:30 · Project Larch, Release 3</p>
          <svg className="pl-wave" viewBox="0 0 96 16" aria-hidden="true" focusable="false">
            {wave.map((h, i) => (
              <rect key={i} x={i * 4} y={8 - h / 2} width="2" height={h} rx="1" />
            ))}
          </svg>
          <span className="pl-meta">12 min · 4 speakers</span>
        </div>
        <ul className="pl-lines">
          {transcript.map((t, i) => (
            <li key={i}>
              <Av who={t.who} />
              <span className="pl-who">
                {t.who} <span className="pl-role">({t.role})</span>
              </span>
              <span className="pl-at">{t.at}</span>
              <span className="pl-line">{t.line}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    short: 'Extract',
    sub: 'Decisions, risks, actions',
    title: 'AI extracts decisions, risks and actions',
    action: 'Draft exec update',
    say: 'The AI pulls out 2 decisions, 1 risk and 3 action items with owners. Open any item to see the transcript line it came from.',
    body: (v: View) => (
      <>
        <ul className="pl-chips" aria-label="Extracted">
          <li className="pl-chip is-decision">2 decisions</li>
          <li className="pl-chip is-risk">1 risk</li>
          <li className="pl-chip is-action">3 action items</li>
          <li className="pl-chip">3 owners named</li>
          <li className="pl-chip">Every item cites its line</li>
        </ul>
        <div className="pl-grid3">
          {extracted.map((g) => (
            <div key={g.kind} className={`pl-card pl-xcol is-${g.tone}`}>
              <p className="pl-group">
                <span className="pl-badge" aria-hidden="true">
                  {g.icon}
                </span>
                {g.kind}
                <span className="pl-count-n">{g.items.length}</span>
              </p>
              <ul className="pl-list">
                {g.items.map((it) => (
                  <li key={it.text}>
                    <details className="pl-cite" name={`${v.uid}-cite`}>
                      <summary>{it.text}</summary>
                      <p>
                        <span className="pl-meta">
                          Source · {transcript[it.src].who}, {transcript[it.src].at}:
                        </span>{' '}
                        <q>{transcript[it.src].line}</q>
                      </p>
                    </details>
                    <span className="pl-src">
                      {'owner' in it && it.owner && <Av who={it.owner} />}
                      Line {it.src + 1}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    short: 'Status',
    sub: 'Exec update, RAG',
    title: 'Exec status update drafted',
    action: 'Approve and send',
    say: 'An executive status update is drafted: overall amber, one red workstream with a fallback plan.',
    body: (
      <div className="pl-card pl-status">
        <div className="pl-overall">
          <span className="pl-overall-t">
            <span className="pl-meta">Release 3 · overall</span>
            <RagChip rag="amber" />
          </span>
          <span className="pl-meta">To: program sponsors · ships 14 March</span>
        </div>
        <p className="pl-summary">
          On track for the 14 March release. Payments testing is at risk; a fallback plan is agreed
          and the migration review has been chased.
        </p>
        <table className="pl-table">
          <thead>
            <tr>
              <th scope="col">Workstream</th>
              <th scope="col">Last week</th>
              <th scope="col">Now</th>
              <th scope="col">Note</th>
              <th scope="col">Owner</th>
            </tr>
          </thead>
          <tbody>
            {workstreams.map((w) => (
              <tr key={w.name}>
                <th scope="row" className="pl-ws-name">
                  {w.name}
                </th>
                <td>
                  <RagChip rag={w.was} />
                </td>
                <td>
                  <RagChip rag={w.rag} />
                </td>
                <td className="pl-ws-note">{w.note}</td>
                <td className="pl-owner">
                  <Av who={w.owner} />
                  {w.owner}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    short: 'Nudge',
    sub: 'Follow-ups chased',
    title: 'Nudge engine flags a follow-up',
    action: 'Send nudge',
    say: 'The nudge engine flags Theo’s review as 2 days overdue and drafts a polite nudge for you to send.',
    body: (v: View) => (
      <div className="pl-grid2">
        <div className="pl-card">
          <p className="pl-group">Follow-ups</p>
          <ul className="pl-follow">
            {followUps.map((f) => (
              <li key={f.who} className={f.overdue ? 'is-flagged' : undefined}>
                <Av who={f.who} />
                <span className="pl-follow-t">
                  <strong>{f.who}</strong> · {f.task}
                </span>
                <span className="pl-due">
                  {f.overdue && <span aria-hidden="true">⚑ </span>}
                  {f.due}
                  {f.overdue && <span className="dk-sr"> (flagged)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pl-card pl-chat">
          <p className="pl-chat-head">
            <Av who="Theo" />
            <span>
              <strong>Theo</strong>
              <span className="pl-meta"> · direct message</span>
            </span>
          </p>
          <div className="pl-thread">
            <div className={`pl-bubble pl-out${v.nudged ? ' is-sent' : ''}`}>
              <p className="pl-meta">
                {v.nudged
                  ? 'Sent to Theo · AI-drafted, approved by the TPM'
                  : 'Draft to Theo · AI-written, waiting for TPM review'}
              </p>
              <p>
                Hi Theo, hope your week is going well! Jonah’s migration script is ready for review
                whenever you have a moment; it’s the last step before cut-over. Could you take a
                look by Wednesday? Happy to pair on it if that helps. Thanks, Lorna
              </p>
            </div>
            {v.nudged && (
              <div className="pl-bubble pl-in pl-reply">
                <span className="pl-meta">Theo replied · 4 min later</span>
                <p>On it. Reviewing this afternoon, sorry for the delay!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
  },
  {
    short: 'PM tool',
    sub: 'Tickets in sync',
    title: 'PM tool updated',
    say: 'Four tickets in the PM tool are updated to match the meeting. Release 3: delivered on time.',
    body: (v: View) => (
      <>
        <div className="pl-board">
          {columns.map((c) => {
            const here = tickets.filter((t) => (v.synced ? t.to === c : t.from === c));
            return (
              <div key={c} className="pl-col">
                <p className="pl-group">
                  {c}
                  <span className="pl-count-n">{here.length}</span>
                </p>
                <ul className="pl-tickets">
                  {here.map((t) => (
                    <li key={t.id} className={`pl-ticket${v.synced ? ' is-moved' : ''}`}>
                      <span className="pl-tid">{t.id}</span>
                      <span className="pl-ticket-t">{t.title}</span>
                      <span className="pl-ticket-foot">
                        {v.synced && (
                          <span className={`pl-moved${t.from === 'New' ? ' is-new' : ''}`}>
                            {t.from === 'New' ? 'Created by AI' : `Moved from ${t.from}`}
                          </span>
                        )}
                        <Av who={t.who} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {v.synced && (
          <p className="pl-done">
            <span className="pl-done-mark" aria-hidden="true">
              ✓
            </span>
            <span>
              <strong>Delivered on time</strong>
              <span className="pl-done-sub">
                Repeated after every stand-up until Release 3 shipped.
              </span>
            </span>
          </p>
        )}
      </>
    ),
  },
];

const LAST = steps.length - 1;
const STEP_MS = 4000;

export default function PipelineDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [moved, setMoved] = useState(false); // fade only on a real step change, not on load
  const [nudged, setNudged] = useState(false);
  const [synced, setSynced] = useState(false);
  const [say, setSay] = useState('');
  const base = useId();
  const view: View = { nudged, synced, uid: base };

  function show(i: number) {
    const n = Math.max(0, Math.min(LAST, i));
    setMoved(true);
    setStep(n);
    setSay('');
    if (n < 3) setNudged(false);
    if (n < LAST) setSynced(false);
  }

  // Autoplay is opt-in (the Play button) and never runs under reduced motion.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReady(true);
    const stop = () => mq.matches && setPlaying(false);
    mq.addEventListener('change', stop);
    return () => mq.removeEventListener('change', stop);
  }, []);

  // Arriving at the PM tool step: tickets start where they were, then sync across.
  useEffect(() => {
    if (step !== LAST || synced) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setSynced(true), reduce ? 0 : 700);
    return () => window.clearTimeout(t);
  }, [step, synced]);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      if (step === 3 && !nudged) {
        setNudged(true);
        return;
      }
      const next = Math.min(step + 1, LAST);
      show(next);
      if (next === LAST) setPlaying(false);
    }, STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, step, nudged]);

  // The primary button performs the TPM's action for this step.
  function act() {
    setPlaying(false);
    if (step === 3 && !nudged) {
      setNudged(true);
      setSay('Nudge sent to Theo. Theo replied: on it, reviewing this afternoon.');
      return;
    }
    if (step < LAST) show(step + 1);
  }

  function go(i: number) {
    setPlaying(false);
    show(i);
  }

  function togglePlay() {
    if (playing) return setPlaying(false);
    if (step === LAST) show(0);
    setPlaying(true);
  }

  const atStart = step === 0;
  const atEnd = step === LAST;
  const playLabel = playing ? 'Pause' : atEnd ? 'Replay' : 'Play';
  const actLabel = step === 3 && nudged ? 'Update PM tool' : (steps[step].action ?? 'Done');

  return (
    <div
      className="pl"
      role="group"
      aria-label="Demo: AI-assisted program pipeline (mock data)"
      data-ready={ready || undefined}
    >
      <div className="pl-inner">
        <div className="pl-project">
          <span className="pl-project-mark" aria-hidden="true">
            L
          </span>
          <span>
            <strong>Project Larch</strong>
            <span className="pl-meta">Release 3 · AI program assistant</span>
          </span>
        </div>

        <ol className="pl-track" aria-label="Pipeline steps">
          {steps.map((s, i) => (
            <li key={s.short} className={i < step ? 'is-done' : i === step ? 'is-on' : undefined}>
              <button
                type="button"
                className="pl-node"
                aria-current={i === step ? 'step' : undefined}
                aria-controls={`${base}-stage`}
                onClick={() => go(i)}
              >
                <span className="pl-num" aria-hidden="true">
                  {i < step ? '✓' : i + 1}
                </span>
                <span className="pl-short">
                  <span className="dk-sr">Step {i + 1}: </span>
                  {s.short}
                  {i < step && <span className="dk-sr"> (done)</span>}
                  <span className="pl-sub" aria-hidden="true">
                    {s.sub}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="pl-stage" id={`${base}-stage`} data-moved={moved || undefined}>
          {steps.map((s, i) => (
            <section
              key={s.short}
              className={`pl-step${i === step ? ' is-on' : ''}`}
              aria-hidden={i !== step}
              aria-labelledby={`${base}-t${i}`}
            >
              <p className="pl-head">
                <span className="pl-count">
                  Step {i + 1} of {steps.length}
                </span>
                <strong id={`${base}-t${i}`} className="pl-title">
                  {s.title}
                </strong>
              </p>
              {typeof s.body === 'function' ? s.body(view) : s.body}
            </section>
          ))}
        </div>

        <div className="pl-controls">
          <button
            type="button"
            className="pl-btn"
            aria-disabled={atStart}
            onClick={() => !atStart && go(step - 1)}
          >
            <span aria-hidden="true">←</span> Back
          </button>
          <button type="button" className="pl-btn pl-play" onClick={togglePlay}>
            <span aria-hidden="true">{playing ? '❚❚' : atEnd ? '↺' : '▶'}</span> {playLabel}
          </button>
          <button
            type="button"
            className="pl-btn pl-next"
            aria-disabled={atEnd}
            onClick={() => !atEnd && act()}
          >
            {actLabel} {!atEnd && <span aria-hidden="true">→</span>}
          </button>
        </div>

        <p className="dk-sr" aria-live="polite" aria-atomic="true" data-pl-live>
          {say || `Step ${step + 1} of ${steps.length}: ${steps[step].title}. ${steps[step].say}`}
        </p>
      </div>
    </div>
  );
}
