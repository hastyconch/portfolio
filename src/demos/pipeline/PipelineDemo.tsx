// AI-assisted program management, as a step-through diagram (constitution art. 3 + 6):
// invented project, people and tickets; every "AI output" here is a local fixture.
import { useEffect, useId, useState, type ReactNode } from 'react';
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

const transcript = [
  { who: 'Maya', role: 'TPM', line: 'Where are we on the lease-data migration?' },
  {
    who: 'Jonah',
    role: 'Backend',
    line: 'The script is done, but it is waiting on review. Theo said he would look on Friday.',
  },
  {
    who: 'Ines',
    role: 'Design',
    line: 'We agreed: the tenant dashboard ships in Release 3 without the saved-search panel.',
  },
  {
    who: 'Jonah',
    role: 'Backend',
    line: 'The payments sandbox is still flaky. It could slip the integration test.',
  },
  {
    who: 'Maya',
    role: 'TPM',
    line: 'Let’s lock scope at today’s list. Ines, final specs by Thursday?',
  },
];

// Each extracted item cites the transcript line it came from (index into `transcript`).
const extracted = [
  {
    kind: 'Decisions',
    icon: '✓',
    items: [
      { text: 'Tenant dashboard ships without saved search.', src: 2 },
      { text: 'Release 3 scope is locked.', src: 4 },
    ],
  },
  {
    kind: 'Risks',
    icon: '!',
    items: [{ text: 'Flaky payments sandbox may delay integration testing.', src: 3 }],
  },
  {
    kind: 'Action items',
    icon: '→',
    items: [
      { text: 'Theo: review the migration script (was due Friday).', src: 1 },
      { text: 'Ines: final tenant specs by Thursday.', src: 4 },
      { text: 'Jonah: raise a sandbox ticket with the payments team.', src: 3 },
    ],
  },
];

const workstreams: { name: string; rag: Rag; note: string }[] = [
  { name: 'Tenant dashboard', rag: 'green', note: 'On track; scope trimmed by agreement.' },
  { name: 'Lease-data migration', rag: 'amber', note: 'Review 2 days overdue; nudge sent.' },
  { name: 'Payments integration', rag: 'red', note: 'Sandbox unstable; fallback plan agreed.' },
];

const followUps = [
  { who: 'Theo', task: 'Migration script review', due: '2 days overdue', overdue: true },
  { who: 'Ines', task: 'Final tenant specs', due: 'Due Thursday', overdue: false },
  { who: 'Jonah', task: 'Sandbox ticket', due: 'Due today', overdue: false },
];

const columns = ['To do', 'In progress', 'Done'] as const;
type Column = (typeof columns)[number];
const tickets: { id: string; title: string; from: Column | 'New'; to: Column }[] = [
  { id: 'LAR-157', title: 'Payments sandbox ticket', from: 'New', to: 'To do' },
  { id: 'LAR-142', title: 'Review migration script', from: 'To do', to: 'In progress' },
  { id: 'LAR-131', title: 'Final tenant specs', from: 'To do', to: 'In progress' },
  { id: 'LAR-118', title: 'Drop saved search from R3', from: 'In progress', to: 'Done' },
];

type View = { nudged: boolean; synced: boolean };
type Step = {
  short: string;
  title: string;
  say: string;
  /** the TPM's action that moves to the next step */
  action?: string;
  body: ReactNode | ((v: View) => ReactNode);
};

