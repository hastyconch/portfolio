// Anonymized airline-loyalty member app (constitution art. 3 + 6): invented brand, mocked data.
// Directions place this inside their own phone frame; they don't restyle its internals.
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Barcode, Icon, SceneArt, type IconName, type Scene } from './art';
import '../kit.css';
import './airline.css';

type Tab = 'home' | 'status' | 'redeem';

const member = {
  first: 'Alex',
  name: 'Alex Moreau',
  number: '•••• 4821',
  since: 2021,
  points: 48_250,
  tier: 'Gold',
  next: 'Platinum',
  sqm: 65_400,
};

type Tier = { name: string; at: number; perks: { icon: IconName; label: string }[] };
const tiers: Tier[] = [
  {
    name: 'Silver',
    at: 25_000,
    perks: [
      { icon: 'checkin', label: 'Priority check-in' },
      { icon: 'bag', label: '1 free checked bag' },
    ],
  },
  {
    name: 'Gold',
    at: 50_000,
    perks: [
      { icon: 'lounge', label: 'Lounge access' },
      { icon: 'boarding', label: 'Priority boarding' },
      { icon: 'bag', label: '2 free checked bags' },
    ],
  },
  {
    name: 'Platinum',
    at: 75_000,
    perks: [
      { icon: 'upgrade', label: 'Complimentary upgrades' },
      { icon: 'support', label: 'Dedicated support line' },
      { icon: 'globe', label: 'Partner lounge access' },
    ],
  },
];
const gold = tiers[1];
const platinum = tiers[2];
const toNext = platinum.at - member.sqm;
const segment = (member.sqm - gold.at) / (platinum.at - gold.at);
const overall = member.sqm / platinum.at;

type Flight = {
  id: string;
  from: string;
  to: string;
  city: string;
  date: string;
  points: number;
  cash: number;
  fare: number;
  scene: Scene;
  flight: string;
};
const flights: Flight[] = [
  {
    id: 'f1',
    from: 'YYZ',
    to: 'LIS',
    city: 'Lisbon',
    date: 'Mar 14',
    points: 35_000,
    cash: 89,
    fare: 612,
    scene: 'lisbon',
    flight: 'SK 238',
  },
  {
    id: 'f2',
    from: 'YYZ',
    to: 'YVR',
    city: 'Vancouver',
    date: 'Feb 02',
    points: 15_000,
    cash: 42,
    fare: 318,
    scene: 'vancouver',
    flight: 'SK 115',
  },
  {
    id: 'f3',
    from: 'YYZ',
    to: 'NRT',
    city: 'Tokyo',
    date: 'Apr 21',
    points: 75_000,
    cash: 120,
    fare: 1_240,
    scene: 'tokyo',
    flight: 'SK 9',
  },
  {
    id: 'f4',
    from: 'YYZ',
    to: 'CUN',
    city: 'Cancún',
    date: 'Jan 18',
    points: 25_000,
    cash: 64,
    fare: 486,
    scene: 'cancun',
    flight: 'SK 470',
  },
];

// The trip already on the member's account; a reward booking joins it.
const trip = {
  from: 'YYZ',
  to: 'YUL',
  fromCity: 'Toronto',
  toCity: 'Montréal',
  date: 'Fri Jan 10',
  flight: 'SK 412',
  seat: '3A',
  boards: '07:15',
};

