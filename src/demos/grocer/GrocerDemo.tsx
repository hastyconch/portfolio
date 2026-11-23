// Anonymized grocer-loyalty member app (constitution art. 3 + 6): invented brand, mocked data.
// The member is signed in and their loyalty account is already linked. Hosts place this inside
// their own phone frame; they don't restyle its internals.
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Icon, Logo, ProductArt, RecipeArt, type IconName, type Product } from './art';
import '../kit.css';
import './grocer.css';

type Tab = 'home' | 'offers' | 'lists' | 'recipes';

type Offer = { id: string; title: string; points: number; ends: string; art: Product };
type Item = { id: string; name: string; done: boolean; offer?: string };

const member = {
  first: 'Sam',
  points: 4_650,
  rewardAt: 5_000,
  reward: '$10 off your shop',
};
// Base earn for every item bought, on top of any loaded offer.
const PER_ITEM = 10;

type Shop = {
  items: number;
  base: number;
  bonus: { title: string; points: number }[];
  balance: number;
  unlocked: boolean;
};

const offers: Offer[] = [
  { id: 'cereal', title: 'Buy any cereal', points: 50, ends: 'Sun', art: 'cereal' },
  { id: 'yogurt', title: 'Any 2 Greek yogurts', points: 75, ends: 'Sat', art: 'yogurt' },
  { id: 'berries', title: 'Spend $8 on fresh berries', points: 100, ends: 'Fri', art: 'berries' },
  { id: 'coffee', title: 'Any whole-bean coffee', points: 120, ends: 'Sun', art: 'coffee' },
];

// Aisles, in store order. Each has a colour and a name, so a category never rests on colour.
const AISLES = ['Produce', 'Dairy', 'Bakery', 'Pantry'] as const;
type Aisle = (typeof AISLES)[number];
const AISLE_OF: Record<string, Aisle> = {
  bananas: 'Produce',
  berries: 'Produce',
  milk: 'Dairy',
  'greek yogurt': 'Dairy',
  'sourdough bread': 'Bakery',
};
const aisleOf = (name: string): Aisle => AISLE_OF[name.toLowerCase()] ?? 'Pantry';

const startList: Item[] = [
  { id: 'i1', name: 'Bananas', done: false },
  { id: 'i2', name: 'Cereal', done: false, offer: 'cereal' },
  { id: 'i3', name: 'Milk', done: false },
  { id: 'i4', name: 'Coffee beans', done: false, offer: 'coffee' },
  { id: 'i5', name: 'Sourdough bread', done: true },
];

