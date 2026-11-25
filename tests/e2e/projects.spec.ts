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

// WO-027: the stack hairline sits at the same height on every card in the rail, however much
// each card says above it (or however its stack wraps).
test('card lines align', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'phones show a list, not a rail');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('#projects').evaluate((s) => s.scrollIntoView({ behavior: 'instant' }));
  const tops = await page.locator('#rail .pc-stack').evaluateAll((els) =>
    els
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.left < innerWidth && r.right > 0;
      })
      .map((e) => e.getBoundingClientRect().top),
  );
  expect(tops.length).toBeGreaterThanOrEqual(4);
  expect(Math.max(...tops) - Math.min(...tops), tops.join(', ')).toBeLessThanOrEqual(1);
  // and for the cards further along the rail
  const all = await page
    .locator('#rail .pc-stack')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
  expect(Math.max(...all) - Math.min(...all), all.join(', ')).toBeLessThanOrEqual(1);
});

// WO-029: "Featured" sits only on a card with real cover art, never over "Screenshots coming".
test('featured only with art', async ({ page }) => {
  await page.goto('/');
  const featured = page
    .locator('#rail > li')
    .filter({ has: page.locator('.pc-feat', { hasText: /^Featured$/ }) });
  expect(await featured.count(), 'some card is featured').toBeGreaterThan(0);
  for (const card of await featured.all()) {
    await expect(card.locator('.pc-art img')).toHaveCount(1);
    await expect(card.locator('.pa-soon')).toHaveCount(0);
  }
  // The Mock-up chip is unchanged.
  await expect(page.locator('#rail .pc-feat', { hasText: /^Mock-up$/ })).toHaveCount(1);
  // The case study's intro follows the same rule: no "Featured" over the screenshots-coming hero.
  for (const slug of ['travel-planner', 'fashion']) {
    await page.goto(`/projects/${slug}/`);
    await expect(page.locator('.cs-hero .pa-soon')).toHaveCount(1);
    await expect(page.locator('.cs-feat')).toHaveCount(0);
  }
  await page.goto('/projects/billable/');
  await expect(page.locator('.cs-feat')).toHaveCount(1);
});

