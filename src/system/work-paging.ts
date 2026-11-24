// Work panes lock in (WO-034, reversing WO-023's removal at the owner's request). On laptops (a
// fine pointer, 760px and up) one wheel or trackpad gesture moves exactly one demo pane, and the
// new pane's top lands flush under the header in a short ease-out (instant under reduced motion).
//
// Why a script and not `scroll-snap-type: y mandatory`: mandatory snapping on the root needs snap
// points over the whole page (or it pulls the hero and Projects onto a pane), it can snap back to
// the pane a short gesture started in (the WO-023 trap), and how far one trackpad fling carries
// differs between Chromium, Firefox and Safari. The script decides from the scroll position and
// the gesture's direction only, so:
// - it never moves against the gesture: down goes to the next pane's top, up to the one above;
// - one gesture moves one pane: the rest of that gesture (a run of notches, a trackpad's trailing
//   inertia) is swallowed until the wheel pauses, reverses or a new swipe starts;
// - it never skips content: it only jumps to a pane whose top is at most one view away, so a pane
//   taller than the view scrolls natively until its end is on screen;
// - past the last pane, and up from the first, the page scrolls natively; coming in from above
//   (or back up from below), it locks onto the pane once that pane's top is near the header;
// - a demo part that scrolls on its own (a screen, a table) scrolls first; paging happens only
//   when it can't scroll further that way;
// - keys, the scrollbar, touch and the header's stepper are untouched: only wheel events are read.
// The one wheel listener is not passive, because it calls preventDefault on the events it uses.

const panes = [...document.querySelectorAll<HTMLElement>('#work .wk')];
const laptop = matchMedia('(min-width: 760px) and (pointer: fine)');
const still = matchMedia('(prefers-reduced-motion: reduce)');

// A wheel pause this long ends a gesture. Notches spun in one go and a trackpad's inertia arrive
// closer together than this.
const PAUSE = 180;
// The move's length, inside the spec's "about 450ms".
const DURATION = 420;
// Slack for sub-pixel layout when comparing scroll positions.
const SLACK = 4;
// A pane taller than the view by this much still pages in one jump (only its bottom padding is
// passed over).
const OVER = 24;

let locked = false; // the current gesture has already moved a pane
let dir = 0;
let last = -Infinity;
let deltas: number[] = [];
let frame = 0;
let moving = false;

const ease = (t: number) => 1 - Math.pow(1 - t, 4); // a quart ease-out, close to --ease-out
// Where a pane's top rests: the same place a jump or the header's stepper puts it (the root's
// scroll padding plus the pane's scroll margin, flush under the header).
const flush = () =>
  parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) +
  parseFloat(getComputedStyle(panes[0]).scrollMarginTop);
// Scroll positions that put each pane's top there.
const tops = () => {
  const h = flush();
  return panes.map((p) => Math.round(p.getBoundingClientRect().top + scrollY - h));
};

// The scroll position this gesture should move to, or null to leave it to the browser.
function target(down: boolean): number | null {
  const y = scrollY;
  const t = tops();
  const view = innerHeight - flush();
  const near = view / 3;
  const first = t[0];
  const end = t[t.length - 1];
  if (down) {
    if (y < first - SLACK) return first - y <= near ? first : null; // lock in from above
    if (y >= end - SLACK) return null; // the last pane: leave normally
    const next = t.find((p) => p > y + SLACK)!;
    return next - y <= view + OVER ? next : null;
  }
  if (y <= first + SLACK) return null; // the first pane: back to the hero normally
  if (y > end + SLACK) return y - end <= near ? end : null; // back up into the last pane
  let prev = first;
  for (const p of t) if (p < y - SLACK) prev = p;
  return y - prev <= view + OVER ? prev : null;
}

// Whether something under the pointer, inside the Work list, can still scroll this way itself.
function inner(el: EventTarget | null, down: boolean): boolean {
  if (!(el instanceof Element) || !el.closest('#work')) return false;
  for (let n: Element | null = el; n && n.id !== 'work'; n = n.parentElement) {
    if (n.scrollHeight <= n.clientHeight + 1) continue;
    const oy = getComputedStyle(n).overflowY;
    if (oy !== 'auto' && oy !== 'scroll') continue;
    if (down ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0) return true;
  }
  return false;
}

function move(to: number) {
  cancelAnimationFrame(frame);
  const max = document.documentElement.scrollHeight - innerHeight;
  const end = Math.max(0, Math.min(to, max));
  if (still.matches) {
    scrollTo({ top: end, behavior: 'instant' });
    return;
  }
  const from = scrollY;
  const t0 = performance.now();
  let at = from;
  moving = true;
  const step = (now: number) => {
    // Something else moved the page (keys, the scrollbar, the stepper): let it.
    if (Math.abs(scrollY - at) > 2) return void (moving = false);
    const k = Math.min(1, (now - t0) / DURATION);
    at = Math.round(from + (end - from) * ease(k));
    scrollTo({ top: at, behavior: 'instant' });
    if (k < 1) frame = requestAnimationFrame(step);
    else moving = false;
  };
  frame = requestAnimationFrame(step);
}

// A new swipe during a trackpad's inertia: the deltas jump up instead of dying away.
function rising(d: number) {
  if (deltas.length < 3) return false;
  const avg = deltas.slice(-3).reduce((a, b) => a + b, 0) / 3;
  return d >= 16 && d > avg * 2;
}

function onWheel(e: WheelEvent) {
  if (!laptop.matches || e.ctrlKey || e.defaultPrevented) return;
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
  const dy = e.deltaY * unit;
  if (!dy || Math.abs(e.deltaX * unit) > Math.abs(dy)) return;
  const d = Math.sign(dy);
  const size = Math.abs(dy);
  const now = e.timeStamp;

  if (locked) {
    const fresh = now - last > PAUSE || (!moving && (d !== dir || rising(size)));
    if (!fresh) {
      last = now;
      deltas.push(size);
      e.preventDefault();
      return;
    }
    locked = false;
  }
  last = now;
  deltas = [size];
  if (inner(e.target, d > 0)) return;
  const to = target(d > 0);
  if (to === null || Math.abs(to - scrollY) < 1) return;
  e.preventDefault();
  locked = true;
  dir = d;
  move(to);
}

if (panes.length > 1) addEventListener('wheel', onWheel, { passive: false });
