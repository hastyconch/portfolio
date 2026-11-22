import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WO-016: the Skyward Rewards phone demo. Tabs work by arrow keys, a reward booking opens a
// confirmation sheet that takes focus and gives it back, and every screen passes axe.
const ROUTE = '/demos/airline/';

async function axe(page: Page) {
  // Let entrance animations settle so contrast is measured on the resting state.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const results = await new AxeBuilder({ page })
    .include('.sky-app')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return results.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
    .map((v) => `${v.id}: ${v.help} → ${v.nodes[0]?.target}`);
}

test('airline demo: tabs, booking sheet and focus by keyboard', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'keyboard pass runs on desktop');
  await page.goto(ROUTE);
  await page.waitForSelector('astro-island:not([ssr])');
  const demo = page.getByRole('group', { name: /airline loyalty app/i });
  const tab = (name: string) => demo.getByRole('tab', { name });
  const live = demo.locator('[aria-live="polite"]');

  // Home: the member card, the tier meter and quick actions.
  await expect(demo.getByText('48,250 points', { exact: true })).toBeAttached();
  await expect(demo.getByRole('progressbar', { name: /Gold to Platinum/ })).toBeVisible();
  expect(await axe(page)).toEqual([]);

  // Quick action: the member card shows its barcode face.
  const cardBtn = demo.getByRole('button', { name: 'Member card' });
  await cardBtn.focus();
  await page.keyboard.press('Enter');
  await expect(cardBtn).toHaveAttribute('aria-pressed', 'true');

  // Arrow keys move between tabs and wrap.
  await tab('Home').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tab('Status')).toBeFocused();
  await expect(tab('Status')).toHaveAttribute('aria-selected', 'true');
  await expect(demo.getByRole('list', { name: 'Platinum perks' })).toContainText(
    'Complimentary upgrades',
  );
  await expect(demo.getByText('9,600 to go')).toBeVisible();
  expect(await axe(page)).toEqual([]);

  await page.keyboard.press('ArrowRight');
  await expect(tab('Redeem')).toHaveAttribute('aria-selected', 'true');
  // Not enough points: the button says how many more are needed and can't be pressed.
  await expect(demo.getByRole('button', { name: /more points to book Tokyo/ })).toBeDisabled();
  expect(await axe(page)).toEqual([]);

  // Book Lisbon: the sheet opens, takes focus, and the booking is announced.
  await demo.getByRole('button', { name: 'Book Lisbon for 35,000 points' }).focus();
  await page.keyboard.press('Enter');
  const sheet = demo.getByRole('dialog', { name: 'You’re going to Lisbon' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('heading')).toBeFocused();
  await expect(live).toHaveText('Booked Lisbon for 35,000 points. 13,250 points remaining.');
  await expect(sheet).toContainText('13,250 pts');
  expect(await axe(page)).toEqual([]);

  // Focus stays in the sheet; Escape closes it and returns focus to the booked card.
  await page.keyboard.press('Tab');
  await expect(sheet.getByRole('button', { name: 'See trip' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(sheet.getByRole('button', { name: 'See trip' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(demo.getByText('Booked', { exact: true })).toBeFocused();

  // Home shows the new trip and balance.
  await tab('Home').click();
  await expect(demo.getByRole('region', { name: 'Your reward trip' })).toContainText('LIS');
  await expect(demo.getByText('13,250 points', { exact: true })).toBeAttached();
});
