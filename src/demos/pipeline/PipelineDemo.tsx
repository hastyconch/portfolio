// AI-assisted program management, as a step-through pipeline (constitution art. 3 + 6):
// invented project, people and tickets; every "AI output" here is a local fixture.
// Direction B, "Instrument" (graphite in dark, its light equivalent on paper white): the rail is
// the overview, each stage with its output count; the stage is the detail. Rows follow the data's
// flow (transcript, extracted items, outputs), numbers are tabular, one electric-blue accent, and
// red, amber and green appear only where a threshold exists (RAG, overdue).
import { useEffect, useId, useState, type ReactNode } from 'react';
import '../kit.css';
import './pipeline.css';

type Rag = 'green' | 'amber' | 'red';

const ragLabel: Record<Rag, string> = { green: 'Green', amber: 'Amber', red: 'Red' };
// Each RAG level has its own shape too, so it never rests on colour alone.
const ragShape: Record<Rag, ReactNode> = {
  green: <circle cx="5" cy="5" r="4" />,
  amber: <path d="M5 1 9.2 8.6H.8z" />,
  red: <rect x="1.25" y="1.25" width="7.5" height="7.5" rx="1" />,
};

function RagChip({ rag }: { rag: Rag }) {
  return (
    <span className={`pl-rag pl-rag-${rag}`}>
      <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false">
        {ragShape[rag]}
      </svg>
      {ragLabel[rag]}
    </span>
  );
}

const ICONS = {
  check: <path d="M5 12.5 9.5 17 19 7.5" />,
  alert: (
    <>
      <path d="M12 4 21 19.5H3z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  flag: <path d="M6 21V4m0 0h11l-2 4 2 4H6" />,
  play: <path d="M8 5.5v13l10-6.5z" />,
  pause: <path d="M9 5.5v13M15 5.5v13" />,
  replay: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />,
  quote: <path d="M5 7h14M5 12h14M5 17h8" />,
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      className="pl-svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
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
    icon: 'check',
    items: [
      { text: 'Tenant dashboard ships without saved search.', src: 2 },
      { text: 'Release 3 scope is locked.', src: 4 },
    ],
  },
  {
    kind: 'Risks',
    icon: 'alert',
    items: [{ text: 'Flaky payments sandbox may delay integration testing.', src: 3 }],
  },
  {
    kind: 'Action items',
    icon: 'arrow',
    items: [
      { text: 'Theo: review the migration script (was due Friday).', src: 1, owner: 'Theo' },
      { text: 'Carmen: final tenant specs by Thursday.', src: 4, owner: 'Carmen' },
      { text: 'Jonah: raise a sandbox ticket with the payments team.', src: 3, owner: 'Jonah' },
    ],
  },
] as const;

// `src` is the transcript line (index) each output traces back to, as in the extraction step.
const workstreams: {
  name: string;
  owner: string;
  was: Rag;
  rag: Rag;
  note: string;
  src: number;
}[] = [
  {
    name: 'Tenant dashboard',
    owner: 'Carmen',
    was: 'green',
    rag: 'green',
    note: 'On track; scope trimmed by agreement.',
    src: 2,
  },
  {
    name: 'Lease-data migration',
    owner: 'Theo',
    was: 'green',
    rag: 'amber',
    note: 'Review 2 days overdue; nudge drafted.',
    src: 1,
  },
  {
    name: 'Payments integration',
    owner: 'Jonah',
    was: 'amber',
    rag: 'red',
    note: 'Sandbox unstable; fallback plan agreed.',
    src: 3,
  },
];

const followUps = [
  { who: 'Theo', task: 'Migration script review', due: '2 days overdue', overdue: true, src: 1 },
  { who: 'Carmen', task: 'Final tenant specs', due: 'Due Thursday', overdue: false, src: 4 },
  { who: 'Jonah', task: 'Sandbox ticket', due: 'Due today', overdue: false, src: 3 },
];

const columns = ['To do', 'In progress', 'Done'] as const;
type Column = (typeof columns)[number];
type Ticket = { id: string; title: string; who: string; from: Column | 'New'; to: Column };
const tickets: (Ticket & { src: number })[] = [
  {
    id: 'LAR-157',
    title: 'Payments sandbox ticket',
    who: 'Jonah',
    from: 'New',
    to: 'To do',
    src: 3,
  },
  {
    id: 'LAR-142',
    title: 'Review migration script',
    who: 'Theo',
    from: 'To do',
    to: 'In progress',
    src: 1,
  },
  {
    id: 'LAR-131',
    title: 'Final tenant specs',
    who: 'Carmen',
    from: 'To do',
    to: 'In progress',
    src: 4,
  },
  {
    id: 'LAR-118',
    title: 'Drop saved search from R3',
    who: 'Lorna',
    from: 'In progress',
    to: 'Done',
    src: 2,
  },
];