const fmt = (n: number) => n.toLocaleString('en-CA');
const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts up to `to` once, on the first view only; static under reduced motion. */
function useCountUp(to: number, run: boolean) {
  const [n, setN] = useState(to);
  useEffect(() => {
    if (!run || reduced()) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);
  return run ? n : to;
}

function Logo() {
  return (
    <svg className="sky-logo" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <path d="M3 18c6-1 13-5 19-13 0 9-6 16-15 16-1.6 0-3-.9-4-3z" fill="#ff8a5c" />
      <path d="M6 22c5 0 10-2 14-6-2 5-6 8-12 8-.8 0-1.5-.8-2-2z" fill="#f2c96b" />
    </svg>
  );
}

export default function AirlineDemo() {
  const [tab, setTab] = useState<Tab>('home');
  const [booked, setBooked] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [balance, setBalance] = useState(member.points);
  const [pass, setPass] = useState(false);
  const [counted, setCounted] = useState(false);
  const [announce, setAnnounce] = useState('');
  const base = useId();
  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'home', label: 'Home', icon: 'card' },
    { id: 'status', label: 'Status', icon: 'star' },
    { id: 'redeem', label: 'Redeem', icon: 'plane' },
  ];
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({
    home: null,
    status: null,
    redeem: null,
  });
  const panel = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const bookedRef = useRef<HTMLSpanElement>(null);

  // The balance counts up the first time Home is seen, then never again.
  const shown = useCountUp(balance, tab === 'home' && !counted);
  useEffect(() => {
    if (tab !== 'home' || counted) return;
    const t = window.setTimeout(() => setCounted(true), 950);
    return () => window.clearTimeout(t);
  }, [tab, counted]);

  useEffect(() => {
    panel.current?.scrollTo?.({ top: 0 });
  }, [tab]);

  useEffect(() => {
    if (sheet) sheetRef.current?.querySelector<HTMLElement>('h2')?.focus();
  }, [sheet]);

  function go(next: Tab) {
    if (tab === 'home') setCounted(true);
    setTab(next);
  }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = tabs[(i + dir + tabs.length) % tabs.length].id;
    go(next);
    refs.current[next]?.focus();
  }

  function redeem(id: string) {
    const f = flights.find((x) => x.id === id);
    if (!f || f.points > balance) return;
    setBalance((b) => b - f.points);
    setBooked(id);
    setSheet(id);
    setAnnounce(
      `Booked ${f.city} for ${fmt(f.points)} points. ${fmt(balance - f.points)} points remaining.`,
    );
  }

  function closeSheet() {
    setSheet(null);
    requestAnimationFrame(() => bookedRef.current?.focus());
  }

  function onSheetKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSheet();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = sheetRef.current?.querySelectorAll<HTMLElement>('button');
    if (!items?.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const bookedFlight = flights.find((f) => f.id === booked);
  const sheetFlight = flights.find((f) => f.id === sheet);
  const next = bookedFlight
    ? {
        from: bookedFlight.from,
        to: bookedFlight.to,
        fromCity: 'Toronto',
        toCity: bookedFlight.city,
        date: bookedFlight.date,
        flight: bookedFlight.flight,
        seat: 'Pick',
        boards: '18:40',
        reward: true,
      }
    : { ...trip, reward: false };

  return (
    <div className="sky-app" aria-label="Demo: airline loyalty app (mock data)" role="group">
      <header className="sky-top">
        <Logo />
        <span className="sky-brand">Skyward</span>
        <span className="sky-brand-sub">Rewards</span>
        <span className="dk-av sky-me" aria-hidden="true">
          AM
        </span>
      </header>

      <div
        ref={panel}
        className="sky-panel"
        role="tabpanel"
        tabIndex={0}
        id={`${base}-${tab}`}
        aria-labelledby={`${base}-tab-${tab}`}
        inert={sheet ? true : undefined}
      >
        {tab === 'home' && (
          <div className={`sky-home${counted ? '' : ' is-first'}`}>
            <p className="sky-hello">Good evening, {member.first}</p>

            <section
              className="sky-mcard"
              data-side={pass ? 'pass' : 'front'}
              aria-label="Member card"
            >
              <div className="sky-mcard-face sky-mcard-front" aria-hidden={pass}>
                <div className="sky-mcard-row">
                  <span className="sky-mcard-brand">
                    <Icon name="star" size={14} /> Skyward Gold
                  </span>
                  <span className="sky-mcard-since">Since {member.since}</span>
                </div>
                <div className="sky-mcard-pts">
                  <span className="sky-mcard-k">Points</span>
                  <strong className="sky-mcard-n" aria-hidden="true">
                    {fmt(shown)}
                  </strong>
                  <span className="dk-sr">{fmt(balance)} points</span>
                </div>
                <div className="sky-mcard-row">
                  <span className="sky-mcard-name">{member.name}</span>
                  <span className="sky-mcard-num">{member.number}</span>
                </div>
                <svg
                  className="sky-mcard-art"
                  viewBox="0 0 160 120"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M10 110 Q80 -10 158 60" />
                  <path d="M30 118 Q96 10 160 84" />
                  <path d="M60 120 Q110 40 160 104" />
                </svg>
              </div>
              <div className="sky-mcard-face sky-mcard-pass" aria-hidden={!pass}>
                <span className="sky-mcard-k">Scan at the lounge or gate</span>
                <Barcode />
                <span className="sky-mcard-num">
                  {member.name} · {member.number}
                </span>
              </div>
            </section>

            <section className="sky-meter" aria-label={`Progress to ${member.next}`}>
              <div className="sky-meter-head">
                <strong>
                  {fmt(toNext)} SQM to {member.next}
                </strong>
                <span className="sky-sub">by Dec 31</span>
              </div>
              <div
                className="sky-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(segment * 100)}
                aria-label={`${Math.round(segment * 100)}% of the way from ${member.tier} to ${member.next}`}
                style={{ '--p': segment } as CSSProperties}
              >
                <span className="sky-bar-fill" />
                <span className="sky-bar-dot" />
              </div>
              <div className="sky-meter-ends sky-sub">
                <span>
                  {member.tier} · {fmt(gold.at / 1000)}k
                </span>
                <span>{fmt(member.sqm)} SQM</span>
                <span>
                  {member.next} · {fmt(platinum.at / 1000)}k
                </span>
              </div>
            </section>

            <ul className="sky-actions" aria-label="Quick actions">
              <li>
                <button type="button" className="sky-action" onClick={() => go('redeem')}>
                  <span className="sky-action-ico">
                    <Icon name="plane" />
                  </span>
                  Book reward
                </button>
              </li>
              <li>
                <button type="button" className="sky-action" onClick={() => go('status')}>
                  <span className="sky-action-ico">
                    <Icon name="star" />
                  </span>
                  Tier perks
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="sky-action"
                  aria-pressed={pass}
                  onClick={() => {
                    setCounted(true);
                    setPass((p) => !p);
                  }}
                >
                  <span className="sky-action-ico">
                    <Icon name="card" />
                  </span>
                  Member card
                </button>
              </li>
            </ul>

            <section
              className="sky-trip"
              aria-label={next.reward ? 'Your reward trip' : 'Next trip'}
            >
              <div className="sky-trip-head">
                <span className="sky-k">{next.reward ? 'Reward trip' : 'Next trip'}</span>
                <span className="sky-ok">{next.reward ? 'Confirmed' : 'On time'}</span>
              </div>
              <div className="sky-trip-route">
                <span className="sky-iata">
                  {next.from}
                  <span className="sky-sub">{next.fromCity}</span>
                </span>
                <svg className="sky-arc" viewBox="0 0 120 32" aria-hidden="true" focusable="false">
                  <path d="M4 28 Q60 -8 116 28" />
                  <circle cx="4" cy="28" r="3" />
                  <circle cx="116" cy="28" r="3" />
                </svg>
                <span className="sky-iata sky-iata-end">
                  <span className="dk-sr"> to </span>
                  {next.to}
                  <span className="sky-sub">{next.toCity}</span>
                </span>
              </div>
              <dl className="sky-trip-meta">
                <div>
                  <dt>Date</dt>
                  <dd>{next.date}</dd>
                </div>
                <div>
                  <dt>Flight</dt>
                  <dd>{next.flight}</dd>
                </div>
                <div>
                  <dt>Seat</dt>
                  <dd>{next.seat}</dd>
                </div>
                <div>
                  <dt>Boards</dt>
                  <dd>{next.boards}</dd>
                </div>
              </dl>
            </section>
          </div>
        )}

        {tab === 'status' && (
          <div className="sky-status">
            <section className="sky-hero" aria-label="Qualifying progress">
              <div
                className="sky-ring"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(overall * 100)}
                aria-label={`${fmt(member.sqm)} of ${fmt(platinum.at)} status qualifying miles`}
                style={{ '--p': overall } as CSSProperties}
              >
                <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                  <circle className="sky-ring-track" cx="50" cy="50" r="42" />
                  <circle className="sky-ring-fill" cx="50" cy="50" r="42" pathLength="100" />
                </svg>
                <span className="sky-ring-n" aria-hidden="true">
                  {Math.round(overall * 100)}%<span>to {member.next}</span>
                </span>
              </div>
              <div className="sky-hero-text">
                <span className="sky-medal sky-medal-gold">
                  <Icon name="star" size={14} /> {member.tier}
                </span>
                <strong className="sky-hero-n">{fmt(member.sqm)} SQM</strong>
                <span className="sky-sub">
                  {fmt(toNext)} more for {member.next}. Status qualifying miles reset Dec 31.
                </span>
              </div>
            </section>

            <ol className="sky-ladder" aria-label="Tiers and their perks">
              {tiers.map((t) => {
                const state =
                  t.name === member.tier ? 'current' : t.at <= member.sqm ? 'done' : 'next';
                const tid = `${base}-tier-${t.name}`;
                return (
                  <li key={t.name} className={`sky-rung is-${state}`}>
                    <span
                      className={`sky-node sky-medal-${t.name.toLowerCase()}`}
                      aria-hidden="true"
                    >
                      <Icon
                        name={state === 'next' ? 'lock' : state === 'done' ? 'check' : 'star'}
                        size={14}
                      />
                    </span>
                    <div className="sky-rung-head">
                      <strong id={tid}>{t.name}</strong>
                      <span className="sky-sub">{fmt(t.at)} SQM</span>
                      <span className={`sky-state sky-state-${state}`}>
                        {state === 'current'
                          ? 'Your tier'
                          : state === 'done'
                            ? 'Unlocked'
                            : `${fmt(t.at - member.sqm)} to go`}
                      </span>
                    </div>
                    <ul className="sky-perks" aria-label={`${t.name} perks`}>
                      {t.perks.map((p) => (
                        <li key={p.label} className="sky-perk">
                          <span className="sky-perk-ico">
                            <Icon name={p.icon} />
                          </span>
                          <span>{p.label}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {tab === 'redeem' && (
          <div className="sky-redeem">
            <div className="sky-redeem-head">
              <p className="sky-k">Fly from Toronto</p>
              <span className="sky-balance-chip">
                <strong>{fmt(balance)}</strong> pts
              </span>
            </div>
            <ul className="sky-flights" aria-label="Reward flights from Toronto">
              {flights.map((f) => {
                const short = f.points > balance && booked !== f.id;
                const saves = f.fare - f.cash;
                return (
                  <li key={f.id} className={`sky-flight${booked === f.id ? ' is-booked' : ''}`}>
                    <div className="sky-flight-art">
                      <SceneArt scene={f.scene} id={`${base}-${f.id}`} />
                      <span className="sky-date">{f.date}</span>
                    </div>
                    <div className="sky-flight-body">
                      <div className="sky-flight-top">
                        <strong className="sky-city">{f.city}</strong>
                        <span className="sky-route">
                          {f.from} <span aria-hidden="true">→</span>
                          <span className="dk-sr"> to </span> {f.to}
                        </span>
                      </div>
                      <div className="sky-price">
                        <span className="sky-price-pts">
                          <strong>{fmt(f.points)}</strong> pts + ${f.cash}
                        </span>
                        <span className="sky-price-cash">or ${fmt(f.fare)} cash</span>
                      </div>
                      <div className="sky-flight-foot">
                        <span className="sky-save">Saves ${fmt(saves)}</span>
                        {booked === f.id ? (
                          <span className="sky-booked" ref={bookedRef} tabIndex={-1}>
                            <Icon name="check" size={16} /> Booked
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="sky-book"
                            disabled={short}
                            onClick={() => redeem(f.id)}
                            aria-label={
                              short
                                ? `Need ${fmt(f.points - balance)} more points to book ${f.city}`
                                : `Book ${f.city} for ${fmt(f.points)} points`
                            }
                          >
                            {short ? `Need ${fmt(f.points - balance)} more` : 'Book'}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {sheetFlight && (
        <div className="sky-scrim">
          <div
            ref={sheetRef}
            className="sky-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${base}-sheet-h`}
            onKeyDown={onSheetKey}
          >
            <svg className="sky-tick" viewBox="0 0 52 52" aria-hidden="true" focusable="false">
              <circle cx="26" cy="26" r="23" pathLength="100" />
              <path d="M15 27 23 35 38 19" pathLength="100" />
            </svg>
            <h2 id={`${base}-sheet-h`} tabIndex={-1}>
              You’re going to {sheetFlight.city}
            </h2>
            <div className="sky-pass">
              <div className="sky-pass-top">
                <span className="sky-iata">
                  {sheetFlight.from}
                  <span>Toronto</span>
                </span>
                <span className="sky-pass-plane" aria-hidden="true">
                  <Icon name="plane" size={22} />
                </span>
                <span className="sky-iata sky-iata-end">
                  <span className="dk-sr"> to </span>
                  {sheetFlight.to}
                  <span>{sheetFlight.city}</span>
                </span>
              </div>
              <dl className="sky-pass-meta">
                <div>
                  <dt>Date</dt>
                  <dd>{sheetFlight.date}</dd>
                </div>
                <div>
                  <dt>Flight</dt>
                  <dd>{sheetFlight.flight}</dd>
                </div>
                <div>
                  <dt>Paid</dt>
                  <dd>
                    {fmt(sheetFlight.points)} pts + ${sheetFlight.cash}
                  </dd>
                </div>
                <div>
                  <dt>New balance</dt>
                  <dd>{fmt(balance)} pts</dd>
                </div>
              </dl>
            </div>
            <div className="sky-sheet-actions">
              <button
                type="button"
                className="sky-ghost"
                onClick={() => {
                  setSheet(null);
                  go('home');
                  requestAnimationFrame(() => refs.current.home?.focus());
                }}
              >
                See trip
              </button>
              <button type="button" className="sky-cta" onClick={closeSheet}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="sky-tabs"
        role="tablist"
        aria-label="Sections"
        inert={sheet ? true : undefined}
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${base}-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => go(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </nav>
      <p className="dk-sr" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
