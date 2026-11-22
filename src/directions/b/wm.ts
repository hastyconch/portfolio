// Direction B window manager — progressive enhancement over CSS :target windows.
//
// Without JS: each section window is shown when its id is the URL fragment; its close control is
// a link home. With JS:
//   desktop (≥1024px): non-modal role="dialog" windows, several open at once, click/focus to
//     raise, drag by the title bar (optional — the zoom button is the single-pointer
//     alternative, WCAG 2.5.7), Escape closes, focus returns to whatever opened the window.
//   phone: one full-screen modal sheet at a time (aria-modal, rest of the page inert), browser
//     Back closes it, Escape closes it, focus returns to the opener.
// Also: lyric-note Escape handling, click-to-load embeds, the menu-bar clock, résumé printing.

const DESKTOP = window.matchMedia('(min-width: 1024px)');
const root = document.documentElement;
const wins = new Map<string, HTMLElement>();
document.querySelectorAll<HTMLElement>('[data-win]').forEach((w) => wins.set(w.id, w));
const openers = new WeakMap<HTMLElement, HTMLElement | null>();
let z = 100; // desktop windows stack from 100 up; menu bar and dock sit at 10000

const isOpen = (w?: HTMLElement | null) => !!w && w.classList.contains('is-open');
const openWins = () => [...wins.values()].filter(isOpen);
const topmost = () =>
  openWins().sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0))[0];

/** The window that owns the current URL fragment (the window itself or something inside it). */
function hashOwner(): HTMLElement | null {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return null;
  const el = document.getElementById(id);
  return (el?.closest<HTMLElement>('[data-win]') as HTMLElement | null) ?? null;
}

function setHash(id: string | null) {
  const url = id ? `#${id}` : location.pathname + location.search;
  history.replaceState(history.state, '', url);
}

function applyRole(w: HTMLElement) {
  w.setAttribute('role', 'dialog');
  if (DESKTOP.matches) w.removeAttribute('aria-modal');
  else w.setAttribute('aria-modal', 'true');
}

function sync() {
  const sheet = !DESKTOP.matches && openWins().length > 0;
  root.classList.toggle('sheet-open', sheet);
  document.querySelectorAll<HTMLElement>('[data-bg]').forEach((el) => (el.inert = sheet));
  document.querySelectorAll<HTMLElement>('a[data-app]').forEach((a) => {
    const on = isOpen(wins.get(a.dataset.app ?? ''));
    a.classList.toggle('is-running', on);
  });
  const front = topmost();
  wins.forEach((w) => w.classList.toggle('is-front', w === front));
}

function raise(w: HTMLElement) {
  if (w.style.zIndex !== String(z)) w.style.zIndex = String(++z);
  sync();
}

function open(
  id: string,
  opener: HTMLElement | null,
  opts: { focus?: boolean; push?: boolean } = {},
) {
  const { focus = true, push = true } = opts;
  const w = wins.get(id);
  if (!w) return;
  if (!DESKTOP.matches) {
    openWins().forEach((o) => o !== w && close(o, { restore: false }));
  }
  if (!isOpen(w)) openers.set(w, opener);
  w.classList.add('is-open');
  w.classList.remove('is-closed');
  applyRole(w);
  raise(w);
  if (focus) w.querySelector<HTMLElement>('.win-title')?.focus({ preventScroll: true });
  if (!DESKTOP.matches && push) history.pushState({ win: id }, '', `#${id}`);
  else if (hashOwner() !== w) setHash(id);
}

function close(w: HTMLElement, opts: { restore?: boolean } = {}) {
  const { restore = true } = opts;
  if (!isOpen(w)) return;
  w.classList.remove('is-open', 'is-front');
  w.classList.add('is-closed');
  w.style.zIndex = '';
  sync();
  if (restore) {
    const o = openers.get(w);
    const visible = (el: HTMLElement | null | undefined) =>
      !!el && el.isConnected && el.getClientRects().length > 0 && !el.closest('[inert]');
    const fallback = document.querySelector<HTMLElement>(`.dock a[data-app="${w.id}"]`);
    const next = topmost();
    const target = visible(o) ? o : next ? next.querySelector<HTMLElement>('.win-title') : fallback;
    target?.focus({ preventScroll: !visible(o) });
  }
  const next = topmost();
  setHash(next ? next.id : null);
}

/** Close from UI (button, Escape). On phones a sheet we pushed is closed via history.back(). */
function requestClose(w: HTMLElement) {
  if (!DESKTOP.matches && history.state?.win === w.id) history.back();
  else close(w);
}

// ── Links: section links open windows; close links close them; "#hero" shows the desktop.
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const id = decodeURIComponent(a.getAttribute('href')!.slice(1));
  const inWin = a.closest<HTMLElement>('[data-win]');
  if (a.hasAttribute('data-close') && inWin) {
    e.preventDefault();
    requestClose(inWin);
    return;
  }
  if (id === 'hero') {
    e.preventDefault();
    const all = openWins();
    if (!DESKTOP.matches && all.length && history.state?.win) history.back();
    else all.forEach((w) => close(w, { restore: false }));
    document.getElementById('hero-name')?.scrollIntoView({ block: 'center' });
    return;
  }
  const w = wins.get(id);
  if (!w) return; // in-window anchors (#w-…, #song-…) navigate natively
  e.preventDefault();
  if (isOpen(w)) {
    raise(w);
    w.querySelector<HTMLElement>('.win-title')?.focus({ preventScroll: true });
  } else open(id, a);
});

