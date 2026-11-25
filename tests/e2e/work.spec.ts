import { test, expect, type Page } from '@playwright/test';

// WO-015: on laptops each demo engagement is one pane, one viewport tall below the sticky nav.
// The page scrolls freely: WO-023 removed the vertical snap. Skill badges are text, never focusable.

/** Wait until the page has stopped scrolling (a smooth scroll has landed). */
async function settle(page: Page) {
  let last = -1;
  await expect
    .poll(
      async () => {
        const y = await page.evaluate(() => window.scrollY);
        const still = y === last;
        last = y;
        return still;
      },
      { intervals: [150] },
    )
    .toBe(true);
}

async function navHeight(page: Page) {
  return page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ln-header')),
  );
}

test('work engagements fit one viewport at 1440x900', async ({ page, isMobile }) => {
  test.skip(isMobile, 'laptop layout');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = await navHeight(page);
  expect(nav).toBeGreaterThan(0);
  const panes = page.locator('#work .wk');
  const count = await panes.count();
  expect(count).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < count; i++) {
    const pane = panes.nth(i);
    await pane.scrollIntoViewIfNeeded();
    const article = pane.locator('article');
    // Title, meta, story and demo all sit inside the article.
    await expect(article.locator('.wk-title')).toBeVisible();
    await expect(article.locator('.wk-meta')).toBeVisible();
    await expect(article.locator('.wk-summary')).toBeVisible();
    await expect(article.locator('.df-device')).toBeVisible();
    const box = await article.boundingBox();
    expect(box, `pane ${i + 1} has a box`).not.toBeNull();
    expect(box!.height, `pane ${i + 1} fits below the nav`).toBeLessThanOrEqual(900 - nav + 1);
    // The demo frame stays inside its pane.
    const frame = await article.locator('.df').boundingBox();
    expect(frame!.y + frame!.height).toBeLessThanOrEqual(box!.y + box!.height + 1);
  }
});

// WO-023: no page-level vertical snap at any size. Proximity snapping on viewport-tall panes
// trapped the wheel; the header's stepper moves pane to pane instead.
test('work has no vertical snap', async ({ page }) => {
  await page.goto('/');
  const snap = () =>
    page.evaluate(() => ({
      root: getComputedStyle(document.documentElement).scrollSnapType,
      aligned: [
        ...document.querySelectorAll('#work .wk, section, .wk-item, .wk-more, header, footer'),
      ]
        .map((el) => getComputedStyle(el).scrollSnapAlign)
        .filter((a) => a !== 'none'),
    }));
  for (const [width, height] of [
    [375, 812],
    [740, 900],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    expect(await snap(), `${width}x${height}`).toEqual({ root: 'none', aligned: [] });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await snap()).root).toBe('none');
});

test('work wheel is never trapped', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'a mouse wheel');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = await navHeight(page);
  await page.evaluate((nav) => {
    const pane = document.querySelector('#work .wk') as HTMLElement;
    const top = pane.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - nav, behavior: 'instant' });
  }, nav);
  const start = await page.evaluate(() => window.scrollY);
  // Five 100px notches from the top of pane 1, over its story column.
  await page.mouse.move(300, 500);
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(60);
  }
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(start + 400);
  // It does not snap back.
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(start + 400);
});

// WO-025: the wide demos' frames don't trap the wheel. With the pointer over the Scheduler or the
// Pipeline, the page keeps scrolling: a frame its content fits doesn't scroll at all, and there is
// no overscroll containment. WO-034: from the pane's top, the wheel pages on to the next pane (the
// Scheduler) or, past the last pane (the Pipeline), scrolls the page natively.
const WIDE = ['.df-screen:has(.sch-app)', '.df-screen:has(.pl)'];

test('work wheel passes over demos', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'a mouse wheel');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  for (const sel of WIDE) {
    const screen = page.locator(`#work ${sel}`);
    await screen.evaluate((s) =>
      s.closest('.wk')!.scrollIntoView({ block: 'start', behavior: 'instant' }),
    );
    await expect(screen.locator('astro-island')).not.toHaveAttribute('ssr');
    const box = (await screen.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, Math.max(box.y + 60, 200));
    const start = await page.evaluate(() => window.scrollY);
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(60);
    }
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { message: `wheel over ${sel}` })
      .toBeGreaterThanOrEqual(start + 800);
    // Let the gesture end before the next one: a run of notches without a pause is one gesture.
    await page.waitForTimeout(600);
  }
});

