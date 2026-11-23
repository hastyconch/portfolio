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

test('work snap is proximity and off under reduced motion', async ({ page, isMobile }) => {
  await page.goto('/');
  const snapType = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType);

  if (isMobile) {
    // Below 760px phones scroll naturally.
    expect(await snapType()).toBe('none');
    return;
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  // Proximity is the default strictness, so the computed value may serialise as just "y".
  expect(await snapType()).toMatch(/^y( proximity)?$/);

  // Only the demo engagements are snap points.
  const aligns = await page.evaluate(() => ({
    panes: [...document.querySelectorAll('#work .wk')].map(
      (el) => getComputedStyle(el).scrollSnapAlign,
    ),
    others: [...document.querySelectorAll('section, .wk-item, .wk-more, header, footer')].map(
      (el) => getComputedStyle(el).scrollSnapAlign,
    ),
  }));
  expect(aligns.panes.length).toBeGreaterThanOrEqual(4);
  for (const a of aligns.panes) expect(a).toBe('start');
  for (const a of aligns.others) expect(a).toBe('none');

  // Stopping just past a pane's top settles the pane right under the nav.
  const nav = await navHeight(page);
  await page.evaluate(() => {
    const pane = document.querySelectorAll('#work .wk')[1] as HTMLElement;
    const top = pane.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - 60 + 40, behavior: 'instant' });
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.round(
          (document.querySelectorAll('#work .wk')[1] as HTMLElement).getBoundingClientRect().top,
        ),
      ),
    )
    .toBeGreaterThanOrEqual(nav - 2);
  const top = await page.evaluate(
    () => (document.querySelectorAll('#work .wk')[1] as HTMLElement).getBoundingClientRect().top,
  );
  expect(Math.abs(top - nav)).toBeLessThanOrEqual(2);

  // Below 760px and under reduced motion there is no snapping.
  await page.setViewportSize({ width: 740, height: 900 });
  expect(await snapType()).toBe('none');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await snapType()).toBe('none');
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