// WO-029: on phones the rule under the Projects lead is inset to the gutter like the cards' rules.
// On a case study, the pager's labels end where their rule ends.
test('rule and pager align', async ({ page, isMobile }) => {
  if (isMobile) {
    await page.goto('/');
    const r = await page.locator('#rail').evaluate((rail) => {
      const box = rail.getBoundingClientRect();
      const cs = getComputedStyle(rail);
      const rule = getComputedStyle(rail, '::before');
      const card = rail.querySelector('li')!.getBoundingClientRect();
      return {
        border: cs.borderTopWidth,
        rule: rule.borderTopWidth,
        left: box.left + parseFloat(cs.paddingLeft),
        right: box.right - parseFloat(cs.paddingRight),
        card: { left: card.left, right: card.right },
        gutter: document.querySelector('#projects-h')!.getBoundingClientRect().left,
      };
    });
    expect(r.border, 'no edge-to-edge border').toBe('0px');
    expect(r.rule).toBe('1px');
    expect(Math.abs(r.left - r.gutter), 'starts at the gutter').toBeLessThanOrEqual(1);
    expect(Math.abs(r.left - r.card.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(r.right - r.card.right)).toBeLessThanOrEqual(1);
    expect(r.right).toBeLessThan(375);

    // WO-033: each card's own rule is straight to both ends, not the bottom edge of a rounded
    // box (which curls up at the corners).
    const cards = await page.locator('#rail > .pc').evaluateAll((els) =>
      els.map((el) => {
        const cs = getComputedStyle(el);
        const rule = getComputedStyle(el, '::before');
        return {
          edge: cs.borderBottomWidth === '0px' || cs.borderBottomLeftRadius === '0px',
          rule: rule.borderBottomWidth,
          radius: [rule.borderBottomLeftRadius, rule.borderBottomRightRadius],
          width: Math.abs(parseFloat(rule.width) - el.getBoundingClientRect().width),
        };
      }),
    );
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) {
      expect(c.edge, 'no rounded bottom border').toBe(true);
      expect(c.rule).toBe('1px');
      expect(c.radius).toEqual(['0px', '0px']);
      expect(c.width, 'the rule spans the card').toBeLessThanOrEqual(1);
    }
    return;
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/projects/billable/');
  // WO-033: the "What it does" rules end where Stack's do, at the content column's edge.
  const ends = await page.evaluate(() => {
    const right = (s: string) => document.querySelector(s)!.getBoundingClientRect().right;
    return {
      features: right('.cs-features li'),
      stack: right('.cs-stack tbody td:last-child'),
      main: right('.cs-main'),
    };
  });
  expect(Math.abs(ends.features - ends.stack), 'features end with Stack').toBeLessThanOrEqual(1);
  expect(Math.abs(ends.features - ends.main)).toBeLessThanOrEqual(1);
  // The text inside keeps the reading measure.
  const measure = await page
    .locator('.cs-features li')
    .first()
    .evaluate((li) => {
      const range = document.createRange();
      range.selectNodeContents(li);
      const probe = document.createElement('span');
      probe.style.cssText = 'position: absolute; width: 68ch';
      li.append(probe);
      const m = probe.getBoundingClientRect().width;
      probe.remove();
      return { text: range.getBoundingClientRect().width, m };
    });
  expect(measure.text).toBeLessThanOrEqual(measure.m + 1);
  const pg = page.locator('.cs-pager .cs-pg-next');
  const e = await pg.evaluate((a) => {
    const text = (el: Element) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect();
    };
    const box = a.getBoundingClientRect();
    return {
      rule: { left: box.left, right: box.right },
      k: text(a.querySelector('.cs-pg-k')!).right,
      t: text(a.querySelector('.cs-pg-t')!).right,
    };
  });
  expect(Math.abs(e.k - e.rule.right), '"Next project" ends at its rule').toBeLessThanOrEqual(1);
  expect(Math.abs(e.t - e.rule.right), 'the title ends at its rule').toBeLessThanOrEqual(1);
});

// WO-023: the rail keeps its place. Open the 6th card, go Back, and the rail is where you left it.
test('projects rail keeps its place', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'the rail scrolls sideways on laptops');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#projects').evaluate((s) => s.scrollIntoView({ behavior: 'instant' }));
  const rail = page.locator('#rail');
  const fwd = page.getByRole('button', { name: 'Scroll projects forward' });
  await fwd.click();
  await fwd.click();
  const card = page.locator('#rail .pc-link').nth(5);
  await card.scrollIntoViewIfNeeded();
  const left = await rail.evaluate((r) => r.scrollLeft);
  expect(left).toBeGreaterThan(0);
  const href = await card.getAttribute('href');
  await card.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => rail.evaluate((r) => r.scrollLeft)).toBeGreaterThanOrEqual(left - 4);
  expect(Math.abs((await rail.evaluate((r) => r.scrollLeft)) - left)).toBeLessThanOrEqual(4);
  // Only Back/Forward restores it: a reload starts at the first card.
  await page.reload();
  expect(await rail.evaluate((r) => r.scrollLeft)).toBe(0);
});

// WO-039: Potluck Picker, the newest project, leads the rail with its own screen, and its case
// study tells the story, with the live address and no link to the private repo.
test('projects potluck picker leads the rail', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('#rail > li').first();
  await expect(first.locator('a.pc-link')).toHaveAttribute('href', '/projects/potluck-picker/');
  await expect(first.locator('.pc-title')).toHaveText('Potluck Picker');
  const art = first.locator('.pc-art img');
  await expect(art).toHaveCount(1);
  await expect(art).toHaveAttribute('src', /01-board/);
  await expect(first.locator('.pa-soon')).toHaveCount(0);
});

