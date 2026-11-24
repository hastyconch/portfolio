import { test, expect, type Response } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gzipSync } from 'node:zlib';
import { BLINK_HALF_MS, hurtAlpha } from '../../src/demos/billable/game/core/blink';

// WO-011: the Billable. mini-room ships a poster and a Play button; Phaser and the scene arrive
// only after Play (constitution art. 5). The generic route gates (axe, overflow, motion) cover
// /demos/billable/ through gates.spec.ts.

const ROUTE = '/demos/billable/';
const GAME_CHUNK = /phaser|billable-game/i;
const BUDGET = 100 * 1024;

const isJs = (r: Response) =>
  r.request().resourceType() === 'script' || /\.m?js(\?|$)/.test(r.url());

test('billable mini loads no game code before Play', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  const scripts: Response[] = [];
  page.on('response', (r) => isJs(r) && scripts.push(r));

  await page.goto(ROUTE);
  // The island hydrates on client:visible; wait for it, then for the network to settle.
  await expect(page.locator('.bm[data-hydrated]')).toBeVisible();
  await page.waitForLoadState('networkidle');

  const before = [...scripts];
  expect(
    before.map((r) => r.url()).filter((u) => GAME_CHUNK.test(u)),
    'game code requested before Play',
  ).toEqual([]);
  let gz = 0;
  for (const r of before) gz += gzipSync(await r.body()).length;
  expect(gz, 'initial JS (gzipped) exceeds 100 KB').toBeLessThanOrEqual(BUDGET);
  await expect(page.locator('canvas')).toHaveCount(0);

  // Play: the game chunk loads, the canvas appears with an accessible name and takes focus.
  const chunk = page.waitForResponse((r) => isJs(r) && GAME_CHUNK.test(r.url()));
  await page.getByRole('button', { name: /^play/i }).click();
  await chunk;
  const game = page.getByRole('application', { name: /billable\. mini-room/i });
  await expect(game).toBeVisible();
  await expect(page.locator('.bm[data-status="playing"]')).toBeVisible({ timeout: 15_000 });
  await expect(game).toBeFocused();

  // Esc pauses and returns focus to the page; Resume puts it back in the game.
  await page.keyboard.press('Escape');
  const resume = page.locator('.bm-overlay').getByRole('button', { name: 'Resume' });
  await expect(resume).toBeFocused();
  await resume.click();
  await expect(game).toBeFocused();

  // The playing state (canvas, HUD, on-screen controls) passes axe too.
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? ''),
  );
  expect(blocking.map((v) => `${v.id}: ${v.help} → ${v.nodes[0]?.target}`)).toEqual([]);

  expect(errors).toEqual([]);
});

// WO-025: the game pauses when keyboard focus leaves it, as Esc does, but leaves focus where the
// visitor sent it. Moving within the game (the Pause button, the on-screen pad) doesn't pause.
test('billable pauses when focus leaves', async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator('.bm[data-hydrated]')).toBeVisible();
  await page.getByRole('button', { name: /^play/i }).click();
  const game = page.getByRole('application', { name: /billable\. mini-room/i });
  await expect(page.locator('.bm[data-status="playing"]')).toBeVisible({ timeout: 15_000 });
  await expect(game).toBeFocused();

  const inside = () => page.evaluate(() => !!document.activeElement?.closest('.bm'));
  let left = false;
  for (let i = 0; i < 12 && !left; i++) {
    await page.keyboard.press('Tab');
    left = !(await inside());
    if (!left) {
      await page.waitForTimeout(50);
      expect(await page.locator('.bm').getAttribute('data-status'), 'focus within the game').toBe(
        'playing',
      );
    }
  }
  expect(left, 'Tab leaves the game').toBe(true);
  await expect(page.locator('.bm[data-status="paused"]')).toBeVisible();
  // Focus stays where Tab put it, outside the game.
  await page.waitForTimeout(100);
  expect(await inside()).toBe(false);

  // Resume picks up again, with focus back in the game.
  await page.locator('.bm-overlay').getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('.bm[data-status="playing"]')).toBeVisible();
  await expect(game).toBeFocused();
  await page.waitForTimeout(100);
  await expect(page.locator('.bm[data-status="playing"]')).toBeVisible();

  // The hit blink is not a fast flip: no visible phase shorter than a sixth of a second, so at
  // most 3 blinks a second, over each invulnerable window (a hit, a respawn) with full alpha on
  // either side. Under reduced motion it is a steady fade, as before.
  expect(BLINK_HALF_MS).toBeGreaterThanOrEqual(1000 / 6);
  for (const until of [1300, 800]) {
    const runs: number[] = [];
    let prev = 1;
    let run = 0;
    for (let t = -500; t < until + 500; t++) {
      const a = hurtAlpha(t, t < 0 ? 0 : until, false);
      if (a !== prev) {
        runs.push(run);
        run = 0;
      }
      run++;
      prev = a;
    }
    const inner = runs.slice(1); // the first run is the full alpha before the hit
    expect(inner.length, `the ${until}ms window blinks`).toBeGreaterThan(0);
    expect(Math.min(...inner), `shortest blink phase in ${until}ms (ms)`).toBeGreaterThanOrEqual(
      1000 / 6,
    );
  }
  const until = 1300;
  expect(hurtAlpha(until, until, false)).toBe(1);
  for (const t of [0, 100, 650, 1299]) expect(hurtAlpha(t, until, true)).toBe(0.6);
  expect(hurtAlpha(until, until, true)).toBe(1);
});

// WO-020: on the case study the game takes the column's full width and Goal / Controls sit in one
// band under it, with action labels on one line and no empty run before "Problem".
const CASE_STUDY = '/projects/billable/';