test('work swipe passes over demos', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'a touch swipe on a phone');
  await page.goto('/');
  const screen = page.locator(`#work ${WIDE[0]}`);
  const article = page.locator('#work article').filter({ has: page.locator('.sch-app') });
  await article.getByRole('button', { name: /^Try the demo/ }).click();
  await expect(screen.locator('astro-island')).not.toHaveAttribute('ssr');
  // Put a point 150px into the expanded scheduler at y = 600, then swipe up 300px from there.
  await page.evaluate((sel) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const top = document.querySelector(sel)!.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + 150 - 600);
  }, `#work ${WIDE[0]}`);
  const start = await page.evaluate(() => window.scrollY);
  expect(
    await page.evaluate(() => !!document.elementFromPoint(187, 600)?.closest('.df-screen')),
    'the swipe starts over the demo',
  ).toBe(true);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 187, y: 600 }],
  });
  for (let i = 1; i <= 15; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 187, y: 600 - i * 20 }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(start + 200);
});

test('skill badges are text, not controls', async ({ page, isMobile }) => {
  await page.goto('/');
  // WO-040: on phones the skills wait behind Details.
  if (isMobile)
    await page.getByRole('button', { name: 'Details: Airline loyalty program' }).click();
  const badges = page.locator('#work .wk-badges li');
  expect(await badges.count()).toBeGreaterThan(0);
  const focusable = await page.evaluate(
    () =>
      [...document.querySelectorAll('#work .wk-badges, #work .wk-badges *')].filter(
        (el) => (el as HTMLElement).tabIndex >= 0 || el.matches('a, button, input, [tabindex]'),
      ).length,
  );
  expect(focusable).toBe(0);
  await expect(
    page.getByRole('list', { name: 'Skills Airline loyalty program' }).getByRole('listitem'),
  ).toHaveCount(4);
});

