// Direction: a retail ledger on a calm base. Light neutral screens and near-black type; the offer
// is the number, set large, with the product and expiry under it. Teal is the brand (header and
// the one primary action); a single shelf-tag yellow marks what is loaded, earned or ready.
//
// Anonymized grocer-loyalty member app (constitution art. 3 + 6): invented brand, mocked data.
// The member is signed in and their loyalty account is already linked. Hosts place this inside
// their own phone frame; they don't restyle its internals.
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Icon, type IconName } from './art';
import '../kit.css';
import './grocer.css';

type Tab = 'home' | 'offers' | 'lists' | 'recipes';

// An offer earns bonus points, or (`save`) takes dollars off at the till.
type Offer = { id: string; title: string; points: number; save?: number; ends: string };
type Item = { id: string; name: string; qty: string; done: boolean; offer?: string };

const member = {
  first: 'Sam',
  points: 4_650,
  rewardAt: 5_000,
  reward: '$10 off your shop',
  short: '$10 off',
};
// Base earn for every item bought, on top of any loaded offer.
const PER_ITEM = 10;

type Shop = {
  items: number;
  base: number;
  bonus: { title: string; points: number; save?: number }[];
  balance: number;
  unlocked: boolean;
};

const offers: Offer[] = [
  { id: 'cereal', title: 'Buy any cereal', points: 50, ends: 'Sun' },
  { id: 'yogurt', title: 'Any 2 Greek yogurts', points: 75, ends: 'Sat' },
  { id: 'berries', title: 'Spend $8 on fresh berries', points: 100, ends: 'Fri' },
  { id: 'coffee', title: 'Any whole-bean coffee', points: 120, ends: 'Sun' },
  { id: 'bread', title: 'Any sourdough loaf', points: 0, save: 2, ends: 'Thu' },
];
const hero = (o: Offer) => (o.save ? `$${o.save}` : `+${o.points}`);
const unit = (o: Offer) => (o.save ? 'off' : 'pts');
const tagOf = (o: Offer) => (o.save ? `$${o.save} off` : `+${o.points} pts`);
const worth = (o: Offer) => (o.save ? `$${o.save} off` : `plus ${o.points} points`);
// Home shows a short run of the biggest bonuses not yet loaded at the start.
const PICKS = ['berries', 'yogurt'];

// Aisles, in walking order through the store. Each group is named, never colour-coded.
const AISLES = [
  { name: 'Produce', no: 1 },
  { name: 'Bakery', no: 3 },
  { name: 'Pantry', no: 5 },
  { name: 'Dairy', no: 8 },
] as const;
type Aisle = (typeof AISLES)[number]['name'];
const AISLE_OF: Record<string, Aisle> = {
  bananas: 'Produce',
  berries: 'Produce',
  milk: 'Dairy',
  'greek yogurt': 'Dairy',
  'sourdough bread': 'Bakery',
};
const aisleOf = (name: string): Aisle => AISLE_OF[name.toLowerCase()] ?? 'Pantry';

const startList: Item[] = [
  { id: 'i1', name: 'Bananas', qty: '1 bunch', done: false },
  { id: 'i2', name: 'Cereal', qty: '1 box', done: false, offer: 'cereal' },
  { id: 'i3', name: 'Milk', qty: '2 L', done: false },
  { id: 'i4', name: 'Coffee beans', qty: '340 g', done: false, offer: 'coffee' },
  { id: 'i5', name: 'Sourdough bread', qty: '1 loaf', done: true, offer: 'bread' },
];