const steps: Step[] = [
  {
    short: 'Transcript',
    title: 'Meeting transcript in',
    action: 'Extract with AI',
    say: 'A stand-up transcript for Project Larch, Release 3, comes in.',
    body: (
      <div className="pl-card pl-transcript">
        <p className="pl-meta">Stand-up · Tuesday 09:30 · Project Larch, Release 3</p>
        <ul className="pl-lines">
          {transcript.map((t, i) => (
            <li key={i}>
              <span className="pl-who">
                {t.who} <span className="pl-role">({t.role})</span>
              </span>
              <span>{t.line}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    short: 'Extract',
    title: 'AI extracts decisions, risks and actions',
    action: 'Draft exec update',
    say: 'The AI pulls out 2 decisions, 1 risk and 3 action items with owners. Open any item to see the transcript line it came from.',
    body: (
      <div className="pl-grid3">
        {extracted.map((g) => (
          <div key={g.kind} className="pl-card">
            <p className="pl-group">
              <span className="pl-badge" aria-hidden="true">
                {g.icon}
              </span>
              {g.kind}
            </p>
            <ul className="pl-list">
              {g.items.map((it) => (
                <li key={it.text}>
                  <details className="pl-cite">
                    <summary>{it.text}</summary>
                    <p>
                      <span className="pl-meta">Source · {transcript[it.src].who}:</span>{' '}
                      <q>{transcript[it.src].line}</q>
                    </p>
                  </details>
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
    title: 'Exec status update drafted',
    action: 'Approve and send',
    say: 'An executive status update is drafted: overall amber, one red workstream with a fallback plan.',
    body: (
      <div className="pl-card">
        <div className="pl-overall">
          <span className="pl-meta">Release 3 · overall</span>
          <RagChip rag="amber" />
        </div>
        <p className="pl-summary">
          On track for the 14 March release. Payments testing is at risk; a fallback plan is agreed
          and the migration review has been chased.
        </p>
        <ul className="pl-ws">
          {workstreams.map((w) => (
            <li key={w.name}>
              <span className="pl-ws-name">{w.name}</span>
              <RagChip rag={w.rag} />
              <span className="pl-ws-note">{w.note}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    short: 'Nudge',
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
                <span>
                  <strong>{f.who}</strong> · {f.task}
                </span>
                <span className="pl-due">
                  {f.overdue && <span aria-hidden="true">⚑ </span>}
                  {f.due}
                  {f.overdue && <span className="pl-sr"> (flagged)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pl-card pl-draft">
          <p className="pl-meta">
            {v.nudged
              ? 'Sent to Theo · AI-drafted, approved by the TPM'
              : 'Draft to Theo · AI-written, waiting for TPM review'}
          </p>
          <p>
            Hi Theo, hope your week is going well! Jonah’s migration script is ready for review
            whenever you have a moment; it’s the last step before cut-over. Could you take a look by
            Wednesday? Happy to pair on it if that helps. Thanks, Maya
          </p>
          {v.nudged && (
            <p className="pl-reply">
              <span className="pl-meta">Theo replied · 4 min later</span>
              On it. Reviewing this afternoon, sorry for the delay!
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    short: 'PM tool',
    title: 'PM tool updated',
    say: 'Four tickets in the PM tool are updated to match the meeting. Release 3: delivered on time.',
    body: (v: View) => (
      <>
        <div className="pl-board">
          {columns.map((c) => (
            <div key={c} className="pl-col">
              <p className="pl-group">{c}</p>
              <ul className="pl-tickets">
                {tickets
                  .filter((t) => (v.synced ? t.to === c : t.from === c))
                  .map((t) => (
                    <li key={t.id} className={`pl-ticket${v.synced ? ' is-moved' : ''}`}>
                      <span className="pl-tid">{t.id}</span>
                      <span>{t.title}</span>
                      {v.synced && (
                        <span className="pl-moved">
                          {t.from === 'New' ? 'Created by AI' : `Moved from ${t.from}`}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
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
  const view: View = { nudged, synced };

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
                  <span className="pl-sr">Step {i + 1}: </span>
                  {s.short}
                  {i < step && <span className="pl-sr"> (done)</span>}
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

        <p className="pl-sr" aria-live="polite" aria-atomic="true" data-pl-live>
          {say || `Step ${step + 1} of ${steps.length}: ${steps[step].title}. ${steps[step].say}`}
        </p>
      </div>
    </div>
  );
}
