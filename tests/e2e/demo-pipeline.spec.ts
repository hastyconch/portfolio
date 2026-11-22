import { test, expect, type Page } from '@playwright/test';

// WO-010: the pipeline is keyboard operable and announces each step via aria-live. The visitor
// performs the TPM's actions (extract, draft, approve, nudge, update the PM tool). Autoplay is
// opt-in, can be paused (WCAG 2.2.2), and never runs under reduced motion.
const ROUTE = '/demos/pipeline/';

function demo(page: Page) {
  return page.getByRole('group', { name: /AI-assisted program pipeline/ }).first();
}

test('pipeline demo steps by keyboard', async ({ page }) => {
  await page.goto(ROUTE);
  const d = demo(page);
  await expect(d).toHaveAttribute('data-ready', 'true');
  const live = d.locator('[data-pl-live]');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await expect(live).toHaveText(/^Step 1 of 5: Meeting transcript in/);

  const back = d.getByRole('button', { name: 'Back' });
  const act = d.locator('.pl-next');
  await expect(back).toHaveAttribute('aria-disabled', 'true');

  // Walk to the action button with Tab and perform each TPM action with Enter.
  await back.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(act).toBeFocused();
  await expect(act).toHaveText(/Extract with AI/);
  await page.keyboard.press('Enter');
  await expect(live).toHaveText(/^Step 2 of 5: AI extracts/);
  await expect(d.getByRole('button', { name: /Step 2:/ })).toHaveAttribute('aria-current', 'step');

  await expect(act).toHaveText(/Draft exec update/);
  await page.keyboard.press('Enter');
  await expect(act).toHaveText(/Approve and send/);
  await page.keyboard.press('Enter');
  await expect(live).toHaveText(/^Step 4 of 5: Nudge engine/);

  // Sending the nudge stays on the step and shows the reply; the next action updates the PM tool.
  await expect(act).toHaveText(/Send nudge/);
  await page.keyboard.press('Enter');
  await expect(live).toHaveText(/Nudge sent to Theo/);
  await expect(d.getByText(/Reviewing this afternoon/)).toBeVisible();
  await expect(act).toHaveText(/Update PM tool/);
  await page.keyboard.press('Enter');
  await expect(live).toHaveText(/^Step 5 of 5: PM tool updated/);
  await expect(d.getByText('Delivered on time', { exact: true })).toBeVisible();
  await expect(act).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter'); // no-op at the end
  await expect(live).toHaveText(/^Step 5 of 5/);

  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(back).toBeFocused();
  await page.keyboard.press('Space');
  await expect(live).toHaveText(/^Step 4 of 5: Nudge engine/);
});

test('pipeline extracted items cite their transcript line', async ({ page }) => {
  await page.goto(ROUTE);
  const d = demo(page);
  await expect(d).toHaveAttribute('data-ready', 'true');
  await d.getByRole('button', { name: /Step 2:/ }).click();
  const item = d.locator('details', { hasText: 'Release 3 scope is locked.' });
  await item.locator('summary').click();
  await expect(item.getByText(/Let’s lock scope at today’s list/)).toBeVisible();
});

test('pipeline demo autoplay is opt-in, plays through once and stops', async ({ page }) => {
  await page.clock.install();
  await page.goto(ROUTE);
  const d = demo(page);
  await expect(d).toHaveAttribute('data-ready', 'true');
  const live = d.locator('[data-pl-live]');

  // Nothing moves until the visitor presses Play.
  await page.clock.runFor(10_000);
  await expect(live).toHaveText(/^Step 1 of 5/);

  await d.getByRole('button', { name: 'Play' }).click();
  for (let i = 0; i < 6; i++) await page.clock.runFor(4_100);
  await expect(live).toHaveText(/^Step 5 of 5/);
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
