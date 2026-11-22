// Anonymized grocer-loyalty member app (constitution art. 3 + 6): invented brand, mocked data.
// The member is signed in and their loyalty account is already linked. Hosts place this inside
// their own phone frame; they don't restyle its internals.
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import './grocer.css';

type Tab = 'home' | 'offers' | 'lists' | 'recipes';

type Offer = { id: string; title: string; points: number; ends: string };
type Item = { id: string; name: string; done: boolean; offer?: string };

const member = {
  first: 'Sam',
  card: '•••• 7316',
  points: 4_650,
  rewardAt: 5_000,
  reward: '$10 off your shop',
};
// Base earn for every item bought, on top of any loaded offer.
const PER_ITEM = 10;

type Shop = { items: number; base: number; bonus: { title: string; points: number }[] };

const offers: Offer[] = [
  { id: 'cereal', title: 'Buy any cereal', points: 50, ends: 'Sun' },
  { id: 'yogurt', title: 'Any 2 Greek yogurts', points: 75, ends: 'Sat' },
  { id: 'berries', title: 'Spend $8 on fresh berries', points: 100, ends: 'Fri' },
  { id: 'coffee', title: 'Any whole-bean coffee', points: 120, ends: 'Sun' },
];

const startList: Item[] = [
  { id: 'i1', name: 'Bananas', done: false },
  { id: 'i2', name: 'Cereal', done: false, offer: 'cereal' },
  { id: 'i3', name: 'Milk', done: false },
  { id: 'i4', name: 'Coffee beans', done: false, offer: 'coffee' },
  { id: 'i5', name: 'Sourdough bread', done: true },
];

const recipe = {
  title: 'Overnight oats with berries',
  meta: 'Serves 2 · 10 min prep',
  ingredients: [
    { name: 'Rolled oats' },
    { name: 'Greek yogurt', offer: 'yogurt' },
    { name: 'Milk' },
    { name: 'Berries', offer: 'berries' },
    { name: 'Maple syrup' },
  ],
};

