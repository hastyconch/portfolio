import { test, expect } from '@playwright/test';

// WO-017: every project shows what the app looks like, on its card and in its case study.
const CAPTURED = ['billable', 'felt-and-tiles', 'box-scores'];
const OWNER_SUPPLIED = ['travel-planner', 'parking', 'fashion'];

test.describe('projects show real screens', () => {
  test('every card shows a screen or a designed "screenshots coming" frame', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#rail > li');
    const n = await cards.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const art = cards.nth(i).locator('.pc-art');
      await expect(art).toHaveCount(1);
      const shots = await art.locator('img').count();
      const soon = await art.locator('.pa-soon').count();
      expect(shots + soon, `card ${i + 1} has no screen`).toBe(1);
    }
    // TCG is a mock-up and says so on its card.
    const tcg = cards.filter({ has: page.locator('a[href="/projects/tcg/"]') });
    await expect(tcg.getByText('Mock-up', { exact: true })).toBeVisible();
  });

  for (const slug of CAPTURED) {
    test(`${slug}: hero and gallery are real, loaded screenshots`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      const hero = page.locator('.cs-hero img');
      await expect(hero).toHaveCount(1);
      await expect(hero).toHaveAttribute('alt', /\S/);
      await expect
        .poll(() => hero.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0))
        .toBe(true);

      const gallery = page.locator('#gallery .cs-gal img');
      const pixelArt = (await page.locator('#gallery .cs-gal-game').count()) > 0;
      const count = await gallery.count();
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(5);
      await expect(page.locator('#gallery .cs-gal-soon')).toHaveCount(0);
      for (let i = 0; i < count; i++) {
        const img = gallery.nth(i);
        await expect(img).toHaveAttribute('loading', 'lazy');
        await expect(img).toHaveAttribute('alt', /\S/);
        // Responsive sizes, except pixel art, which ships as one small lossless 2x master.
        if (!pixelArt) await expect(img).toHaveAttribute('srcset', /\s\d+w/);
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
          .toBe(true);
      }
      await expect(page.locator('#gallery figcaption')).toHaveCount(count);
    });
  }

  test('tcg: screens are labelled as mock-ups', async ({ page }) => {
    await page.goto('/projects/tcg/');
    await expect(page.locator('.cs-hero figcaption')).toContainText('Mock-up');
    const captions = page.locator('#gallery figcaption');
    expect(await captions.count()).toBeGreaterThanOrEqual(3);
    for (const c of await captions.allTextContents()) expect(c).toMatch(/^Mock-up/);
  });

  for (const slug of OWNER_SUPPLIED) {
    test(`${slug}: designed pending state until the owner's screenshots land`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      const hero = page.locator('.cs-hero');
      const real = await hero.locator('img').count();
      if (real === 0) {
        await expect(hero.locator('[role="img"]')).toHaveAttribute('aria-label', /coming/i);
      }
      const slots = page.locator('#gallery .cs-gal-item');
      expect(await slots.count()).toBeGreaterThanOrEqual(3);
      // Every slot is either a loaded screenshot or a labelled "coming" frame, never a broken image.
      for (const el of await slots.all()) {
        const img = el.locator('img');
        if (await img.count()) {
          await img.scrollIntoViewIfNeeded();
          await expect
            .poll(() => img.evaluate((i: HTMLImageElement) => i.naturalWidth > 0))
            .toBe(true);
        } else {
          await expect(el.locator('.cs-gal-soon')).toHaveCount(1);
          await expect(el.locator('figcaption')).toContainText(/Screenshot coming/);
        }
      }
    });
  }
});

// WO-019: a card's art grows into its case study's hero (a cross-document view transition). The
// two share the project id, and nothing else on a case study carries one, so the name the
// navigation gives them is never duplicated.
test('card art and case study hero share the project id for the morph', async ({ page }) => {
  await page.goto('/');
  const ids = await page
    .locator('#rail .pc-art[data-art]')
    .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.art!));
  expect(ids.length).toBe(await page.locator('#rail > li').count());
  expect(new Set(ids).size).toBe(ids.length);
  await page.goto(`/projects/${ids[1]}/`);
  await expect(page.locator('#cs-art')).toHaveAttribute('data-art', ids[1]);
  await expect(page.locator('[data-art]')).toHaveCount(1);
});

// WO-021: one section per screen. On a laptop, a jump to Projects shows its heading and the first
// row of cards together, with the section's top meeting the nav.
test('projects is one pane', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'the pane is a laptop layout');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#projects');
  await expect
    .poll(() =>
      page.locator('#projects').evaluate((s) => Math.round(s.getBoundingClientRect().top)),
    )
    .toBe(60);
  const head = await page.locator('#projects-h').boundingBox();
  const card = await page.locator('#rail > li').first().boundingBox();
  expect(head!.y).toBeGreaterThanOrEqual(60);
  expect(card!.y + card!.height).toBeLessThanOrEqual(900);
});
