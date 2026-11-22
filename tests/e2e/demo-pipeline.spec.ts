import { test, expect, type Page } from '@playwright/test';

// WO-010: the pipeline stepper is keyboard operable, announces the current step via aria-live,
// autoplay can be paused (WCAG 2.2.2), and there is no autoplay under reduced motion.
const ROUTE = '/demos/pipeline/';

function demo(page: Page) {
  return page.getByRole('group', { name: /AI-assisted program pipeline/ }).first();
}

test('pipeline demo steps by keyboard', async ({ page }) => {
  await page.clock.install();
  await page.goto(ROUTE);
  const d = demo(page);
  await expect(d).toHaveAttribute('data-ready', 'true');
  const live = d.locator('[data-pl-live]');
  await expect(live).toHaveAttribute('aria-live', 'polite');

  // Autoplay is running; it advances on its own and can be paused from the keyboard.
  const pause = d.getByRole('button', { name: 'Pause' });
  await expect(pause).toBeVisible();
  await page.clock.runFor(4_100);
  await expect(live).toHaveText(/^Step 2 of 5/);
  await pause.focus();
  await page.keyboard.press('Enter');
  await expect(d.getByRole('button', { name: 'Play' })).toBeFocused();
  await page.clock.runFor(10_000);
  await expect(live).toHaveText(/^Step 2 of 5/);

  // Jump to step 1 with a track node, then walk the controls with Tab / Enter / Space.
  await d.getByRole('button', { name: /Step 1:/ }).focus();
  await page.keyboard.press('Enter');
  await expect(live).toHaveText(/^Step 1 of 5: Meeting transcript in/);
  const back = d.getByRole('button', { name: 'Back' });
  const next = d.getByRole('button', { name: 'Next' });
  await expect(back).toHaveAttribute('aria-disabled', 'true');

  await back.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(live).toHaveText(/^Step 2 of 5: AI extracts/);
  await expect(d.getByRole('button', { name: /Step 2:/ })).toHaveAttribute('aria-current', 'step');

  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter'); // extra press is a no-op
  await expect(live).toHaveText(/^Step 5 of 5: PM tool updated/);
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(next).toBeFocused();
  await expect(d.getByText('Delivered on time', { exact: true })).toBeVisible();

  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(back).toBeFocused();
  await page.keyboard.press('Space');
  await expect(live).toHaveText(/^Step 4 of 5: Nudge engine/);
});

test('pipeline demo autoplay plays through once and stops on the final state', async ({ page }) => {
  await page.clock.install();
  await page.goto(ROUTE);
  const d = demo(page);
  await expect(d).toHaveAttribute('data-ready', 'true');
  for (let i = 0; i < 4; i++) await page.clock.runFor(4_100);
  await expect(d.locator('[data-pl-live]')).toHaveText(/^Step 5 of 5/);
  await expect(d.getByRole('button', { name: 'Replay' })).toBeVisible();
  await expect(d.getByText('Delivered on time', { exact: true })).toBeVisible();
});

test('pipeline demo does not autoplay under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto(ROUTE);
  const d = demo(page);
  await expect(d).toHaveAttribute('data-ready', 'true');
  await expect(d.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.clock.runFor(20_000);
  await expect(d.locator('[data-pl-live]')).toHaveText(/^Step 1 of 5/);
});