// Close links behave as buttons once JS runs (Space activates them too).
document.querySelectorAll<HTMLElement>('[data-close]').forEach((c) => {
  c.setAttribute('role', 'button');
  c.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      c.click();
    }
  });
});

// ── Keyboard: Escape closes the open lyric note first, then the focused / front window.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  const t = e.target as Element;
  const note = t.closest?.<HTMLDetailsElement>('details.lyr[open]');
  if (note) {
    e.preventDefault();
    note.open = false;
    note.querySelector<HTMLElement>('summary')?.focus();
    return;
  }
  const w = t.closest?.<HTMLElement>('[data-win].is-open') ?? topmost();
  if (w) {
    e.preventDefault();
    requestClose(w);
  }
});

// ── Browser Back/Forward and in-page anchors.
window.addEventListener('popstate', () => {
  const owner = hashOwner();
  if (!DESKTOP.matches) {
    openWins().forEach((w) => w !== owner && close(w));
  }
  if (owner && !isOpen(owner)) open(owner.id, null, { focus: false, push: false });
});
window.addEventListener('hashchange', () => {
  const owner = hashOwner();
  if (owner && !isOpen(owner)) open(owner.id, null, { focus: false, push: false });
});

// ── Raise on interaction, drag by title bar, zoom.
wins.forEach((w) => {
  w.addEventListener('pointerdown', () => DESKTOP.matches && raise(w));
  w.addEventListener('focusin', () => DESKTOP.matches && isOpen(w) && raise(w));

  const zoom = w.querySelector<HTMLButtonElement>('[data-zoom]');
  const label = zoom?.querySelector('.visually-hidden');
  const name = w.querySelector('.win-title')?.textContent?.trim() ?? '';
  const toggleMax = () => {
    const max = w.classList.toggle('is-max');
    zoom?.setAttribute('aria-pressed', String(max));
    if (label) label.textContent = `${max ? 'Restore' : 'Maximize'} ${name}`;
  };
  if (zoom) {
    zoom.hidden = false;
    zoom.addEventListener('click', toggleMax);
  }

  const bar = w.querySelector<HTMLElement>('[data-drag]');
  if (!bar) return;
  bar.addEventListener('dblclick', (e) => {
    if (DESKTOP.matches && !(e.target as Element).closest('a,button')) toggleMax();
  });
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;
  let rect: DOMRect | null = null;
  bar.addEventListener('pointerdown', (e) => {
    if (!DESKTOP.matches || e.button !== 0 || w.classList.contains('is-max')) return;
    if ((e.target as Element).closest('a,button')) return;
    rect = w.getBoundingClientRect();
    sx = e.clientX;
    sy = e.clientY;
    ox = parseFloat(w.style.getPropertyValue('--dx')) || 0;
    oy = parseFloat(w.style.getPropertyValue('--dy')) || 0;
    bar.setPointerCapture(e.pointerId);
    w.classList.add('is-dragging');
  });
  bar.addEventListener('pointermove', (e) => {
    if (!rect || !bar.hasPointerCapture(e.pointerId)) return;
    // Keep at least the title bar on screen, below the menu bar.
    const dx = Math.min(
      Math.max(e.clientX - sx, 120 - rect.right),
      window.innerWidth - 120 - rect.left,
    );
    const dy = Math.min(
      Math.max(e.clientY - sy, 40 - rect.top),
      window.innerHeight - 64 - rect.top,
    );
    w.style.setProperty('--dx', `${ox + dx}px`);
    w.style.setProperty('--dy', `${oy + dy}px`);
  });
  const end = (e: PointerEvent) => {
    if (bar.hasPointerCapture(e.pointerId)) bar.releasePointerCapture(e.pointerId);
    rect = null;
    w.classList.remove('is-dragging');
  };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
});

DESKTOP.addEventListener('change', () => {
  const open = openWins();
  if (!DESKTOP.matches) {
    const front = topmost();
    open.forEach((w) => w !== front && close(w, { restore: false }));
  }
  openWins().forEach(applyRole);
  sync();
});

// ── Click-to-load embeds (no third-party request until the visitor asks).
document.querySelectorAll<HTMLButtonElement>('[data-embed]').forEach((b) => {
  b.addEventListener('click', () => {
    const box = b.closest<HTMLElement>('[data-embed-box]');
    if (!box) return;
    const f = document.createElement('iframe');
    f.src = b.dataset.embed ?? '';
    f.title = b.dataset.embedTitle ?? 'Embedded player';
    f.loading = 'lazy';
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.className = 'embed-frame';
    f.tabIndex = 0;
    b.replaceWith(f);
    f.focus();
  });
});

// ── Menu-bar clock (visitor's local time) and JS-only tools.
const clocks = document.querySelectorAll<HTMLElement>('[data-clock]');
const fmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
const tick = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())));
if (clocks.length) {
  tick();
  setInterval(tick, 15_000);
}
document.querySelectorAll<HTMLElement>('[data-js-only]').forEach((el) => (el.hidden = false));
document
  .querySelectorAll('[data-print]')
  .forEach((b) => b.addEventListener('click', () => window.print()));

// ── Initial state: a deep link (#work, #song-…) opens its window without stealing focus.
const initial = hashOwner();
if (initial) open(initial.id, null, { focus: false, push: false });
sync();