// WO-025: skill tags are quiet, so the phone "Try the demo" button is the one thing that reads as
// a control. Its name is "Try the demo: {name}" and its one line is the description. WO-028: the
// button is filled with the accent, its label centred. WO-032: the tags are plain text in the
// second ink, with no border, radius or fill, separated by middots that screen readers skip.
test('work demo button and tags', async ({ page, isMobile }) => {
  await page.goto('/');
  const token = (name: string) =>
    page.evaluate((name) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${name})`;
      document.querySelector('#work')!.append(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    }, name);
  const accent = await token('--ln-accent');
  const ink2 = await token('--ln-ink-2');
  const tags = await page.locator('#work .wk-badges li').evaluateAll((lis) =>
    lis.map((li) => {
      const s = getComputedStyle(li);
      return {
        border: ['top', 'right', 'bottom', 'left'].map((side) =>
          parseFloat(s.getPropertyValue(`border-${side}-width`)),
        ),
        radius: s.borderRadius,
        bg: s.backgroundColor,
        weight: Number(s.fontWeight),
        cursor: s.cursor,
        color: s.color,
        dot: getComputedStyle(li, '::before').content,
      };
    }),
  );
  expect(tags.length).toBeGreaterThan(0);
  for (const t of tags) {
    expect(t.border, 'tag has no border').toEqual([0, 0, 0, 0]);
    expect(t.radius, 'tag has no radius').toBe('0px');
    expect(t.color, 'tag is in the second ink').toBe(ink2);
    expect(t.dot, 'a middot that screen readers skip').toBe('"·" / ""');
    expect(t.bg, 'tag has no fill').toBe('rgba(0, 0, 0, 0)');
    expect(t.weight, 'tag weight').toBeLessThanOrEqual(500);
    expect(t.cursor, 'tag does not look tappable').not.toBe('pointer');
  }

  if (!isMobile) return;
  const button = page.locator('#work [data-wk-try]').first();
  await expect(button).toHaveAccessibleName('Try the demo: Airline loyalty app');
  await expect(button).toHaveAccessibleDescription('Track tier progress, book a reward.');
  // WO-040: the visible label is short (it fits one line at 320) and is part of the name.
  await expect(button).toHaveText('Try the demo ▸');
  await expect(button.locator('[aria-hidden="true"]')).toHaveText('▸');
  await expect(button).not.toContainText('↓');
  const fill = await button.evaluate((b) => {
    const s = getComputedStyle(b);
    return { bg: s.backgroundColor, align: s.textAlign };
  });
  expect(fill.bg, 'the button is filled with the accent').toBe(accent);
  expect(fill.align, 'the label is centred').toBe('center');
  // The one line stays outside the button. WO-040: closed, the still says it; it shows as the
  // demo's caption once the demo is open (below), and stays the button's description.
  await expect(button.locator('.wk-try-d')).toHaveCount(0);
  await expect(page.locator(`#${await button.getAttribute('aria-describedby')}`)).toBeHidden();
  for (const b of await page.locator('#work [data-wk-try]').all()) {
    await expect(b).toHaveAccessibleName(/^Try the demo: \S/);
    const box = (await b.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

// WO-025: the demos add no region landmarks. Their inner groupings are named groups. WO-032: the
// phone wrapper is no longer a group once revealed (that was a second group around the demo's).
test('work demos add no landmarks', async ({ page, isMobile }) => {
  await page.goto('/');
  const stray = () =>
    page.evaluate(
      () =>
        document.querySelectorAll(
          '#work .wk-demo :is(section[aria-label], section[aria-labelledby], [role="region"])',
        ).length,
    );
  if (isMobile) {
    for (const b of await page.locator('#work [data-wk-try]').all()) await b.click();
  }
  for (const demo of await page.locator('#work .wk-live .wk-demo').all()) {
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('astro-island').first()).not.toHaveAttribute('ssr');
  }
  expect(await stray()).toBe(0);
  await expect(page.locator('#work .wk-demo').getByRole('region')).toHaveCount(0);
  await expect(page.locator('#work .wk-demo[role="region"]')).toHaveCount(0);
  // WO-032: one group per demo, the demo's own. The wrapper has no role or name, opened or not.
  await expect(page.locator('#work .wk-demo:is([role], [aria-label])')).toHaveCount(0);
  for (const demo of await page.locator('#work .wk-live .wk-demo').all()) {
    await expect(demo.getByRole('group', { name: /^Demo: / })).toHaveCount(1);
  }
});

// WO-024, WO-028: on phones every demo waits behind "Try the demo" and loads nothing until it is
// pressed. Pressing one reveals the demo, hydrates it and focuses it (WO-032: the demo's own group).
const LATER_DEMOS = /(AirlineDemo|GrocerDemo|SchedulerDemo|PipelineDemo)[^/]*\.js/;

test('work phone demos expand on demand', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  const chunks: string[] = [];
  page.on('request', (r) => {
    if (LATER_DEMOS.test(r.url())) chunks.push(r.url());
  });
  await page.goto('/');

  // Projects starts within about seven screens (WO-028).
  const projectsTop = await page.evaluate(
    () => document.querySelector('#projects')!.getBoundingClientRect().top + window.scrollY,
  );
  expect(projectsTop, 'Projects top at 375 x 812').toBeLessThanOrEqual(5700);

  const buttons = page.getByRole('button', { name: /^Try the demo/ });
  await expect(buttons).toHaveCount(4);
  // Every demo engagement is collapsed, the first one too.
  const articles = page.locator('#work .wk-live article');
  await expect(articles).toHaveCount(4);
  for (const a of await articles.all()) {
    await expect(a.locator('.wk-demo')).toBeHidden();
    await expect(a.getByRole('button', { name: /^Try the demo/ })).toHaveCount(1);
  }
  for (const b of await buttons.all()) {
    const box = await b.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width, 'the main control of its row').toBeGreaterThanOrEqual(200);
  }
  await expect(page.locator('#work .wk-collapse .wk-demo:visible')).toHaveCount(0);

  // Scrolling the whole page past them loads no demo code.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(30);
  }
  await page.waitForLoadState('networkidle');
  expect(chunks, 'collapsed demo code requested before Try the demo').toEqual([]);

  // Press the first one: the demo shows, its own group takes focus, and its code loads and
  // hydrates. WO-040: the page brings the demo's screen flush under the header (it used to bring
  // the title there, WO-025).
  const id = await buttons.first().getAttribute('aria-controls');
  const first = page.locator(`[aria-controls="${id}"][data-wk-try]`);
  const demo = page.locator(`#${id}`);
  const region = demo.getByRole('group', { name: 'Demo: airline loyalty app (mock data)' });
  await first.scrollIntoViewIfNeeded();
  const loaded = page.waitForRequest((r) => LATER_DEMOS.test(r.url()));
  await first.click();
  await expect(demo).toBeVisible();
  await expect(region).toBeFocused();
  const nav = await navHeight(page);
  const screen = demo.locator('.df-screen');
  await settle(page);
  const top = await screen.evaluate((t) => t.getBoundingClientRect().top);
  expect(top, 'the demo clear of the header').toBeGreaterThanOrEqual(nav - 1);
  expect(top, 'the demo just under it').toBeLessThanOrEqual(nav + 8);
  await expect(region).toBeFocused();
  await loaded;
  await expect(demo.locator('astro-island')).not.toHaveAttribute('ssr');
  await expect(first).toHaveAccessibleName('Hide demo: Airline loyalty app');
  // The other three stay collapsed.
  expect(chunks).toHaveLength(1);
  await expect(page.getByRole('button', { name: /^Try the demo/ })).toHaveCount(3);
});