test('projects potluck picker case study', async ({ page }) => {
  await page.goto('/projects/potluck-picker/');
  await expect(page.getByRole('heading', { level: 1, name: 'Potluck Picker' })).toBeVisible();
  await expect(page.locator('.cs-problem')).toContainText('My mom wanted one link');
  expect(await page.locator('.cs-features li').count()).toBeGreaterThanOrEqual(5);
  expect(await page.locator('.cs-stack tbody tr').count()).toBeGreaterThanOrEqual(4);
  await expect(page.locator('.cs-note')).toHaveCount(3);

  // Five real screenshots, each described, and a hero that has loaded.
  const hero = page.locator('.cs-hero img');
  await expect(hero).toHaveAttribute('alt', /\S/);
  await expect
    .poll(() => hero.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0))
    .toBe(true);
  const shots = page.locator('#gallery .cs-gal img');
  await expect(shots).toHaveCount(5);
  await expect(page.locator('#gallery .cs-gal-soon')).toHaveCount(0);
  for (const img of await shots.all()) {
    await expect(img).toHaveAttribute('alt', /\S/);
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
  }
  await expect(page.locator('#gallery figcaption')).toHaveCount(5);

  // The live app is a real link in the facts; the repo is private, so nothing links to it.
  await expect(
    page.locator('.cs-facts a', { hasText: 'potluck-picker.pages.dev' }),
  ).toHaveAttribute('href', 'https://potluck-picker.pages.dev');
  for (const a of await page.locator('a[href]').all()) {
    const href = (await a.getAttribute('href'))!;
    expect(href).not.toMatch(/github\.com\/[^/]+\/potluck/i);
    if (/potluck-picker\.pages\.dev/.test(href))
      expect(href).toMatch(/^https:\/\/potluck-picker\.pages\.dev\/?$/);
  }
});

// WO-044: each Potluck screen's chosen file is sharp on a 3x phone: `sizes` matches the width the
// screen is drawn at, and the file picked is at least 2.5 times that width.
test('potluck gallery is sharp', async ({ browser, isMobile }) => {
  test.skip(!isMobile, 'one run is enough: it opens its own 3x phone');
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto('/projects/potluck-picker/');
  const imgs = page.locator('#gallery img');
  await expect(imgs).toHaveCount(5);
  for (const [i, img] of (await imgs.all()).entries()) {
    await img.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'start' }));
    await expect
      .poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0))
      .toBe(true);
    const r = await img.evaluate((e: HTMLImageElement) => {
      const pick = e.srcset
        .split(',')
        .map((s) => s.trim().split(/\s+/))
        .find(([url]) => e.currentSrc.endsWith(url));
      return {
        drawn: e.getBoundingClientRect().width,
        // With width descriptors, the chosen file's density makes this the `sizes` slot.
        slot: e.naturalWidth,
        file: pick ? parseInt(pick[1]) : 0,
      };
    });
    expect(Math.abs(r.slot - r.drawn), `screen ${i + 1}: sizes matches`).toBeLessThanOrEqual(2);
    expect(r.file / r.drawn, `screen ${i + 1}: file / drawn width`).toBeGreaterThanOrEqual(2.5);
  }
  await ctx.close();
});

// WO-044: on a phone the Potluck card shows a crop of its screen, wide enough to read; laptops
// keep the whole phone.
test('potluck card shows a readable crop', async ({ page, isMobile }) => {
  await page.goto('/');
  const img = page.locator('#rail > li').first().locator('.pc-art img');
  await img.scrollIntoViewIfNeeded();
  await expect
    .poll(() => img.evaluate((e: HTMLImageElement) => e.currentSrc))
    .toMatch(isMobile ? /\/card\./ : /\/01-board\./);
  if (isMobile) expect((await img.boundingBox())!.width).toBeGreaterThanOrEqual(100);
});
