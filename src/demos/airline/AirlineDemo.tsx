// Anonymized airline-loyalty member app (constitution art. 3 + 6): invented brand, mocked data.
// Directions place this inside their own phone frame; they don't restyle its internals.
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import './airline.css';

type Tab = 'home' | 'status' | 'redeem';

const member = {
  first: 'Alex',
  number: '•••• 4821',
  points: 48_250,
  tier: 'Gold',
  next: 'Platinum',
  progress: 0.68,
  toNext: 9_600,
};

const tiers = [
  { name: 'Silver', perks: ['Priority check-in', '1 free checked bag'] },
  { name: 'Gold', perks: ['Lounge access', 'Priority boarding', '2 free checked bags'] },
  {
    name: 'Platinum',
    perks: ['Complimentary upgrades', 'Dedicated support line', 'Partner lounge access'],
  },
];

const flights = [
  { id: 'f1', from: 'YYZ', to: 'LIS', city: 'Lisbon', date: 'Mar 14', points: 35_000, cash: 89 },
  { id: 'f2', from: 'YYZ', to: 'YVR', city: 'Vancouver', date: 'Feb 02', points: 15_000, cash: 42 },
  { id: 'f3', from: 'YYZ', to: 'NRT', city: 'Tokyo', date: 'Apr 21', points: 75_000, cash: 120 },
  { id: 'f4', from: 'YYZ', to: 'CUN', city: 'Cancún', date: 'Jan 18', points: 25_000, cash: 64 },
];

const fmt = (n: number) => n.toLocaleString('en-CA');

export default function AirlineDemo() {
  const [tab, setTab] = useState<Tab>('home');
  const [booked, setBooked] = useState<string | null>(null);
  const [balance, setBalance] = useState(member.points);
  const [announce, setAnnounce] = useState('');
  const base = useId();
  const tabs: { id: Tab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'status', label: 'Status' },
    { id: 'redeem', label: 'Redeem' },
  ];
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({
    home: null,
    status: null,
    redeem: null,
  });

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = tabs[(i + dir + tabs.length) % tabs.length].id;
    setTab(next);
    refs.current[next]?.focus();
  }

  function redeem(id: string) {
    const f = flights.find((x) => x.id === id);
    if (!f || f.points > balance) return;
    setBalance((b) => b - f.points);
    setBooked(id);
    setAnnounce(
      `Booked ${f.city} for ${fmt(f.points)} points. ${fmt(balance - f.points)} points remaining.`,
    );
  }

  return (
    <div className="sky-app" aria-label="Demo: airline loyalty app (mock data)" role="group">
      <header className="sky-top">
        <span className="sky-logo" aria-hidden="true">
          ✦
        </span>
        <span className="sky-brand">Skyward Rewards</span>
        <span className="sky-tier-chip">{member.tier}</span>
      </header>

      <div
        className="sky-panel"
        role="tabpanel"
        id={`${base}-${tab}`}
        aria-labelledby={`${base}-tab-${tab}`}
      >
        {tab === 'home' && (
          <>
            <p className="sky-hello">Welcome back, {member.first}</p>
            <section className="sky-card sky-balance" aria-label="Points balance">
              <span className="sky-label">Points balance</span>
              <strong className="sky-points">{fmt(balance)}</strong>
              <span className="sky-sub">Member {member.number}</span>
            </section>
            <section className="sky-card" aria-label={`Progress to ${member.next}`}>
              <div className="sky-row">
                <span className="sky-label">
                  {member.tier} → {member.next}
                </span>
                <span className="sky-sub">{fmt(member.toNext)} SQM to go</span>
              </div>
              <div
                className="sky-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(member.progress * 100)}
                aria-label={`${Math.round(member.progress * 100)}% of the way to ${member.next}`}
              >
                <span style={{ width: `${member.progress * 100}%` }} />
              </div>
            </section>
            <button type="button" className="sky-cta" onClick={() => setTab('redeem')}>
              Book a reward flight
            </button>
          </>
        )}

        {tab === 'status' && (
          <ol className="sky-tiers">
            {tiers.map((t) => (
              <li key={t.name} className={`sky-card${t.name === member.tier ? ' is-current' : ''}`}>
                <div className="sky-row">
                  <strong>{t.name}</strong>
                  {t.name === member.tier && <span className="sky-tier-chip">Your tier</span>}
                </div>
                <ul>
                  {t.perks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}

        {tab === 'redeem' && (
          <ul className="sky-flights" aria-label="Reward flights from Toronto">
            {flights.map((f) => {
              const short = f.points > balance && booked !== f.id;
              return (
                <li key={f.id} className="sky-card sky-flight">
                  <div>
                    <strong className="sky-route">
                      {f.from} <span aria-hidden="true">→</span>
                      <span className="visually-hidden"> to </span> {f.to}
                    </strong>
                    <span className="sky-sub">
                      {f.city} · {f.date}
                    </span>
                  </div>
                  <div className="sky-price">
                    <span>{fmt(f.points)} pts</span>
                    <span className="sky-sub">+ ${f.cash} taxes</span>
                  </div>
                  {booked === f.id ? (
                    <span className="sky-booked">Booked ✓</span>
                  ) : (
                    <button
                      type="button"
                      className="sky-book"
                      disabled={short}
                      onClick={() => redeem(f.id)}
                      aria-label={
                        short
                          ? `${f.city}: not enough points`
                          : `Book ${f.city} for ${fmt(f.points)} points`
                      }
                    >
                      {short ? 'Not enough' : 'Book'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <nav className="sky-tabs" role="tablist" aria-label="Sections">
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
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <p className="visually-hidden" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