test('billable controls labels do not wrap', async ({ page, isMobile }) => {
  test.skip(isMobile, 'laptop layout');
  await page.goto(CASE_STUDY);
  await page.locator('#play').scrollIntoViewIfNeeded();
  await expect(page.locator('.bm[data-hydrated]')).toBeVisible();

  const labels = page.locator('.bm-keys dt:visible');
  expect(await labels.count()).toBeGreaterThanOrEqual(6);
  const lines = await labels.evaluateAll((dts) =>
    dts.map((dt) => {
      const h = dt.getBoundingClientRect().height;
      const lh = parseFloat(getComputedStyle(dt).lineHeight);
      return { text: dt.textContent, lines: Math.round(h / lh) };
    }),
  );
  for (const l of lines) expect(l.lines, `"${l.text}" wraps`).toBe(1);
});

test('billable layout band under the game', async ({ page, isMobile }) => {
  test.skip(isMobile, 'laptop layout');
  await page.goto(CASE_STUDY);
  await page.locator('#play').scrollIntoViewIfNeeded();
  await expect(page.locator('.bm[data-hydrated]')).toBeVisible();

  const box = async (sel: string) => {
    const b = await page.locator(sel).boundingBox();
    if (!b) throw new Error(`${sel} not laid out`);
    return b;
  };
  const stage = await box('#play .bm-stage');
  const band = await box('#play .bm-info');
  const section = await box('#play');

  expect(stage.width, 'game narrower than 800px').toBeGreaterThanOrEqual(800);
  expect(band.y, 'band starts above the game bottom').toBeGreaterThanOrEqual(
    stage.y + stage.height,
  );
  // The band spans the game's edges.
  expect(Math.abs(band.x - stage.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(band.width - stage.width)).toBeLessThanOrEqual(1);
  // The section ends at the band.
  expect(section.y + section.height - (band.y + band.height)).toBeLessThanOrEqual(96);
});

// WO-029: on a phone, a tap on Play that lands before the island has hydrated still starts the
// game. The island's scripts are held back a moment (a slow network) under 4x CPU throttling, so
// the tap reliably lands on the server-rendered button, which has no handler of its own.
test('first tap starts the game', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'a phone tap');
  test.setTimeout(60_000);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.route(/\/_astro\/.*\.js$/, async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });

  await page.goto(CASE_STUDY, { waitUntil: 'domcontentloaded' });
  const play = page.locator('#play .bm-btn-play');
  await play.scrollIntoViewIfNeeded();
  await expect(play).toBeVisible();
  const early = await page.evaluate(() =>
    document.querySelector('#play astro-island')!.hasAttribute('ssr'),
  );
  expect(early, 'the tap lands before hydration').toBe(true);
  await play.tap();

  // WO-033: until the game is up, the wait says so: the stage is busy, the status line says
  // "Loading the game…" and a label shows under the button.
  const stage = page.locator('#play .bm-stage');
  const status = page.locator('#play .bm-sr[role="status"]');
  const label = () =>
    page
      .locator('#play .bm-overlay-clear')
      .evaluate((el) => getComputedStyle(el, '::after').content);
  const seen = await label();
  const pending = await page.evaluate(() =>
    document.querySelector('#play astro-island')!.hasAttribute('ssr'),
  );
  if (pending) {
    expect(seen).toContain('Loading…');
    await expect(stage).toHaveAttribute('aria-busy', 'true');
    await expect(status).toHaveText('Loading the game…');
  }

  await expect(page.locator('#play canvas')).toHaveCount(1, { timeout: 20_000 });
  await expect(page.locator('.bm')).not.toHaveAttribute('data-status', 'poster');
  await expect(page.locator('.bm[data-status="playing"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#play astro-island[data-pending]')).toHaveCount(0);
  await expect(stage).not.toHaveAttribute('aria-busy', /.*/);
  await expect(status).not.toHaveText('Loading the game…');
  expect(pending, 'the loading state was seen before hydration').toBe(true);
});

// WO-033: if the island never hydrates, Play does not stay pressed: after about 10s the
// pending look, the busy state and the status line clear.
test('pending tap clears if the game never loads', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'a phone tap');
  test.setTimeout(40_000);
  await page.route(/\/_astro\/.*\.js$/, (route) => route.abort());
  await page.goto(CASE_STUDY, { waitUntil: 'domcontentloaded' });
  const play = page.locator('#play .bm-btn-play');
  await play.scrollIntoViewIfNeeded();
  await play.tap();
  const island = page.locator('#play astro-island');
  await expect(island).toHaveAttribute('data-pending', '');
  await expect(page.locator('#play .bm-stage')).toHaveAttribute('aria-busy', 'true');
  await expect(island).not.toHaveAttribute('data-pending', /.*/, { timeout: 15_000 });
  await expect(page.locator('#play .bm-stage')).not.toHaveAttribute('aria-busy', /.*/);
  await expect(page.locator('#play .bm-sr[role="status"]')).toHaveText('');
  const label = await page
    .locator('#play .bm-overlay-clear')
    .evaluate((el) => getComputedStyle(el, '::after').content);
  expect(label).toBe('none');
});

// WO-024: the case study says "playable" up front: a "Play it" link in the hero goes to #play.
test('billable play it link', async ({ page, isMobile }) => {
  await page.goto(CASE_STUDY);
  const link = page.locator('.cs-head').getByRole('link', { name: /^Play it/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '#play');
  if (isMobile) {
    const box = (await link.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.y + box.height, 'Play it is in the first screen').toBeLessThanOrEqual(812);
  }
  await link.click();
  await expect(page).toHaveURL(/#play$/);
  await expect(page.locator('#play-h')).toBeInViewport();
});