// WO-032: a phone demo keeps its one-line task as a caption above it, and the button is a toggle:
// "Hide demo" while open, with aria-expanded. Hiding keeps the demo mounted, focuses the toggle
// and keeps the title on screen. Back from a case study opens it again; the others stay closed
// and load nothing. A fresh visit starts closed.
test('work phone demos open, close and come back', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  const chunks: string[] = [];
  page.on('request', (r) => {
    const m = LATER_DEMOS.exec(r.url());
    if (m) chunks.push(m[1]);
  });
  await page.goto('/');
  const toggle = page.locator('#work [data-wk-try]').first();
  const id = (await toggle.getAttribute('aria-controls'))!;
  const demo = page.locator(`#${id}`);
  const article = page.locator('#work article').filter({ has: demo });
  const caption = page.locator(`#${await toggle.getAttribute('aria-describedby')}`);
  const title = article.locator('.wk-title');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.scrollIntoViewIfNeeded();
  await toggle.click();
  await expect(demo).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveText('Hide demo');
  await expect(toggle).toHaveAccessibleName(/^Hide demo/);
  await expect(toggle).toHaveAccessibleDescription('Track tier progress, book a reward.');
  await expect(caption).toBeVisible();
  // Both measured in one frame: the page may still be scrolling to the demo.
  const [capBottom, demoTop] = await caption.evaluate((c, id) => {
    const d = document.getElementById(id)!;
    return [c.getBoundingClientRect().bottom, d.getBoundingClientRect().top];
  }, id);
  expect(capBottom, 'the caption sits above the demo').toBeLessThanOrEqual(demoTop);
  await expect(demo.locator('astro-island')).not.toHaveAttribute('ssr');

  await settle(page); // the smooth scroll to the demo lands
  await toggle.click();
  await expect(demo).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toHaveAccessibleName('Try the demo: Airline loyalty app');
  await expect(title).toBeInViewport();
  // Hidden, not unmounted: the hydrated demo is still there.
  await expect(demo.locator('astro-island')).not.toHaveAttribute('ssr');
  await expect(demo.locator('.sky-app')).toHaveCount(1);

  // Open it again, go to a case study and come back.
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.goto('/projects/billable/');
  await page.goBack();
  const back = page.locator(`[aria-controls="${id}"]`);
  await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(back).toHaveAttribute('aria-expanded', 'true');
  await expect(back).toHaveText('Hide demo');
  await expect(page.locator('#work [data-wk-try][aria-expanded="true"]')).toHaveCount(1);
  await expect(page.locator(`#${id} astro-island`)).not.toHaveAttribute('ssr');
  await page.waitForLoadState('networkidle');
  expect([...new Set(chunks)], 'only the open demo loads').toEqual(['AirlineDemo']);

  await page.goto('/');
  await expect(page.locator('#work [data-wk-try][aria-expanded="true"]')).toHaveCount(0);
});

test('work demos all show inline on laptops and without scripting', async ({
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, 'one pass covers both cases');
  for (const opts of [
    { viewport: { width: 1440, height: 900 } },
    { viewport: { width: 375, height: 812 }, javaScriptEnabled: false },
  ]) {
    const ctx = await browser.newContext({ ...opts, baseURL });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Try the demo/ })).toHaveCount(0);
    await expect(page.locator('#work .wk-live .wk-demo:visible')).toHaveCount(4);
    await ctx.close();
  }
});

// WO-034: the Work panes lock in again, with a small wheel script (work-paging.ts), not a CSS
// snap. These use page.mouse.wheel, which sends real wheel events (Phase 11 found that
// Input.synthesizeScrollGesture differs between macOS and Linux).
const paneTop = (page: Page, i: number) =>
  page.evaluate(
    (i) =>
      Math.round(
        (document.querySelectorAll('#work .wk')[i] as HTMLElement).getBoundingClientRect().top,
      ),
    i,
  );