const recipe = {
  title: 'Overnight oats with berries',
  time: '10 min prep',
  serves: 'Serves 2',
  ingredients: [
    { name: 'Rolled oats', qty: '1 cup' },
    { name: 'Greek yogurt', qty: '½ cup', offer: 'yogurt' },
    { name: 'Milk', qty: '¾ cup' },
    { name: 'Berries', qty: '1 cup', offer: 'berries' },
    { name: 'Maple syrup', qty: '1 tbsp' },
  ],
};
const recipeBonus = recipe.ingredients.reduce(
  (n, g) => n + (offers.find((o) => o.id === g.offer)?.points ?? 0),
  0,
);

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
  const [seen, setSeen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const base = useId();
  const panel = useRef<HTMLDivElement>(null);
  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'offers', label: 'Offers', icon: 'tag' },
    { id: 'lists', label: 'Lists', icon: 'list' },
    { id: 'recipes', label: 'Recipes', icon: 'bowl' },
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
  const open = offers.filter((o) => !used.includes(o.id));
  const loadedPts = open.filter((o) => loaded.includes(o.id)).reduce((n, o) => n + o.points, 0);
  const estimate =
    inBasket.length * PER_ITEM +
    offers
      .filter((o) => loaded.includes(o.id) && inBasket.some((i) => i.offer === o.id))
      .reduce((n, o) => n + o.points, 0);

  // The ring fills once, the first time Home is seen.
  useEffect(() => {
    if (tab !== 'home' || seen) return;
    const t = window.setTimeout(() => setSeen(true), 800);
    return () => window.clearTimeout(t);
  }, [tab, seen]);

  useEffect(() => {
    panel.current?.scrollTo?.({ top: 0 });
  }, [tab]);

  function go(next: Tab) {
    setSeen(true);
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
    const unlocked = total >= member.rewardAt && points < member.rewardAt;
    const usedIds = offers.filter((o) => bonus.some((b) => b.title === o.title)).map((o) => o.id);
    setPoints(total);
    setUsed((u) => [...u, ...usedIds]);
    setLoaded((l) => l.filter((id) => !usedIds.includes(id)));
    setList((l) => l.filter((i) => !i.done));
    setLastShop({ items: inBasket.length, base, bonus, balance: total, unlocked });
    panel.current?.scrollTo?.({ top: 0 });
    setAnnounce(
      `Checked out ${inBasket.length} ${inBasket.length === 1 ? 'item' : 'items'}: plus ${earned} points` +
        (bonus.length
          ? `, including ${bonus.length} ${bonus.length === 1 ? 'offer' : 'offers'}`
          : '') +
        `. Balance ${fmt(total)}.` +
        (unlocked ? ` Reward earned: ${member.reward}.` : ''),
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

  /** One offer: a card in the Home carousel or a tile on the Offers tab. */
  function offerCard(o: Offer, kind: 'slide' | 'tile') {
    const on = loaded.includes(o.id);
    const done = used.includes(o.id);
    return (
      <li
        key={o.id}
        className={`gro-offer gro-offer-${kind}${on ? ' is-on' : ''}${done ? ' is-done' : ''}`}
      >
        <div className={`gro-offer-art gro-art-${o.art}`}>
          <ProductArt product={o.art} />
          <span className="gro-pts">+{o.points}</span>
        </div>
        <strong className="gro-offer-t">{o.title}</strong>
        <span className="gro-sub">
          +{o.points} pts · ends {o.ends}
        </span>
        {done ? (
          <span className="gro-earned-chip">
            <Icon name="check" size={16} /> Earned
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
                <Icon name="check" size={16} />
                Loaded
              </>
            ) : (
              'Load'
            )}
            <span className="dk-sr"> offer: {o.title}</span>
          </button>
        )}
      </li>
    );
  }

  const ring = { '--p': progress } as CSSProperties;

  return (
    <div className="gro-app" aria-label="Demo: grocer loyalty app (mock data)" role="group">
      <header className="gro-top">
        <Logo />
        <span className="gro-brand">Pantry Lane</span>
        <span className="gro-chip">
          <Icon name="check" size={14} />
          Linked
        </span>
      </header>

      <div
        ref={panel}
        className="gro-panel"
        role="tabpanel"
        id={`${base}-${tab}`}
        aria-labelledby={`${base}-tab-${tab}`}
      >
        {tab === 'home' && (
          <div className={`gro-home${seen ? '' : ' is-first'}`}>
            <p className="gro-hello">Hi {member.first}, happy shopping</p>
            <section className="gro-card gro-balance" aria-label="Points balance">
              <div
                className="gro-ring"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                aria-label={`${Math.round(progress * 100)}% of the way to ${member.reward}`}
                style={ring}
              >
                <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                  <circle className="gro-ring-track" cx="50" cy="50" r="43" />
                  <circle className="gro-ring-fill" cx="50" cy="50" r="43" pathLength="100" />
                </svg>
                <span className="gro-ring-in" aria-hidden="true">
                  {Math.round(progress * 100)}%
                </span>
              </div>
              <div className="gro-balance-text">
                <span className="gro-label">Pantry Points</span>
                <strong className="gro-points">{fmt(points)}</strong>
                <span className="gro-sub">
                  {rewardReady
                    ? 'Reward ready · applies at your next checkout'
                    : `${fmt(member.rewardAt - points)} pts to go`}
                </span>
              </div>
              <p className={`gro-next${rewardReady ? ' is-ready' : ''}`}>
                <Icon name="tag" size={16} />
                <span>
                  {rewardReady ? 'Unlocked: ' : 'Next reward: '}
                  <strong>{member.reward}</strong>
                </span>
              </p>
            </section>

            {lastShop && (
              <section className="gro-card gro-last" aria-label="Your last shop">
                <span className="gro-label">
                  <Icon name="receipt" size={16} /> Last shop
                </span>
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

            <section className="gro-picks" aria-labelledby={`${base}-picks`}>
              <div className="gro-row">
                <p id={`${base}-picks`} className="gro-h">
                  Picked for you
                </p>
                <button type="button" className="gro-link" onClick={() => go('offers')}>
                  See offers
                </button>
              </div>
              <ul className="gro-carousel" aria-label="Offers picked for you">
                {offers.map((o) => offerCard(o, 'slide'))}
              </ul>
            </section>

            <section className="gro-summary" aria-label="Your offers">
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
            </section>
          </div>
        )}

        {tab === 'offers' && (
          <div className="gro-offers">
            <div className="gro-offers-head">
              <p className="gro-intro">
                Picked for you. Load an offer, then buy the item to earn the bonus.
              </p>
              <p className="gro-potential">
                <strong>+{loadedPts} pts</strong> loaded
                <span className="gro-sub">
                  {' '}
                  of +{open.reduce((n, o) => n + o.points, 0)} available
                </span>
              </p>
            </div>
            <ul className="gro-tiles" aria-label="Personalized offers">
              {offers.map((o) => offerCard(o, 'tile'))}
            </ul>
          </div>
        )}

        {tab === 'lists' && (
          <div className="gro-lists">
            {lastShop && (
              <section className="gro-receipt" aria-label="Receipt">
                <div className="gro-receipt-head">
                  <strong>Pantry Lane · Elm St</strong>
                  <span className="gro-sub">Receipt · points earned</span>
                </div>
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
                  <li className="gro-total">
                    <span>Points earned</span>
                    <span>+{lastShop.base + lastShop.bonus.reduce((n, b) => n + b.points, 0)}</span>
                  </li>
                  <li className="gro-bal">
                    <span>New balance</span>
                    <span>{fmt(lastShop.balance)}</span>
                  </li>
                </ul>
                {lastShop.unlocked && (
                  <p className="gro-unlock">
                    <Icon name="spark" size={20} />
                    <span>
                      <strong>Reward unlocked</strong>
                      {member.reward}, applied at your next checkout
                    </span>
                  </p>
                )}
              </section>
            )}

            {lastShop && list.length === 0 ? (
              <p className="gro-empty">
                Basket checked out. Add a recipe’s ingredients to start the next shop.
              </p>
            ) : (
              <section className="gro-card gro-listcard" aria-labelledby={`${base}-list-h`}>
                <div className="gro-row">
                  <strong id={`${base}-list-h`} className="gro-h">
                    Weekly shop
                  </strong>
                  <span className="gro-sub">
                    {left} of {list.length} left
                  </span>
                </div>
                <div className="gro-basketbar" aria-hidden="true">
                  <span
                    style={{ width: `${list.length ? (inBasket.length / list.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="gro-sub gro-hint">Tick items as they go in your basket.</p>
                {AISLES.map((aisle) => {
                  const items = list.filter((i) => aisleOf(i.name) === aisle);
                  if (!items.length) return null;
                  return (
                    <div key={aisle} className={`gro-aisle gro-aisle-${aisle.toLowerCase()}`}>
                      <p className="gro-aisle-h">
                        <span className="gro-dot" aria-hidden="true" />
                        {aisle}
                      </p>
                      <ul className="gro-list" aria-label={aisle}>
                        {items.map((i) => {
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
                                <span
                                  id={flagId}
                                  className={`gro-flag${loaded.includes(o.id) ? ' is-loaded' : ''}`}
                                >
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
                    </div>
                  );
                })}
                {list.length === 0 && (
                  <p className="gro-empty">
                    Your list is empty. Add a recipe’s ingredients to start the next shop.
                  </p>
                )}
                <div className="gro-checkout">
                  <span className="gro-sub">
                    {inBasket.length
                      ? `${inBasket.length} in basket · about +${estimate} pts`
                      : 'Basket is empty'}
                  </span>
                  <button type="button" className="gro-cta" onClick={checkout}>
                    Check out {inBasket.length > 0 && `(${inBasket.length})`}
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {tab === 'recipes' && (
          <section className="gro-card gro-recipe" aria-labelledby={`${base}-recipe-h`}>
            <div className="gro-recipe-art">
              <RecipeArt />
              <span className="gro-tag">Breakfast</span>
            </div>
            <div className="gro-recipe-body">
              <strong id={`${base}-recipe-h`} className="gro-recipe-t">
                {recipe.title}
              </strong>
              <ul className="gro-meta" aria-label="About this recipe">
                <li>
                  <Icon name="clock" size={16} />
                  {recipe.time}
                </li>
                <li>
                  <Icon name="people" size={16} />
                  {recipe.serves}
                </li>
                <li className="gro-meta-pts">
                  <Icon name="tag" size={16} />+{recipeBonus} pts in offers
                </li>
              </ul>
              <ul className="gro-ingredients" aria-label="Ingredients">
                {recipe.ingredients.map((g) => {
                  const o = offerById(g.offer);
                  return (
                    <li key={g.name}>
                      <span className="gro-qty">{g.qty}</span>
                      <span className="gro-ing">{g.name}</span>
                      {o && <span className="gro-flag">Offer +{o.points} pts</span>}
                      {onList(g.name) && (
                        <span className="gro-onlist">
                          <Icon name="check" size={14} />
                          On list
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="gro-cta" onClick={addIngredients}>
                Add ingredients to list
              </button>
            </div>
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
            onClick={() => go(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            <span className="gro-tab-ico">
              <Icon name={t.icon} />
              {t.id === 'lists' && left > 0 && (
                <span className="gro-badge" aria-hidden="true">
                  {left}
                </span>
              )}
            </span>
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
