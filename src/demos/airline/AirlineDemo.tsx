// Direction (WO-035): "Wallet pass". A calm light app on a warm neutral base with one brand colour
// (plum), a flat member pass, grouped lists instead of rows of cards, and a precise segmented tier
// track on Status. Colour only where it means something: the tier, the balance, a confirmed booking.
// Anonymized airline-loyalty member app (constitution art. 3 + 6): invented brand, mocked data.
// Directions place this inside their own phone frame; they don't restyle its internals.
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Barcode, Icon, type IconName } from './art';
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
  flight: string;
};
// Cheapest first: the list reads as "what your balance reaches".
const flights: Flight[] = [
  {
    id: 'f2',
    from: 'YYZ',
    to: 'YVR',
    city: 'Vancouver',
    date: 'Feb 02',
    points: 15_000,
    cash: 42,
    fare: 318,
    flight: 'SK 115',
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
    flight: 'SK 470',
  },
  {
    id: 'f1',
    from: 'YYZ',
    to: 'LIS',
    city: 'Lisbon',
    date: 'Mar 14',
    points: 35_000,
    cash: 89,
    fare: 612,
    flight: 'SK 238',
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
    flight: 'SK 9',
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

/** Bring `el`'s top edge on screen under the site's sticky header, scrolling the page only when it
 *  is not already there (the page's scroll padding is the header's height plus a little air). */
function reveal(el: HTMLElement, from: HTMLElement = el) {
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const top = el.getBoundingClientRect().top;
  if (top >= pad - 1 && top <= window.innerHeight * 0.6) return;
  window.scrollBy({ top: from.getBoundingClientRect().top - pad });
}

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

/** The wordmark's glyph: a swept wing, one colour. */
function Mark() {
  return (
    <svg className="sky-mark" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M2 15.5 18 4.5l-5.5 11-2.6-4.1z" fill="currentColor" />
    </svg>
  );
}

/** A route, boarding-pass style: two airports, the line between them, then the fields. */
function Route(props: { from: string; fromCity: string; to: string; toCity: string }) {
  return (
    <div className="sky-bp-route">
      <span className="sky-iata">
        {props.from}
        <span className="sky-iata-city">{props.fromCity}</span>
      </span>
      <span className="sky-bp-line" aria-hidden="true">
        <Icon name="plane" size={16} />
      </span>
      <span className="sky-iata sky-iata-end">
        <span className="dk-sr"> to </span>
        {props.to}
        <span className="sky-iata-city">{props.toCity}</span>
      </span>
    </div>
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
  const appRef = useRef<HTMLDivElement>(null);
  // Set when a control inside a panel switches tab: focus then moves to the new panel.
  const follow = useRef(false);

  // The balance counts up the first time Home is seen, then never again.
  const shown = useCountUp(balance, tab === 'home' && !counted);
  useEffect(() => {
    if (tab !== 'home' || counted) return;
    const t = window.setTimeout(() => setCounted(true), 950);
    return () => window.clearTimeout(t);
  }, [tab, counted]);

  useEffect(() => {
    panel.current?.scrollTo?.({ top: 0 });
    const el = panel.current;
    if (!follow.current || !el) return;
    follow.current = false;
    el.focus({ preventScroll: true });
    if (appRef.current) reveal(el, appRef.current);
  }, [tab]);

  // The sheet takes focus on its heading without scrolling while it slides in, then, once it has
  // landed, the page scrolls only as far as it takes to show it whole under the site header.
  useEffect(() => {
    const el = sheetRef.current;
    if (!sheet || !el) return;
    el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    let live = true;
    Promise.all((el.getAnimations?.() ?? []).map((a) => a.finished))
      .catch(() => undefined)
      .then(() => {
        if (live && el.isConnected) el.scrollIntoView({ block: 'nearest' });
      });
    return () => {
      live = false;
    };
  }, [sheet]);

  /** Switch tab. From a control inside a panel (`follow`), focus moves to the new panel. */
  function go(next: Tab, followFocus = false) {
    if (tab === 'home') setCounted(true);
    follow.current = followFocus;
    setTab(next);
  }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = tabs.length;
    const target =
      e.key === 'ArrowRight'
        ? (i + 1) % n
        : e.key === 'ArrowLeft'
          ? (i - 1 + n) % n
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : -1;
    if (target < 0) return;
    e.preventDefault();
    const next = tabs[target].id;
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
    // A modal sheet: Tab and Shift+Tab cycle through its buttons, and the heading (where focus
    // starts) counts as the top of the loop, so focus never leaves it.
    const el = sheetRef.current;
    const items = el?.querySelectorAll<HTMLElement>('button');
    if (!el || !items?.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || !(at instanceof HTMLButtonElement) || !el.contains(at))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (at === last || !el.contains(at))) {
      e.preventDefault();
      first.focus();
    }
  }

  const bookedFlight = flights.find((f) => f.id === booked);
  const sheetFlight = flights.find((f) => f.id === sheet);

  // Redeem groups: the trip just booked, what the balance covers now, then the rest.
  const groups = [
    { id: 'booked', title: 'Just booked', items: flights.filter((f) => f.id === booked) },
    {
      id: 'reach',
      title: 'Within your balance',
      items: flights.filter((f) => f.id !== booked && f.points <= balance),
    },
    {
      id: 'later',
      title: 'Keep earning',
      items: flights.filter((f) => f.id !== booked && f.points > balance),
    },
  ].filter((g) => g.items.length);

  const destination = (f: Flight) => {
    const short = f.points > balance && booked !== f.id;
    return (
      <li key={f.id} className={`sky-dest${booked === f.id ? ' is-booked' : ''}`}>
        <strong className="sky-city">{f.city}</strong>
        <span className="sky-dest-pts">
          {fmt(f.points)} <span className="sky-unit">pts</span>
        </span>
        <span className="sky-dest-meta">
          {f.from} <span aria-hidden="true">→</span>
          <span className="dk-sr"> to </span> {f.to} · {f.date}
        </span>
        <span className="sky-dest-tax">+ ${f.cash} taxes</span>
        <span className="sky-dest-cash">or ${fmt(f.fare)} cash</span>
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
            {short ? (
              `Need ${fmt(f.points - balance)} more`
            ) : (
              <>
                Book <Icon name="chevron" size={16} />
              </>
            )}
          </button>
        )}
      </li>
    );
  };

  return (
    <div
      ref={appRef}
      className="sky-app"
      aria-label="Demo: airline loyalty app (mock data)"
      role="group"
    >
      <header className="sky-top">
        <Mark />
        <span className="sky-brand">Skyward</span>
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
          <div className={`sky-screen sky-home${counted ? '' : ' is-first'}`}>
            <p className="sky-hello">Hi, {member.first}</p>

            <div
              role="group"
              className="sky-card"
              data-side={pass ? 'pass' : 'front'}
              aria-label="Member card"
            >
              <div className="sky-card-face sky-card-front" aria-hidden={pass}>
                <div className="sky-card-row">
                  <span className="sky-card-k">Member since {member.since}</span>
                  <span className="sky-card-tier">{member.tier}</span>
                </div>
                <div className="sky-card-main">
                  <span className="sky-card-k">Points</span>
                  <strong className="sky-card-n" aria-hidden="true">
                    {fmt(shown)}
                  </strong>
                  <span className="dk-sr">{fmt(balance)} points</span>
                </div>
                <dl className="sky-card-fields">
                  <div>
                    <dt>Name</dt>
                    <dd>{member.name}</dd>
                  </div>
                  <div>
                    <dt>Number</dt>
                    <dd>{member.number}</dd>
                  </div>
                </dl>
              </div>
              <div className="sky-card-face sky-card-back" aria-hidden={!pass}>
                <Barcode />
                <span className="sky-card-k">
                  {member.name} · {member.number}
                </span>
                <span className="sky-card-k">Scan at the lounge or gate</span>
              </div>
            </div>

            <ul className="sky-acts" aria-label="Quick actions">
              <li>
                <button type="button" className="sky-act" onClick={() => go('redeem', true)}>
                  <span>
                    Book<span className="dk-sr"> reward</span>
                  </span>
                </button>
              </li>
              <li>
                <button type="button" className="sky-act" onClick={() => go('status', true)}>
                  <span>
                    <span className="dk-sr">Tier </span>Perks
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="sky-act"
                  aria-pressed={pass}
                  onClick={() => {
                    setCounted(true);
                    setPass((p) => !p);
                  }}
                >
                  <Icon name="barcode" size={18} />
                  <span>
                    <span className="dk-sr">Member </span>Card
                  </span>
                </button>
              </li>
            </ul>

            <div role="group" className="sky-meter" aria-label={`Progress to ${member.next}`}>
              <p className="sky-meter-head">
                <strong>
                  {fmt(toNext)} status miles to {member.next}
                </strong>
                <span className="sky-sub">by Dec 31</span>
              </p>
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
              </div>
              <p className="sky-meter-ends">
                <span>
                  {member.tier} {fmt(gold.at / 1000)}k
                </span>
                <span>
                  {member.next} {fmt(platinum.at / 1000)}k
                </span>
              </p>
            </div>

            <div role="group" className="sky-box sky-bp" aria-label="Next trip">
              <div className="sky-bp-head">
                <span className="sky-k">Next trip</span>
                <span className="sky-ok">On time</span>
              </div>
              <Route {...trip} />
              <dl className="sky-bp-meta">
                <div>
                  <dt>Date</dt>
                  <dd>{trip.date}</dd>
                </div>
                <div>
                  <dt>Flight</dt>
                  <dd>{trip.flight}</dd>
                </div>
                <div>
                  <dt>Seat</dt>
                  <dd>{trip.seat}</dd>
                </div>
                <div>
                  <dt>Boards</dt>
                  <dd>{trip.boards}</dd>
                </div>
              </dl>
              {bookedFlight && (
                <div className="sky-bp-also" role="group" aria-label="Your reward trip">
                  <span>
                    <span className="sky-k">Reward trip </span>
                    {bookedFlight.from} <span aria-hidden="true">→</span>
                    <span className="dk-sr"> to </span> {bookedFlight.to} · {bookedFlight.date} ·{' '}
                    {bookedFlight.flight}
                  </span>
                  <span className="sky-ok">Confirmed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'status' && (
          <div className="sky-screen sky-status">
            <div role="group" className="sky-lead" aria-label="Qualifying progress">
              <p className="sky-lead-k">
                <span>Status qualifying miles</span>
                <span className="sky-tier-tag">{member.tier}</span>
              </p>
              <p className="sky-hero">
                {fmt(member.sqm)} <span className="sky-unit">SQM</span>
              </p>
              <div
                className="sky-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(overall * 100)}
                aria-label={`${fmt(member.sqm)} of ${fmt(platinum.at)} status qualifying miles`}
              >
                {tiers.map((t, i) => {
                  const from = i ? tiers[i - 1].at : 0;
                  const p = Math.min(1, Math.max(0, (member.sqm - from) / (t.at - from)));
                  return (
                    <span
                      key={t.name}
                      className="sky-seg"
                      style={{ '--p': p } as CSSProperties}
                      aria-hidden="true"
                    >
                      <span className="sky-seg-bar">
                        <span className="sky-seg-fill" />
                      </span>
                      <span className="sky-seg-label">
                        {t.name} <span className="sky-seg-at">{fmt(t.at / 1000)}k</span>
                      </span>
                    </span>
                  );
                })}
              </div>
              <p className="sky-readout">
                <strong>
                  {fmt(toNext)} to {member.next}
                </strong>{' '}
                by Dec 31
              </p>
            </div>

            <ol className="sky-tiers" aria-label="Tiers and their perks">
              {tiers.map((t) => {
                const state =
                  t.name === member.tier ? 'current' : t.at <= member.sqm ? 'done' : 'next';
                return (
                  <li key={t.name} className={`sky-tier is-${state}`}>
                    <div className="sky-tier-head">
                      <strong>{t.name}</strong>
                      <span className="sky-tier-at">{fmt(t.at)} SQM</span>
                      <span className="sky-state">
                        {state === 'current' ? (
                          'Your tier'
                        ) : state === 'done' ? (
                          <>
                            <Icon name="check" size={16} /> Unlocked
                          </>
                        ) : (
                          `${fmt(t.at - member.sqm)} to go`
                        )}
                      </span>
                    </div>
                    <ul className="sky-perks" aria-label={`${t.name} perks`}>
                      {t.perks.map((p) => (
                        <li key={p.label} className="sky-perk">
                          <Icon name={p.icon} size={18} />
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
          <div className="sky-screen sky-redeem">
            <div className="sky-lead">
              <p className="sky-lead-k">Your balance</p>
              <p className="sky-hero">
                {fmt(balance)} <span className="sky-unit">pts</span>
              </p>
              <p className="sky-lead-t">Where it gets you</p>
              <p className="sky-sub">Economy reward seats from Toronto</p>
            </div>
            {groups.map((g) => (
              <section key={g.id} className="sky-group" aria-labelledby={`${base}-${g.id}`}>
                <h3 className="sky-k" id={`${base}-${g.id}`}>
                  {g.title}
                </h3>
                <ul className="sky-dests">{g.items.map(destination)}</ul>
              </section>
            ))}
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
            <div className="sky-sheet-head">
              <p className="sky-ok">
                <svg className="sky-tick" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12.5 9.5 17 19 7.5" pathLength="100" />
                </svg>
                Reward booked
              </p>
              <h2 id={`${base}-sheet-h`} tabIndex={-1}>
                You’re going to {sheetFlight.city}
              </h2>
            </div>
            <div className="sky-box sky-bp">
              <Route
                from={sheetFlight.from}
                fromCity="Toronto"
                to={sheetFlight.to}
                toCity={sheetFlight.city}
              />
              <dl className="sky-bp-meta sky-bp-meta-2">
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
            aria-controls={tab === t.id ? `${base}-${t.id}` : undefined}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => go(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            <Icon name={t.icon} size={22} />
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