// Open the home at a laptop size, let the demos hydrate (a pass over the page), then put pane
// `i`'s top flush under the header with the pointer over its story.
async function atPane(page: Page, i: number, size = { width: 1440, height: 900 }) {
  await page.setViewportSize(size);
  await page.goto('/');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(30);
  }
  await page.waitForLoadState('networkidle');
  await page.evaluate((i) => {
    (document.querySelectorAll('#work .wk')[i] as HTMLElement).scrollIntoView({
      block: 'start',
      behavior: 'instant',
    });
  }, i);
  await page.mouse.move(Math.min(500, size.width / 2), 500);
  const nav = await navHeight(page);
  expect(await paneTop(page, i)).toBe(nav);
  return nav;
}

// One gesture's notches, `gap` ms apart.
async function notches(page: Page, n: number, dy: number, gap = 30) {
  for (let k = 0; k < n; k++) {
    await page.mouse.wheel(0, dy);
    if (k < n - 1) await page.waitForTimeout(gap);
  }
}

test('work panes lock in on one notch', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'a mouse wheel on a laptop');
  const nav = await atPane(page, 0);
  const t0 = Date.now();
  await page.mouse.wheel(0, 100);
  await expect.poll(() => paneTop(page, 1), { timeout: 2000 }).toBe(nav);
  expect(Date.now() - t0, 'the move is short').toBeLessThan(1200);
  // It stays there: never back to the pane it started in.
  await page.waitForTimeout(800);
  expect(await paneTop(page, 1)).toBe(nav);

  await page.mouse.wheel(0, -100);
  await expect.poll(() => paneTop(page, 0), { timeout: 2000 }).toBe(nav);
  await page.waitForTimeout(800);
  expect(await paneTop(page, 0)).toBe(nav);
});

test('work one gesture moves one pane', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'a mouse wheel on a laptop');
  const nav = await atPane(page, 0);
  await notches(page, 6, 100);
  await page.waitForTimeout(800);
  expect(await paneTop(page, 1), 'six quick notches: one pane').toBe(nav);
  // A second gesture, once the first has settled, moves one more.
  await notches(page, 6, 100);
  await page.waitForTimeout(800);
  expect(await paneTop(page, 2), 'the next gesture: one more').toBe(nav);
  // And up again, one pane.
  await notches(page, 6, -100);
  await page.waitForTimeout(800);
  expect(await paneTop(page, 1)).toBe(nav);
  // A trackpad fling: a swipe, then a long tail of inertia that dies away. Still one pane.
  for (let k = 0; k < 50; k++) {
    await page.mouse.wheel(0, Math.max(1, Math.round(60 * 0.92 ** k)));
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(800);
  expect(await paneTop(page, 2), 'a fling and its inertia: one pane').toBe(nav);
});

test('work paging releases at the ends', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'a mouse wheel on a laptop');
  await page.goto('/');
  const last = (await page.locator('#work .wk').count()) - 1;
  const nav = await atPane(page, last);
  // Past the last pane, the wheel scrolls the page natively into the rest of Work.
  const start = await page.evaluate(() => window.scrollY);
  await notches(page, 5, 100, 60);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(start + 400);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(start + 400);

  // Up from the first pane: natively back towards the hero.
  await atPane(page, 0);
  const top = await page.evaluate(() => window.scrollY);
  await notches(page, 5, -100, 60);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(top - 400);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(top - 400);

  // From the top of the page, a notch is a notch: no jump while the first pane is far down.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(600);
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(0);
  expect(y).toBeLessThanOrEqual(150);

  // Lock in from above: once the first pane's top is near the header, a notch brings it flush.
  await page.evaluate((nav) => {
    const pane = document.querySelector('#work .wk') as HTMLElement;
    window.scrollTo({
      top: pane.getBoundingClientRect().top + window.scrollY - nav - 150,
      behavior: 'instant',
    });
  }, nav);
  await page.mouse.wheel(0, 100);
  await expect.poll(() => paneTop(page, 0), { timeout: 2000 }).toBe(nav);
});

