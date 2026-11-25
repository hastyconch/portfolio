import { test, expect, type Locator, type Page } from '@playwright/test';

// WO-010: the pipeline is keyboard operable and announces each step via aria-live. The visitor
// performs the TPM's actions (extract, draft, approve, nudge, update the PM tool). Autoplay is
// opt-in, can be paused (WCAG 2.2.2), and never runs under reduced motion.
const ROUTE = '/demos/pipeline/';

function demo(page: Page) {
  return page.getByRole('group', { name: /AI-assisted program pipeline/ }).first();
}

/** The step showing (the others are laid out, hidden, to hold the stage's height). */
function on(d: Locator) {
  return d.locator('.pl-step.is-on');
}

test('pipeline demo steps by keyboard', async ({ page }) => {
  await page.goto(ROUTE);
  const d = demo(page);
  await expect(d).toHaveAttribute('data-ready', 'true');
  const live = d.locator('[data-pl-live]');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await expect(live).toHaveText(/^Step 1 of 5: Meeting transcript in/);

  const back = d.getByRole('button', { name: 'Back', exact: true });
  const act = d.locator('.pl-next');
  await expect(back).toHaveAttribute('aria-disabled', 'true');
  // WO-028: the name is exactly "Back", with no leading space, in Chrome's own tree (Playwright
  // trims names, so ask the browser). The visible arrow is hidden from it.
  const { nodes } = await (
    await page.context().newCDPSession(page)
  ).send('Accessibility.getFullAXTree');
  const backs = nodes
    .filter((n) => !n.ignored && n.role?.value === 'button')
    .map((n) => String(n.name?.value ?? ''))
    .filter((name) => /Back/.test(name));
  expect(backs.length).toBeGreaterThan(0);
  for (const name of backs) expect(name).toBe('Back');
  await expect(back.locator('[aria-hidden="true"]')).toHaveText('←');

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
  await expect(on(d).getByText(/Reviewing this afternoon/)).toBeVisible();
  await expect(act).toHaveText(/Update PM tool/);
  await page.keyboard.press('Enter');
  await expect(live).toHaveText(/^Step 5 of 5: PM tool updated/);
  await expect(on(d).getByText('Delivered on time', { exact: true })).toBeVisible();
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
  await expect(on(d).getByText('Delivered on time', { exact: true })).toBeVisible();
});

// WO-042: under reduced motion Play never runs on a timer. It reads "Step" and each press shows
// the next step, with nothing animating; at the end it replays from the start.
test('pipeline play respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto(ROUTE);
  const d = demo(page);
  await expect(d).toHaveAttribute('data-ready', 'true');
  const live = d.locator('[data-pl-live]');
  await page.clock.runFor(20_000);
  await expect(live).toHaveText(/^Step 1 of 5/);

  const play = d.locator('.pl-toggle');
  await expect(play).toHaveAccessibleName('Step');
  await play.click();
  await expect(live).toHaveText(/^Step 2 of 5/);
  await page.clock.runFor(20_000);
  await expect(live).toHaveText(/^Step 2 of 5/);
  await expect(d.getByRole('button', { name: 'Pause' })).toHaveCount(0);
  // no step animation (hover colour transitions aside)
  expect(
    await d.evaluate(
      (e) => e.getAnimations({ subtree: true }).filter((a) => a instanceof CSSAnimation).length,
    ),
  ).toBe(0);

  // One step per press, the nudge included, then Replay goes back to the start.
  await play.click();
  await play.click();
  await expect(live).toHaveText(/^Step 4 of 5/);
  await play.click();
  await expect(live).toHaveText(/Nudge sent to Theo/);
  await play.click();
  await expect(live).toHaveText(/^Step 5 of 5/);
  await expect(play).toHaveAccessibleName('Replay');
  await play.click();
  await expect(live).toHaveText(/^Step 1 of 5/);
  await page.clock.runFor(20_000);
  await expect(live).toHaveText(/^Step 1 of 5/);
});

// WO-042: the steps share one cell, so the action row (and the TPM's action in it) keeps its
// place from step to step: a thumb that stays put keeps hitting it.
test('pipeline main button stays put', async ({ page }) => {
  for (const [width, height] of [
    [375, 812],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(ROUTE);
    const d = demo(page);
    await expect(d).toHaveAttribute('data-ready', 'true');
    const act = d.locator('.pl-next');
    await act.scrollIntoViewIfNeeded();
    const y0 = (await act.boundingBox())!.y;
    const labels = [
      'Extract with AI',
      'Draft exec update',
      'Approve and send',
      'Send nudge',
      'Update PM tool',
    ];
    for (const label of labels) {
      await expect(act).toHaveText(label);
      await act.click();
      // let the step settle (the PM tool step syncs its tickets after a beat)
      await page.waitForTimeout(900);
      const y = (await act.boundingBox())!.y;
      expect(Math.abs(y - y0), `after "${label}" at ${width}`).toBeLessThanOrEqual(4);
    }
    await expect(on(d).getByText('Delivered on time', { exact: true })).toBeVisible();
  }
});

test.describe('on a touch screen', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  test('pipeline targets fit a thumb', async ({ page }) => {
    await page.goto(ROUTE);
    const d = demo(page);
    await expect(d).toHaveAttribute('data-ready', 'true');
    const heights = () =>
      d.locator('button').evaluateAll((els) =>
        els
          .filter((e) => (e as HTMLElement).offsetParent !== null)
          .map((e) => ({
            name: (e.textContent ?? '').trim(),
            h: e.getBoundingClientRect().height,
          })),
      );
    const buttons = await heights();
    expect(buttons.length).toBeGreaterThanOrEqual(8);
    for (const b of buttons) expect(b.h, b.name).toBeGreaterThanOrEqual(44);

    // The citations (step 2) are at least 24px tall.
    await d.getByRole('button', { name: /Step 2:/ }).tap();
    const cites = await d
      .locator('.pl-step.is-on .pl-cite summary')
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(cites).toHaveLength(6);
    for (const h of cites) expect(h).toBeGreaterThanOrEqual(24);
  });
});