const fmt = (n: number) => n.toLocaleString('en-CA');
const offerById = (id?: string) => offers.find((o) => o.id === id);
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export default function GrocerDemo() {
  const [tab, setTab] = useState<Tab>('home');
  const [loaded, setLoaded] = useState<string[]>(['coffee']);
  const [used, setUsed] = useState<string[]>([]);
  const [points, setPoints] = useState(member.points);
  const [lastShop, setLastShop] = useState<Shop | null>(null);
  const [list, setList] = useState<Item[]>(startList);
  const [announce, setAnnounce] = useState('');
  const base = useId();
  const tabs: { id: Tab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'offers', label: 'Offers' },
    { id: 'lists', label: 'Lists' },
    { id: 'recipes', label: 'Recipes' },
  ];
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({
    home: null,
    offers: null,
    lists: null,
    recipes: null,
  });

  const progress = Math.min(points / member.rewardAt, 1);
  const rewardReady = points >= member.rewardAt;
  const left = list.filter((i) => !i.done).length;
  const inBasket = list.filter((i) => i.done);
  const onList = (name: string) => list.some((i) => same(i.name, name));

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
    setTab(next);
    refs.current[next]?.focus();
  }

  function checkout() {
    if (!inBasket.length) {
      setAnnounce('Tick the items in your basket first, then check out.');
      return;
    }
    const bonus = offers
      .filter((o) => loaded.includes(o.id) && inBasket.some((i) => i.offer === o.id))
      .map((o) => ({ title: o.title, points: o.points }));
    const base = inBasket.length * PER_ITEM;
    const earned = base + bonus.reduce((n, b) => n + b.points, 0);
    const total = points + earned;
    const usedIds = offers.filter((o) => bonus.some((b) => b.title === o.title)).map((o) => o.id);
    setPoints(total);
    setUsed((u) => [...u, ...usedIds]);
    setLoaded((l) => l.filter((id) => !usedIds.includes(id)));
    setList((l) => l.filter((i) => !i.done));
    setLastShop({ items: inBasket.length, base, bonus });
    setAnnounce(
      `Checked out ${inBasket.length} ${inBasket.length === 1 ? 'item' : 'items'}: plus ${earned} points` +
        (bonus.length
          ? `, including ${bonus.length} ${bonus.length === 1 ? 'offer' : 'offers'}`
          : '') +
        `. Balance ${fmt(total)}.` +
        (total >= member.rewardAt && points < member.rewardAt
          ? ` Reward unlocked: ${member.reward}.`
          : ''),
    );
  }

  function toggleOffer(o: Offer) {
    const isLoaded = loaded.includes(o.id);
    const next = isLoaded ? loaded.filter((id) => id !== o.id) : [...loaded, o.id];
    setLoaded(next);
    setAnnounce(
      `${isLoaded ? 'Removed' : 'Loaded'} offer: ${o.title}, plus ${o.points} points. ` +
        `${next.length} of ${offers.length - used.length} offers loaded.`,
    );
  }

  function tick(id: string) {
    const item = list.find((i) => i.id === id);
    if (!item) return;
    const next = list.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
    setList(next);
    const remaining = next.filter((i) => !i.done).length;
    setAnnounce(
      `${item.name} ${item.done ? 'back on' : 'ticked off'} your list. ${remaining} of ${next.length} items left.`,
    );
  }

  function addIngredients() {
    const missing = recipe.ingredients.filter((g) => !onList(g.name));
    if (!missing.length) {
      setAnnounce('All ingredients are already on your list.');
      return;
    }
    setList((l) => [
      ...l,
      ...missing.map((g, k) => ({
        id: `r${l.length + k}`,
        name: g.name,
        done: false,
        offer: g.offer,
      })),
    ]);
    const already = recipe.ingredients.length - missing.length;
    setAnnounce(
      `Added ${missing.length} ingredients to your list` +
        (already ? `. ${already} ${already === 1 ? 'was' : 'were'} already on it.` : '.'),
    );
  }

  return (
    <div className="gro-app" aria-label="Demo: grocer loyalty app (mock data)" role="group">
      <header className="gro-top">
        <span className="gro-logo" aria-hidden="true">
          ❦
        </span>
        <span className="gro-brand">Pantry Lane</span>
        <span className="gro-chip">
          <span aria-hidden="true">✓ </span>Linked
        </span>
      </header>

      <div
        className="gro-panel"
        role="tabpanel"
        id={`${base}-${tab}`}
        aria-labelledby={`${base}-tab-${tab}`}
      >
        {tab === 'home' && (
          <>
            <p className="gro-hello">Hi {member.first}, happy shopping</p>
            <section className="gro-card gro-balance" aria-label="Points balance">
              <span className="gro-label">Pantry Points</span>
              <strong className="gro-points">{fmt(points)}</strong>
              <span className="gro-sub">Card {member.card} · linked to your account</span>
            </section>
            <section className="gro-card" aria-label="Progress to your next reward">
              <div className="gro-row">
                <span className="gro-label">Next reward: {member.reward}</span>
              </div>
              <div
                className="gro-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                aria-label={`${Math.round(progress * 100)}% of the way to ${member.reward}`}
              >
                <span style={{ width: `${progress * 100}%` }} />
              </div>
              <span className="gro-sub">
                {rewardReady
                  ? 'Reward ready · applies at your next checkout'
                  : `${fmt(member.rewardAt - points)} pts to go · rewards at ${fmt(member.rewardAt)}`}
              </span>
            </section>
            {lastShop && (
              <section className="gro-card" aria-label="Your last shop">
                <span className="gro-label">Last shop</span>
                <ul className="gro-earned">
                  <li>
                    <span>
                      {lastShop.items} {lastShop.items === 1 ? 'item' : 'items'} × {PER_ITEM} pts
                    </span>
                    <span>+{lastShop.base}</span>
                  </li>
                  {lastShop.bonus.map((b) => (
                    <li key={b.title}>
                      <span>Offer: {b.title}</span>
                      <span>+{b.points}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="gro-card gro-row" aria-label="Your offers">
              {used.length === offers.length ? (
                <span>
                  <strong>All {offers.length}</strong> offers earned this week
                </span>
              ) : (
                <span>
                  <strong>
                    {loaded.length} of {offers.length - used.length}
                  </strong>{' '}
                  offers loaded
                  {used.length > 0 && ` · ${used.length} earned`}
                </span>
              )}
              <button type="button" className="gro-link" onClick={() => setTab('offers')}>
                See offers
              </button>
            </section>
          </>
        )}

        {tab === 'offers' && (
          <>
            <p className="gro-intro">
              Picked for you. Load an offer, then buy the item to earn the bonus.
            </p>
            <ul className="gro-stack" aria-label="Personalized offers">
              {offers.map((o) => {
                const on = loaded.includes(o.id);
                const done = used.includes(o.id);
                return (
                  <li key={o.id} className={`gro-card gro-offer${on ? ' is-on' : ''}`}>
                    <span className="gro-pts" aria-hidden="true">
                      +{o.points}
                    </span>
                    <div>
                      <strong className="gro-offer-t">
                        {o.title}, +{o.points} pts
                      </strong>
                      <span className="gro-sub">Ends {o.ends}</span>
                    </div>
                    {done ? (
                      <span className="gro-earned-chip">
                        <span aria-hidden="true">✓ </span>Earned
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="gro-load"
                        aria-pressed={on}
                        onClick={() => toggleOffer(o)}
                      >
                        {on ? (
                          <>
                            <span aria-hidden="true">✓ </span>Loaded
                          </>
                        ) : (
                          'Load'
                        )}
                        <span className="gro-sr"> offer: {o.title}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === 'lists' && (
          <section className="gro-card" aria-labelledby={`${base}-list-h`}>
            <div className="gro-row">
              <strong id={`${base}-list-h`}>Weekly shop</strong>
              <span className="gro-sub">
                {left} of {list.length} left
              </span>
            </div>
            <p className="gro-sub gro-hint">Tick items as they go in your basket.</p>
            <ul className="gro-list">
              {list.map((i) => {
                const o = offerById(i.offer);
                const flagId = `${base}-flag-${i.id}`;
                return (
                  <li key={i.id} className={i.done ? 'is-done' : undefined}>
                    <label>
                      <input
                        type="checkbox"
                        checked={i.done}
                        onChange={() => tick(i.id)}
                        aria-describedby={o ? flagId : undefined}
                      />
                      <span className="gro-item">{i.name}</span>
                    </label>
                    {o && (
                      <span id={flagId} className="gro-flag">
                        Offer +{o.points} pts
                        {used.includes(o.id)
                          ? ' · earned'
                          : loaded.includes(o.id)
                            ? ' · loaded'
                            : ' · not loaded'}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {list.length === 0 && <p className="gro-sub">Your list is empty.</p>}
            <button type="button" className="gro-cta" onClick={checkout}>
              Check out {inBasket.length > 0 && `(${inBasket.length})`}
            </button>
          </section>
        )}

        {tab === 'recipes' && (
          <section className="gro-card gro-recipe" aria-labelledby={`${base}-recipe-h`}>
            <div className="gro-dish" aria-hidden="true" />
            <strong id={`${base}-recipe-h`} className="gro-recipe-t">
              {recipe.title}
            </strong>
            <span className="gro-sub">{recipe.meta}</span>
            <ul className="gro-ingredients" aria-label="Ingredients">
              {recipe.ingredients.map((g) => {
                const o = offerById(g.offer);
                return (
                  <li key={g.name}>
                    <span>{g.name}</span>
                    {o && <span className="gro-flag">Offer +{o.points} pts</span>}
                    {onList(g.name) && <span className="gro-onlist">On list</span>}
                  </li>
                );
              })}
            </ul>
            <button type="button" className="gro-cta" onClick={addIngredients}>
              Add ingredients to list
            </button>
          </section>
        )}
      </div>

      <nav className="gro-tabs" role="tablist" aria-label="Sections">
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
      <p className="gro-sr" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