test('work paging lets inner scrollers go first', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'a mouse wheel on a laptop');
  const nav = await atPane(page, 0);
  // The airline app's screen scrolls on its own: the wheel over it scrolls it, not the page.
  const panel = page.locator('#work .wk').first().locator('.sky-panel');
  await expect(panel).toBeVisible();
  const room = await panel.evaluate((p) => p.scrollHeight - p.clientHeight);
  test.skip(room < 2, 'the screen fits at this size');
  const box = (await panel.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const y0 = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 100);
  await expect.poll(() => panel.evaluate((p) => p.scrollTop)).toBeGreaterThan(0);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY), 'the page stays').toBe(y0);
  // At the screen's end, the next gesture pages on.
  await panel.evaluate((p) => (p.scrollTop = p.scrollHeight));
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, 100);
  await expect.poll(() => paneTop(page, 1), { timeout: 2000 }).toBe(nav);
});

test('work paging respects motion and touch', async ({ page, browser, baseURL, isMobile }) => {
  test.skip(!!isMobile, 'one pass covers each case');
  // Reduced motion: a notch still moves one pane, at once.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const nav = await atPane(page, 0);
  await page.mouse.wheel(0, 100);
  await expect.poll(() => paneTop(page, 1), { timeout: 150 }).toBe(nav);
  await page.waitForTimeout(600);
  expect(await paneTop(page, 1)).toBe(nav);

  // At 375 there is no paging: a notch scrolls about a notch.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await atPane(page, 0, { width: 375, height: 812 });
  const y0 = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(600);
  const moved = (await page.evaluate(() => window.scrollY)) - y0;
  expect(moved).toBeGreaterThan(0);
  expect(moved).toBeLessThanOrEqual(150);

  // A coarse pointer (a touch tablet) at a laptop size: no paging either.
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
    isMobile: true,
    baseURL,
  });
  const tablet = await ctx.newPage();
  await tablet.goto('/');
  expect(await tablet.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
  await atPane(tablet, 0, { width: 1280, height: 900 });
  const t0 = await tablet.evaluate(() => window.scrollY);
  await tablet.mouse.wheel(0, 100);
  await tablet.waitForTimeout(600);
  const went = (await tablet.evaluate(() => window.scrollY)) - t0;
  expect(went).toBeGreaterThan(0);
  expect(went).toBeLessThanOrEqual(150);
  await ctx.close();
});

// WO-040: Work on phones. Each demo engagement is short (sector and role, title, intro line, a
// still of the app, then "Try the demo" and "Details" in one row); the demo opens flush under the
// header; the airline and grocer apps grow to their content so a swipe on them scrolls the page,
// with the tab bar stuck to the bottom of the viewport; a second "Hide demo" follows the demo;
// and a tap that lands before the demo hydrates is replayed once it has.

/** Open the demo engagement `i` (0 airline, 1 grocer, 2 scheduler, 3 pipeline) and let it land. */
async function openDemo(page: Page, i: number) {
  const toggle = page.locator('#work [data-wk-try]').nth(i);
  const demo = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
  await toggle.click();
  await expect(demo).toBeVisible();
  await expect(demo.locator('astro-island').first()).not.toHaveAttribute('ssr');
  await settle(page);
  return { toggle, demo };
}

/** A real one-finger swipe up by `dy` px from (x, y), through CDP touch events. */
async function swipeUp(page: Page, x: number, y: number, dy: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  const steps = 15;
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - (dy * i) / steps }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

test('work phone items are short and show a preview', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  await page.goto('/');
  const items = page.locator('#work .wk-live');
  await expect(items).toHaveCount(4);
  for (const [i, item] of (await items.all()).entries()) {
    const height = await item.evaluate((li) => li.getBoundingClientRect().height);
    expect(height, `item ${i + 1} at 375 x 812`).toBeLessThanOrEqual(480);
    // The still: a real image with its size and a description, lazy, of its app.
    const img = item.locator('.wk-shot img');
    await expect(img).toHaveCount(1);
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('height', /\d+/);
    await expect(img).toHaveAttribute('loading', 'lazy');
    expect((await img.getAttribute('alt'))!.length, 'a descriptive alt').toBeGreaterThan(30);
    await img.scrollIntoViewIfNeeded();
    await expect(img).toBeVisible();
    await expect
      .poll(() => img.evaluate((m: HTMLImageElement) => m.naturalWidth))
      .toBeGreaterThan(0);
    const box = (await img.boundingBox())!;
    expect(box.height, 'about 200px tall').toBeGreaterThanOrEqual(180);
    expect(box.height).toBeLessThanOrEqual(260);
    // Collapsed: the story's details wait behind "Details"; the role and intro line stay.
    const article = item.locator('article');
    await expect(article.locator('.wk-role')).toBeVisible();
    await expect(article.locator('.wk-kicker')).toBeVisible();
    for (const sel of ['.wk-summary', '.wk-details', '.wk-skills'])
      await expect(article.locator(sel)).toBeHidden();
  }

  // Details opens them in place, as a button with aria-expanded.
  const article = items.first().locator('article');
  const more = article.getByRole('button', { name: 'Details: Airline loyalty program' });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.click();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  for (const sel of ['.wk-summary', '.wk-details', '.wk-skills'])
    await expect(article.locator(sel)).toBeVisible();
  await expect(article.getByRole('heading', { name: 'What I did' })).toBeVisible();
  await more.click();
  await expect(article.locator('.wk-details')).toBeHidden();

  // Tapping the still opens the demo, as the button does.
  const toggle = article.locator('[data-wk-try]');
  await article.locator('.wk-shot').tap();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(`#${await toggle.getAttribute('aria-controls')}`)).toBeVisible();
  await expect(article.locator('.wk-shot')).toBeHidden();
});

