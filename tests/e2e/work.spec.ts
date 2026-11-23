import { test, expect, type Page } from '@playwright/test';

// WO-015: on laptops each demo engagement is one pane, one viewport tall below the sticky nav,
// and the page settles on the next pane (proximity snapping). Phones and reduced motion scroll
// freely. Skill badges are text, never focusable.

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

test('skill badges are text, not controls', async ({ page }) => {
  await page.goto('/');
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
