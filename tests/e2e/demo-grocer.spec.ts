import { test, expect, type Locator, type Page } from '@playwright/test';

// WO-009: tabs, offers, list ticks and recipe → list all work by keyboard alone, with visible
// focus. Every move below is a key press; nothing is clicked or focused programmatically.

/** Press Tab (or Shift+Tab) until `target` has focus, then assert its focus ring is visible. */
async function tabTo(page: Page, target: Locator, back = false) {
  for (let i = 0; i < 30; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
  }
  await expect(target).toBeFocused();
  await expectVisibleFocus(target);
}

async function expectVisibleFocus(el: Locator) {
  const ring = await el.evaluate((n) => {
    const s = getComputedStyle(n);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  expect(ring.style, 'focus ring style').not.toBe('none');
  expect(ring.width, 'focus ring width').toBeGreaterThanOrEqual(2);
}

test('grocer demo is keyboard operable', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'keyboard pass runs on desktop');
  await page.goto('/demos/grocer/');
  // client:visible: wait for React to hydrate the island before driving it.
  await page.waitForSelector('astro-island:not([ssr])');

  const demo = page.getByRole('group', { name: /grocer loyalty app/i });
  const tab = (name: string) => demo.getByRole('tab', { name });
  const live = demo.locator('[aria-live="polite"]');

  // Tabs: arrow keys move selection and focus, and wrap.
  await tabTo(page, tab('Home'));
  await expect(tab('Home')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(tab('Recipes')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(tab('Offers')).toBeFocused();
  await expect(tab('Offers')).toHaveAttribute('aria-selected', 'true');
  await expectVisibleFocus(tab('Offers'));

  // Offers: load one with Enter; state and announcement update.
  const cereal = demo.getByRole('button', { name: /offer: buy any cereal/i });
  await tabTo(page, cereal, true);
  await expect(cereal).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Enter');
  await expect(cereal).toHaveAttribute('aria-pressed', 'true');
  await expect(cereal).toBeFocused();
  await expect(live).toContainText('Loaded offer: Buy any cereal');

  // Lists: the cereal item is flagged with its (now loaded) offer; tick it with Space.
  await tabTo(page, tab('Offers'));
  await page.keyboard.press('ArrowRight');
  await expect(tab('Lists')).toHaveAttribute('aria-selected', 'true');
  const item = demo.getByRole('checkbox', { name: 'Cereal' });
  await expect(demo.getByText('Offer +50 pts · loaded')).toBeVisible();
  await tabTo(page, item, true);
  await page.keyboard.press('Space');
  await expect(item).toBeChecked();
  await expect(live).toContainText('Cereal ticked off');

  // Recipes: "Add ingredients to list" adds the missing ones to the list.
  await tabTo(page, tab('Lists'));
  await page.keyboard.press('ArrowRight');
  await expect(tab('Recipes')).toHaveAttribute('aria-selected', 'true');
  const add = demo.getByRole('button', { name: 'Add ingredients to list' });
  await tabTo(page, add, true);
  await page.keyboard.press('Enter');
  await expect(live).toContainText('Added 4 ingredients to your list');

  await tabTo(page, tab('Recipes'));
  await page.keyboard.press('ArrowLeft');
  await expect(tab('Lists')).toHaveAttribute('aria-selected', 'true');
  await expect(demo.getByRole('checkbox', { name: 'Greek yogurt' })).toBeVisible();
  await expect(demo.getByRole('checkbox', { name: 'Berries' })).toBeVisible();
});

test('grocer checkout earns points and unlocks the reward', async ({ page }) => {
  await page.goto('/demos/grocer/');
  await page.waitForSelector('astro-island:not([ssr])');
  const demo = page.getByRole('group', { name: /grocer loyalty app/i });
  const live = demo.locator('[aria-live="polite"]');
  const tab = (name: string) => demo.getByRole('tab', { name });

  // Load every offer still available.
  await tab('Offers').click();
  for (const name of ['cereal', 'Greek yogurts', 'berries']) {
    await demo.getByRole('button', { name: new RegExp(`Load offer: .*${name}`, 'i') }).click();
  }
  // The recipe adds yogurt and berries to the list.
  await tab('Recipes').click();
  await demo.getByRole('button', { name: 'Add ingredients to list' }).click();

  // Put everything in the basket and check out.
  await tab('Lists').click();
  for (const box of await demo.getByRole('checkbox').all()) {
    if (!(await box.isChecked())) await box.check();
  }
  await demo.getByRole('button', { name: /^Check out/ }).click();
  await expect(live).toContainText('Reward unlocked');

  await tab('Home').click();
  await expect(demo.getByText('Reward ready')).toBeVisible();
  await expect(demo.getByText('All 4 offers earned this week')).toBeVisible();
});