/** A transcript line reference, in the same form everywhere. */
function Cite({ src }: { src: number }) {
  return <span className="pl-ref">line {src + 1}</span>;
}

/** `uid` groups one demo's citations, so opening one closes the others (one source at a time). */
type View = { nudged: boolean; synced: boolean; uid: string };
type Step = {
  short: string;
  /** what the step produces, under its name in the rail: the overview's readout */
  sub: string;
  title: string;
  say: string;
  /** the TPM's action that moves to the next step */
  action?: string;
  body: ReactNode | ((v: View) => ReactNode);
};

const itemCount = extracted.reduce((n, g) => n + g.items.length, 0);

const steps: Step[] = [
  {
    short: 'Transcript',
    sub: '5 lines · 12 min',
    title: 'Meeting transcript in',
    action: 'Extract with AI',
    say: 'A stand-up transcript for Project Larch, Release 3, comes in.',
    body: (
      <div className="pl-panel pl-transcript">
        <p className="pl-panel-head">
          <span>Stand-up recording</span>
          <span className="pl-meta">Tue 09:30 · 12 min · 4 speakers</span>
        </p>
        <ol className="pl-lines">
          {transcript.map((t, i) => (
            <li key={i}>
              <span className="pl-ln">
                <span className="dk-sr">Line </span>
                {i + 1}
              </span>
              <span className="pl-at">{t.at}</span>
              <span className="pl-who">
                {t.who} <span className="pl-role">{t.role}</span>
              </span>
              <span className="pl-line">{t.line}</span>
            </li>
          ))}
        </ol>
      </div>
    ),
  },
  {
    short: 'Extract',
    sub: `${itemCount} items, each cited`,
    title: 'AI extracts decisions, risks and actions',
    action: 'Draft exec update',
    say: 'The AI pulls out 2 decisions, 1 risk and 3 action items with owners. Open any item to see the transcript line it came from.',
    body: (v: View) => (
      <div className="pl-panel pl-extract">
        <p className="pl-panel-head">
          <span>
            {itemCount} items from {transcript.length} lines
          </span>
          <span className="pl-meta">Open an item to see the line it came from</span>
        </p>
        {extracted.map((g) => (
          <div key={g.kind} className="pl-kind">
            <p className="pl-kind-h">
              <Icon name={g.icon} />
              {g.kind}
              <span className="pl-n">{g.items.length}</span>
            </p>
            <ul className="pl-items">
              {g.items.map((it) => (
                <li key={it.text}>
                  <details className="pl-cite" name={`${v.uid}-cite`}>
                    <summary>
                      <svg
                        className="pl-chev"
                        viewBox="0 0 16 16"
                        width="12"
                        height="12"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M6 3.5 10.5 8 6 12.5" />
                      </svg>
                      {it.text}
                    </summary>
                    <p className="pl-quote">
                      <span className="pl-meta">
                        Source · line {it.src + 1}, {transcript[it.src].who},{' '}
                        {transcript[it.src].at}:
                      </span>{' '}
                      <q>{transcript[it.src].line}</q>
                    </p>
                  </details>
                  <span className="pl-src">
                    {'owner' in it && <span className="pl-src-owner">{it.owner}</span>}
                    <Cite src={it.src} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  },
  {
    short: 'Status',
    sub: 'Overall amber',
    title: 'Exec status update drafted',
    action: 'Approve and send',
    say: 'An executive status update is drafted: overall amber, one red workstream with a fallback plan.',
    body: (
      <div className="pl-panel pl-status">
        <dl className="pl-fields">
          <div>
            <dt>Overall</dt>
            <dd>
              <RagChip rag="amber" />
            </dd>
          </div>
          <div>
            <dt>To</dt>
            <dd>Program sponsors</dd>
          </div>
          <div>
            <dt>Release 3 ships</dt>
            <dd>14 March</dd>
          </div>
        </dl>
        <p className="pl-summary">
          The 14 March date holds. Payments testing is at risk, with a fallback plan agreed, and the
          overdue migration review is being chased.
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
                <td className="pl-ws-note">
                  {w.note} <Cite src={w.src} />
                </td>
                <td className="pl-owner">{w.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    short: 'Nudge',
    sub: '1 of 3 overdue',
    title: 'Nudge engine flags a follow-up',
    action: 'Send nudge',
    say: 'The nudge engine flags Theo’s review as 2 days overdue and drafts a polite nudge for you to send.',
    body: (v: View) => (
      <div className="pl-grid2">
        <div className="pl-panel">
          <p className="pl-panel-head">
            <span>Follow-ups</span>
            <span className="pl-meta">3 open</span>
          </p>
          <ul className="pl-follow">
            {followUps.map((f) => {
              const flagged = f.overdue && !v.nudged;
              return (
                <li key={f.who} className={flagged ? 'is-flagged' : undefined}>
                  <span className="pl-follow-t">
                    <strong>{f.who}</strong>
                    <span>
                      {f.task} · <Cite src={f.src} />
                    </span>
                  </span>
                  <span className="pl-due">
                    {flagged && <Icon name="flag" />}
                    {f.overdue && v.nudged ? 'Nudged · replied' : f.due}
                    {flagged && <span className="dk-sr"> (flagged)</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="pl-panel pl-chat">
          <p className="pl-panel-head">
            <span>Direct message</span>
            <span className="pl-meta">Lorna to Theo</span>
          </p>
          <div className="pl-thread">
            <div className={`pl-msg pl-out${v.nudged ? ' is-sent' : ''}`}>
              <p className="pl-meta">
                {v.nudged
                  ? 'Sent to Theo · AI-drafted, approved by the TPM'
                  : 'Draft to Theo · AI-written, waiting for TPM review'}
              </p>
              <p>
                Hi Theo, the migration script review (LAR-142) is 2 days past Friday and it’s the
                last step before cut-over. Could you review it by Wednesday? Happy to pair if that
                helps. Thanks, Lorna
              </p>
            </div>
            {v.nudged && (
              <div className="pl-msg pl-in pl-reply">
                <span className="pl-meta">Theo replied · 4 min later</span>
                <p>On it. Reviewing this afternoon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
  },
  {
    short: 'PM tool',
    sub: '4 tickets synced',
    title: 'PM tool updated',
    say: 'Four tickets in the PM tool are updated to match the meeting. Release 3: delivered on time.',
    body: (v: View) => (
      <>
        <div className="pl-panel pl-board">
          {columns.map((c) => {
            const here = tickets.filter((t) => (v.synced ? t.to === c : t.from === c));
            return (
              <div key={c} className="pl-col">
                <p className="pl-col-h">
                  {c}
                  <span className="pl-n">{here.length}</span>
                </p>
                <ul className="pl-tickets">
                  {here.map((t) => (
                    <li key={t.id} className={`pl-ticket${v.synced ? ' is-moved' : ''}`}>
                      <span className="pl-ticket-top">
                        <span className="pl-tid">{t.id}</span>
                        <span className="pl-meta">{t.who}</span>
                      </span>
                      <span className="pl-ticket-t">{t.title}</span>
                      {v.synced && (
                        <span className={`pl-moved${t.from === 'New' ? ' is-new' : ''}`}>
                          {t.from === 'New' ? 'Created by AI' : `Moved from ${t.from}`} ·{' '}
                          <Cite src={t.src} />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {v.synced && (
          <p className="pl-done">
            <Icon name="check" />
            <strong>Delivered on time</strong>
            <span className="pl-done-sub">
              Repeated after every stand-up until Release 3 shipped.
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
          <strong>Project Larch</strong>
          <span className="pl-meta">Release 3 · AI program assistant</span>
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
                  {i < step ? <Icon name="check" /> : i + 1}
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
            <div
              role="group"
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
            </div>
          ))}
        </div>

        <div className="pl-controls">
          <button
            type="button"
            className="pl-btn"
            aria-disabled={atStart}
            onClick={() => !atStart && go(step - 1)}
          >
            {/* The space sits inside the hidden arrow, so the name is exactly "Back". */}
            <span aria-hidden="true">← </span>Back
          </button>
          <button type="button" className="pl-btn pl-toggle" onClick={togglePlay}>
            <Icon name={playing ? 'pause' : atEnd ? 'replay' : 'play'} /> {playLabel}
          </button>
          <button
            type="button"
            className="pl-btn pl-next"
            aria-disabled={atEnd}
            onClick={() => !atEnd && act()}
          >
            {actLabel}
          </button>
        </div>

        <p className="dk-sr" aria-live="polite" aria-atomic="true" data-pl-live>
          {say || `Step ${step + 1} of ${steps.length}: ${steps[step].title}. ${steps[step].say}`}
        </p>
      </div>
    </div>
  );
}