const recipe = {
  kind: 'Breakfast',
  title: 'Overnight oats with berries',
  prep: '10 min',
  serves: '2',
  ingredients: [
    { name: 'Rolled oats', qty: '1 cup', buy: '1 bag' },
    { name: 'Greek yogurt', qty: '½ cup', buy: '2 tubs', offer: 'yogurt' },
    { name: 'Milk', qty: '¾ cup', buy: '1 L' },
    { name: 'Berries', qty: '1 cup', buy: '2 pints', offer: 'berries' },
    { name: 'Maple syrup', qty: '1 tbsp', buy: '1 bottle' },
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
  const toGo = Math.max(member.rewardAt - points, 0);
  const left = list.filter((i) => !i.done);
  const inBasket = list.filter((i) => i.done);
  const onList = (name: string) => list.some((i) => same(i.name, name));
  const open = offers.filter((o) => !used.includes(o.id));
  const loadedOpen = open.filter((o) => loaded.includes(o.id));
  const loadedPts = loadedOpen.reduce((n, o) => n + o.points, 0);
  const loadedSave = loadedOpen.reduce((n, o) => n + (o.save ?? 0), 0);
  const picks = open.filter((o) => PICKS.includes(o.id));
  const offerState = (o: Offer) =>
    used.includes(o.id) ? 'earned' : loaded.includes(o.id) ? 'loaded' : 'not loaded';
  const allLoaded = open.length > 0 && loadedOpen.length === open.length;
  const estimate =
    inBasket.length * PER_ITEM +
    offers
      .filter((o) => loaded.includes(o.id) && inBasket.some((i) => i.offer === o.id))
      .reduce((n, o) => n + o.points, 0);

  // The reward bar fills once, the first time Home is seen.
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
      .map((o) => ({ title: o.title, points: o.points, save: o.save }));
    const base = inBasket.length * PER_ITEM;
    const earned = base + bonus.reduce((n, b) => n + b.points, 0);
    const saved = bonus.reduce((n, b) => n + (b.save ?? 0), 0);
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
        (saved ? `, and $${saved} off` : '') +
        `. Balance ${fmt(total)}.` +
        (unlocked ? ` Reward earned: ${member.reward}.` : ''),
    );
  }

  function toggleOffer(o: Offer) {
    const isLoaded = loaded.includes(o.id);
    const next = isLoaded ? loaded.filter((id) => id !== o.id) : [...loaded, o.id];
    setLoaded(next);
    const pts = open.filter((x) => next.includes(x.id)).reduce((n, x) => n + x.points, 0);
    setAnnounce(
      `${isLoaded ? 'Removed' : 'Loaded'} offer: ${o.title}, ${worth(o)}. ` +
        `${next.length} of ${open.length} offers loaded, plus ${pts} points in all.`,
    );
  }

  function loadAll() {
    if (allLoaded || !open.length) return;
    const next = [...new Set([...loaded, ...open.map((o) => o.id)])];
    setLoaded(next);
    setAnnounce(
      `Loaded all ${open.length} offers, plus ${open.reduce((n, o) => n + o.points, 0)} points in all.`,
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
        qty: g.buy,
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

  /** One offer as a ledger row: the bonus first and largest, then the product, then the date.
   *  The Load button keeps its size and name; only its fill and label change in place. */
  function offerRow(o: Offer) {
    const on = loaded.includes(o.id);
    const done = used.includes(o.id);
    return (
      <li key={o.id} className={`gro-offer${on ? ' is-on' : ''}${done ? ' is-done' : ''}`}>
        <span className="gro-bonus">
          {hero(o)}
          <span className="gro-bonus-u"> {unit(o)}</span>
        </span>
        <span className="gro-offer-main">
          <span className="gro-offer-t">{o.title}</span>
          <span className="gro-cap">{done ? 'Used on your last shop' : `Ends ${o.ends}`}</span>
        </span>
        {done ? (
          <span className="gro-earned-tag">
            <Icon name="check" size={16} />
            Earned
          </span>
        ) : (
          <button
            type="button"
            className="gro-load"
            aria-pressed={on}
            onClick={() => toggleOffer(o)}
          >
            <span className="gro-load-off" aria-hidden="true">
              Load
            </span>
            <span className="gro-load-on" aria-hidden="true">
              <Icon name="check" size={16} />
              Loaded
            </span>
            <span className="dk-sr">Load offer: {o.title}</span>
          </button>
        )}
      </li>
    );
  }

  const ledger = (shop: Shop) => (
    <ul className="gro-ledger">
      <li>
        <span>
          {shop.items} {shop.items === 1 ? 'item' : 'items'} × {PER_ITEM} pts
        </span>
        <span>+{shop.base}</span>
      </li>
      {shop.bonus.map((b) => (
        <li key={b.title}>
          <span>Offer: {b.title}</span>
          <span>{b.save ? `$${b.save}.00 off` : `+${b.points}`}</span>
        </li>
      ))}
    </ul>
  );

  const bar = { '--p': progress } as CSSProperties;

  return (
    <div className="gro-app" aria-label="Demo: grocer loyalty app (mock data)" role="group">
      <header className="gro-top">
        <span className="gro-brand">Pantry Lane</span>
        <span className="gro-store">
          <Icon name="pin" size={16} />
          Elm St
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
            <div role="group" className="gro-balance" aria-label="Points balance">
              <p className="gro-label">Hi {member.first} · Pantry Points</p>
              <p className="gro-points">
                {fmt(points)}
                <span className="gro-points-u"> pts</span>
              </p>
              <div className="gro-goal">
                <p id={`${base}-goal`} className={rewardReady ? 'is-ready' : undefined}>
                  {rewardReady ? (
                    <>
                      <span className="gro-mark">Reward ready</span> {member.short} your next shop
                    </>
                  ) : (
                    <>
                      <strong>{fmt(toGo)} pts</strong> to {member.short}
                    </>
                  )}
                </p>
                {!rewardReady && (
                  <span className="gro-cap" aria-hidden="true">
                    {fmt(member.rewardAt)}
                  </span>
                )}
              </div>
              <div
                className="gro-bar"
                role="progressbar"
                aria-labelledby={`${base}-goal`}
                aria-valuemin={0}
                aria-valuemax={member.rewardAt}
                aria-valuenow={Math.min(points, member.rewardAt)}
                aria-valuetext={`${fmt(points)} of ${fmt(member.rewardAt)} points`}
                style={bar}
              >
                <span />
              </div>
            </div>

            {lastShop && (
              <div role="group" className="gro-group gro-last" aria-label="Your last shop">
                <span>
                  Last shop{' '}
                  <strong>
                    +{lastShop.base + lastShop.bonus.reduce((n, b) => n + b.points, 0)} pts
                  </strong>
                </span>
                <button type="button" className="gro-link" onClick={() => go('lists')}>
                  View receipt
                </button>
              </div>
            )}

            <div role="group" className="gro-picks" aria-labelledby={`${base}-picks`}>
              <div className="gro-sec-h">
                <p id={`${base}-picks`}>Picked for you</p>
                <button type="button" className="gro-link" onClick={() => go('offers')}>
                  See all {offers.length}
                </button>
              </div>
              {picks.length > 0 && (
                <ul className="gro-offers" aria-label="Offers picked for you">
                  {picks.map(offerRow)}
                </ul>
              )}
              <p className="gro-cap">
                {used.length === offers.length
                  ? `All ${offers.length} offers earned this week · new ones Monday`
                  : `${loadedOpen.length} of ${open.length} offers loaded · +${loadedPts} pts waiting`}
              </p>
            </div>

            <div role="group" className="gro-next" aria-labelledby={`${base}-next`}>
              <div className="gro-sec-h">
                <p id={`${base}-next`}>Your list</p>
                <button type="button" className="gro-link" onClick={() => go('lists')}>
                  Open list
                </button>
              </div>
              {left.length > 0 && (
                <ul className="gro-group gro-peek">
                  {left.slice(0, 3).map((i) => (
                    <li key={i.id}>
                      <span>{i.name}</span>
                      <span className="gro-cap">{aisleOf(i.name)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="gro-cap">
                {left.length === 0
                  ? list.length
                    ? 'Everything is in the basket'
                    : 'Nothing on it yet'
                  : left.length > 3
                    ? `${left.length} to get · ${left.length - 3} more on the list`
                    : `${left.length} to get`}
              </p>
            </div>
          </div>
        )}

        {tab === 'offers' && (
          <div className="gro-page">
            <div role="group" className="gro-tally" aria-label="Loaded offers">
              <div>
                <p className="gro-label">Loaded</p>
                <p className={`gro-tally-n${loadedOpen.length ? ' is-on' : ''}`}>
                  +{loadedPts}
                  <span className="gro-points-u">
                    {' '}
                    pts{loadedSave > 0 && ` + $${loadedSave} off`}
                  </span>
                </p>
              </div>
              <div className="gro-tally-side">
                <span className="gro-cap">
                  {open.length
                    ? `${loadedOpen.length} of ${open.length} offers`
                    : `All ${offers.length} earned`}
                </span>
                {open.length > 0 && (
                  <button
                    type="button"
                    className="gro-link"
                    aria-disabled={allLoaded || undefined}
                    onClick={loadAll}
                  >
                    {allLoaded ? 'All loaded' : 'Load all'}
                  </button>
                )}
              </div>
            </div>
            <ul className="gro-offers" aria-label="Personalized offers">
              {offers.map(offerRow)}
            </ul>
            <p className="gro-cap gro-foot">Loaded offers apply when you scan your card.</p>
          </div>
        )}

        {tab === 'lists' && (
          <div className="gro-page">
            {lastShop && (
              <div role="group" className="gro-receipt" aria-label="Receipt">
                <div className="gro-receipt-head">
                  <strong>Pantry Lane · Elm St</strong>
                  <span className="gro-cap">Receipt · points earned</span>
                </div>
                {ledger(lastShop)}
                <ul className="gro-ledger gro-ledger-sum">
                  <li>
                    <span>Points earned</span>
                    <span>+{lastShop.base + lastShop.bonus.reduce((n, b) => n + b.points, 0)}</span>
                  </li>
                  <li>
                    <span>New balance</span>
                    <span>{fmt(lastShop.balance)}</span>
                  </li>
                </ul>
                {lastShop.unlocked && (
                  <p className="gro-unlock">
                    <strong>Reward unlocked</strong>
                    <span>{member.reward}, applied at your next checkout</span>
                  </p>
                )}
              </div>
            )}

            {lastShop && list.length === 0 ? (
              <div className="gro-empty">
                <p>Basket checked out. Add a recipe’s ingredients to start the next shop.</p>
                <button type="button" className="gro-link" onClick={() => go('recipes')}>
                  See this week’s recipe
                </button>
              </div>
            ) : (
              <div role="group" className="gro-shop" aria-labelledby={`${base}-list-h`}>
                <div className="gro-sec-h">
                  <p id={`${base}-list-h`}>Weekly shop</p>
                  <span className="gro-cap">
                    {left.length} of {list.length} left
                  </span>
                </div>
                <div className="gro-group gro-listbox">
                  {AISLES.map((aisle) => {
                    const items = list.filter((i) => aisleOf(i.name) === aisle.name);
                    if (!items.length) return null;
                    return (
                      <div key={aisle.name} className="gro-aisle">
                        <p className="gro-aisle-h" id={`${base}-aisle-${aisle.no}`}>
                          {aisle.name}
                          <span className="gro-cap">Aisle {aisle.no}</span>
                        </p>
                        <ul className="gro-list" aria-labelledby={`${base}-aisle-${aisle.no}`}>
                          {items.map((i) => {
                            const o = offerById(i.offer);
                            const hintId = `${base}-hint-${i.id}`;
                            const state = o ? offerState(o) : '';
                            return (
                              <li key={i.id} className={i.done ? 'is-done' : undefined}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={i.done}
                                    onChange={() => tick(i.id)}
                                    aria-describedby={o ? hintId : undefined}
                                  />
                                  <span className="gro-item">
                                    <span className="gro-item-n">{i.name}</span>
                                    {o && (
                                      <span
                                        id={hintId}
                                        aria-hidden="true"
                                        className={`gro-hint${state === 'not loaded' ? '' : ' is-on'}`}
                                      >
                                        Offer <span className="gro-hint-pts">{tagOf(o)}</span> ·{' '}
                                        {state}
                                      </span>
                                    )}
                                  </span>
                                  <span className="gro-qty">{i.qty}</span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
                {list.length === 0 && (
                  <p className="gro-empty">
                    Your list is empty. Add a recipe’s ingredients to start the next shop.
                  </p>
                )}
                <div className="gro-checkout">
                  <span className="gro-cap">
                    {inBasket.length
                      ? `${inBasket.length} ${inBasket.length === 1 ? 'item' : 'items'} · about +${estimate} pts`
                      : 'Basket is empty'}
                  </span>
                  <button type="button" className="gro-cta" onClick={checkout}>
                    Check out {inBasket.length > 0 && `(${inBasket.length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'recipes' && (
          <div role="group" className="gro-page gro-recipe" aria-labelledby={`${base}-recipe-h`}>
            <p className="gro-label">{recipe.kind} · Recipe of the week</p>
            <p id={`${base}-recipe-h`} className="gro-recipe-t">
              {recipe.title}
            </p>
            <dl className="gro-facts">
              <div>
                <dt>Prep</dt>
                <dd>{recipe.prep}</dd>
              </div>
              <div>
                <dt>Serves</dt>
                <dd>{recipe.serves}</dd>
              </div>
              <div>
                <dt>In offers</dt>
                <dd>+{recipeBonus} pts</dd>
              </div>
            </dl>
            <ul className="gro-group gro-ingredients" aria-label="Ingredients">
              {recipe.ingredients.map((g) => {
                const o = offerById(g.offer);
                const has = onList(g.name);
                return (
                  <li key={g.name}>
                    <span className="gro-qty">{g.qty}</span>
                    <span className="gro-ing">
                      {g.name}
                      {o && (
                        <span
                          className={`gro-hint${offerState(o) === 'not loaded' ? '' : ' is-on'}`}
                        >
                          Offer <span className="gro-hint-pts">{tagOf(o)}</span> · {offerState(o)}
                        </span>
                      )}
                    </span>
                    {has && (
                      <span className="gro-onlist">
                        <Icon name="check" size={16} />
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
              {t.id === 'offers' && loadedOpen.length > 0 && (
                <span className="gro-badge" aria-hidden="true">
                  {loadedOpen.length}
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