test('work phone demo opens on screen', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  for (const size of [
    { width: 375, height: 812 },
    { width: 390, height: 664 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/');
    const nav = await navHeight(page);
    await page.locator('#work [data-wk-try]').first().scrollIntoViewIfNeeded();
    await settle(page);
    const { demo } = await openDemo(page, 0);
    const box = (await demo.locator('.sky-app').boundingBox())!;
    const tag = `${size.width}x${size.height}`;
    expect(box.y, `${tag}: the app under the header`).toBeGreaterThanOrEqual(nav - 1);
    expect(box.y, `${tag}: just under it`).toBeLessThanOrEqual(nav + 8);
    const shown = Math.min(box.y + box.height, size.height) - box.y;
    expect(shown, `${tag}: most of the app shows`).toBeGreaterThanOrEqual(
      Math.min(560, size.height - nav - 8),
    );
  }
  // Reduced motion: the same landing, at once.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const toggle = page.locator('#work [data-wk-try]').nth(1);
  await toggle.scrollIntoViewIfNeeded();
  await toggle.click();
  const nav = await navHeight(page);
  const screen = page.locator(`#${await toggle.getAttribute('aria-controls')} .df-screen`);
  const top = await screen.evaluate((s) => s.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(nav - 1);
  expect(top).toBeLessThanOrEqual(nav + 8);
});

test('work phone swipe on a demo scrolls the page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'a touch swipe on a phone');
  await page.goto('/');
  for (const [i, app] of [
    [0, '.sky-app'],
    [1, '.gro-app'],
  ] as const) {
    const toggle = page.locator('#work [data-wk-try]').nth(i);
    await toggle.scrollIntoViewIfNeeded();
    const { demo } = await openDemo(page, i);
    // Nothing inside the app scrolls on its own.
    const scrollers = await demo.locator(app).evaluate(
      (root) =>
        [root, ...root.querySelectorAll('*')].filter((el) => {
          const s = getComputedStyle(el);
          return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1;
        }).length,
    );
    expect(scrollers, `${app} has no inner vertical scroller`).toBe(0);
    const [x, y] = [187, 520];
    expect(
      await page.evaluate(
        ([x, y]) => !!document.elementFromPoint(x, y)?.closest('.df-screen'),
        [x, y],
      ),
      'the swipe starts on the app',
    ).toBe(true);
    const start = await page.evaluate(() => window.scrollY);
    await swipeUp(page, x, y, 250);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { message: `swipe on ${app}` })
      .toBeGreaterThanOrEqual(start + 200);
    await settle(page);
    await toggle.click(); // close it again before the next
  }
});

