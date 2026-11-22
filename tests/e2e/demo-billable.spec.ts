import { test, expect, type Response } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gzipSync } from 'node:zlib';

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