test('work phone demo tab bar sticks', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  // A short phone (or a browser with its toolbars showing), so both apps outgrow the screen.
  const vh = 600;
  await page.setViewportSize({ width: 375, height: vh });
  await page.goto('/');
  for (const [i, app] of [
    [0, '.sky-app'],
    [1, '.gro-app'],
  ] as const) {
    const toggle = page.locator('#work [data-wk-try]').nth(i);
    await toggle.scrollIntoViewIfNeeded();
    const { demo } = await openDemo(page, i);
    const root = demo.locator(app);
    const bar = root.getByRole('tablist');
    // The longest tab, so the app is taller than the screen.
    const tabs = await bar.getByRole('tab').all();
    let [longest, most] = [tabs[0], 0];
    for (const tab of tabs) {
      await tab.click();
      const h = await root.evaluate((r) => r.getBoundingClientRect().height);
      if (h > most) [longest, most] = [tab, h];
    }
    await longest.click();
    await settle(page);
    const { top, height } = await root.evaluate((r) => {
      const b = r.getBoundingClientRect();
      return { top: b.top + window.scrollY, height: b.height };
    });
    expect(height, `${app} grows to its content`).toBeGreaterThan(vh - 100);
    // While the app is on screen, from its top coming into view to its end, the bar shows.
    for (let y = top - 600; y <= top + height - 200; y += 150) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
      const appTop = await root.evaluate((r) => r.getBoundingClientRect().top);
      if (appTop > vh - 200) continue; // the app has barely come on screen
      const b = (await bar.boundingBox())!;
      const at = `${app} tab bar at scroll ${Math.round(y)}`;
      expect(b.y, at).toBeGreaterThanOrEqual(0);
      expect(b.y + b.height, at).toBeLessThanOrEqual(vh + 1);
    }
    // A tab picked with the app's top above the header brings the app back under the header.
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + 300);
    await bar.getByRole('tab', { selected: false }).first().click();
    const nav = await navHeight(page);
    await expect
      .poll(() => root.evaluate((r) => Math.round(r.getBoundingClientRect().top)))
      .toBeGreaterThanOrEqual(nav - 1);
    await toggle.click();
  }
});

test('work phone hide demo below', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  await page.goto('/');
  const toggle = page.locator('#work [data-wk-try]').nth(2);
  const article = page.locator('#work .wk-live article').nth(2);
  await expect(article.locator('[data-wk-hide]')).toBeHidden();
  await toggle.scrollIntoViewIfNeeded();
  const { demo } = await openDemo(page, 2);
  const below = demo.getByRole('button', { name: 'Hide demo: Nurse scheduler' });
  await expect(below).toHaveText('Hide demo');
  const frame = (await demo.locator('.df').boundingBox())!;
  const box = (await below.boundingBox())!;
  expect(box.y, 'it follows the demo').toBeGreaterThanOrEqual(frame.y + frame.height);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await below.click();
  await expect(demo).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toHaveAccessibleName('Try the demo: Nurse scheduler');
  const nav = await navHeight(page);
  const title = (await article.locator('.wk-title').boundingBox())!;
  expect(title.y, 'the title is back in view').toBeGreaterThanOrEqual(nav);
  expect(title.y + title.height).toBeLessThanOrEqual(812);
});

test('work phone button fits at 320', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  for (const b of await page.locator('#work [data-wk-try]').all()) {
    const fit = await b.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
      return {
        lines: lines.size,
        overflow: el.scrollWidth - el.clientWidth,
        moreRight: el.nextElementSibling!.getBoundingClientRect().right,
      };
    });
    expect(fit.lines, 'one line').toBe(1);
    expect(fit.overflow).toBeLessThanOrEqual(0);
    expect(fit.moreRight, 'Details fits beside it').toBeLessThanOrEqual(320);
    // WCAG 2.5.3: the visible label is in the accessible name.
    const visible = (await b.innerText()).replace('▸', '').trim();
    expect(visible).toBe('Try the demo');
    expect(await b.getAttribute('aria-label')).toContain(visible);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('work phone early tap is kept', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'a tap on a slow phone');
  // Hold the airline demo's code back, as a slow network would.
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  await page.route(/AirlineDemo[^/]*\.js/, async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/');
  const toggle = page.locator('#work [data-wk-try]').first();
  await toggle.scrollIntoViewIfNeeded();
  await toggle.click();
  const demo = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
  const island = demo.locator('astro-island').first();
  await expect(island).toHaveAttribute('ssr');
  await settle(page);
  const status = demo.getByRole('tab', { name: 'Status' });
  await expect(status).toHaveAttribute('aria-selected', 'false');
  await status.tap();
  await expect(island).toHaveAttribute('data-pending');
  await expect(demo.locator('.df-screen')).toHaveAttribute('aria-busy', 'true');
  release();
  await expect(island).not.toHaveAttribute('ssr');
  await expect(status).toHaveAttribute('aria-selected', 'true');
  await expect(island).not.toHaveAttribute('data-pending');
  await expect(demo.locator('.df-screen')).not.toHaveAttribute('aria-busy');
});
