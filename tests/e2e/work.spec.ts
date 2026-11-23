import { test, expect, type Page } from '@playwright/test';

// WO-015: on laptops each demo engagement is one pane, one viewport tall below the sticky nav.
// The page scrolls freely: WO-023 removed the vertical snap. Skill badges are text, never focusable.

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

// WO-025: the wide demos' frames don't trap the wheel. With the pointer over the Scheduler or the
// Pipeline, the page keeps scrolling: a frame its content fits doesn't scroll at all, and there is
// no overscroll containment.
const WIDE = ['.df-screen:has(.sch-app)', '.df-screen:has(.pl)'];

test('work wheel passes over demos', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'a mouse wheel');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  for (const sel of WIDE) {
    const screen = page.locator(`#work ${sel}`);
    await screen.scrollIntoViewIfNeeded();
    await expect(screen.locator('astro-island')).not.toHaveAttribute('ssr');
    const box = (await screen.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, Math.max(box.y + 60, 200));
    const start = await page.evaluate(() => window.scrollY);
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(60);
    }
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { message: `wheel over ${sel}` })
      .toBeGreaterThanOrEqual(start + 800);
  }
});

test('work swipe passes over demos', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'a touch swipe on a phone');
  await page.goto('/');
  const screen = page.locator(`#work ${WIDE[0]}`);
  const article = page.locator('#work article').filter({ has: page.locator('.sch-app') });
  await article.getByRole('button', { name: /^Try the demo/ }).click();
  await expect(screen.locator('astro-island')).not.toHaveAttribute('ssr');
  // Put a point 150px into the expanded scheduler at y = 600, then swipe up 300px from there.
  await page.evaluate((sel) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const top = document.querySelector(sel)!.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + 150 - 600);
  }, `#work ${WIDE[0]}`);
  const start = await page.evaluate(() => window.scrollY);
  expect(
    await page.evaluate(() => !!document.elementFromPoint(187, 600)?.closest('.df-screen')),
    'the swipe starts over the demo',
  ).toBe(true);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 187, y: 600 }],
  });
  for (let i = 1; i <= 15; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 187, y: 600 - i * 20 }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(start + 200);
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

// WO-025: skill tags are quiet (a neutral hairline, no accent edge), so the phone "Try the demo"
// button is the one thing that reads as a control. Its name is "Try the demo: {name}" and its one
// line is the description. WO-028: the tags are plain (no fill, weight 500 at most) and the
// button is filled with the accent, its label centred.
test('work demo button and tags', async ({ page, isMobile }) => {
  await page.goto('/');
  const accent = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ln-accent)';
    document.querySelector('#work')!.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });
  const borders = await page.locator('#work .wk-badges li').evaluateAll((lis) =>
    lis.flatMap((li) => {
      const s = getComputedStyle(li);
      return ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
        width: s.getPropertyValue(`border-${side.toLowerCase()}-width`),
        color: s.getPropertyValue(`border-${side.toLowerCase()}-color`),
      }));
    }),
  );
  expect(borders.length).toBeGreaterThan(0);
  for (const b of borders) {
    expect(b.color, 'tag border is not the accent').not.toBe(accent);
    expect(b.width, 'tag border is a hairline').toBe('1px');
  }
  const tags = await page.locator('#work .wk-badges li').evaluateAll((lis) =>
    lis.map((li) => {
      const s = getComputedStyle(li);
      return { bg: s.backgroundColor, weight: Number(s.fontWeight), cursor: s.cursor };
    }),
  );
  for (const t of tags) {
    expect(t.bg, 'tag has no fill').toBe('rgba(0, 0, 0, 0)');
    expect(t.weight, 'tag weight').toBeLessThanOrEqual(500);
    expect(t.cursor, 'tag does not look tappable').not.toBe('pointer');
  }

  if (!isMobile) return;
  const button = page.locator('#work [data-wk-try]').first();
  await expect(button).toHaveAccessibleName('Try the demo: Airline loyalty app');
  await expect(button).toHaveAccessibleDescription('Track tier progress, book a reward.');
  await expect(button).toHaveText('Try the demo: Airline loyalty app ▸');
  await expect(button.locator('[aria-hidden="true"]')).toHaveText('▸');
  await expect(button).not.toContainText('↓');
  const fill = await button.evaluate((b) => {
    const s = getComputedStyle(b);
    return { bg: s.backgroundColor, align: s.textAlign };
  });
  expect(fill.bg, 'the button is filled with the accent').toBe(accent);
  expect(fill.align, 'the label is centred').toBe('center');
  // The one line stays outside the button, beneath it.
  await expect(button.locator('.wk-try-d')).toHaveCount(0);
  const line = (await page
    .locator(`#${await button.getAttribute('aria-describedby')}`)
    .boundingBox())!;
  const box = (await button.boundingBox())!;
  expect(line.y, 'the line sits beneath the button').toBeGreaterThanOrEqual(box.y + box.height);
  for (const b of await page.locator('#work [data-wk-try]').all()) {
    await expect(b).toHaveAccessibleName(/^Try the demo: \S/);
    const box = (await b.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

// WO-025: the demos add no region landmarks. Their inner groupings are named groups, and the
// phone wrapper is a group only once revealed; on wider screens it has no role or name at all.
test('work demos add no landmarks', async ({ page, isMobile }) => {
  await page.goto('/');
  const stray = () =>
    page.evaluate(
      () =>
        document.querySelectorAll(
          '#work .wk-demo :is(section[aria-label], section[aria-labelledby], [role="region"])',
        ).length,
    );
  if (isMobile) {
    for (const b of await page.locator('#work [data-wk-try]').all()) await b.click();
  } else {
    await expect(page.locator('#work .wk-demo:is([role], [aria-label])')).toHaveCount(0);
  }
  for (const demo of await page.locator('#work .wk-live .wk-demo').all()) {
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('astro-island').first()).not.toHaveAttribute('ssr');
  }
  expect(await stray()).toBe(0);
  await expect(page.locator('#work .wk-demo').getByRole('region')).toHaveCount(0);
  await expect(page.locator('#work .wk-demo[role="region"]')).toHaveCount(0);
  if (isMobile) await expect(page.locator('#work .wk-demo[role="group"]')).toHaveCount(4);
});

// WO-024, WO-028: on phones every demo waits behind "Try the demo" and loads nothing until it is
// pressed. Pressing one reveals the demo, hydrates it and focuses it.
const LATER_DEMOS = /(AirlineDemo|GrocerDemo|SchedulerDemo|PipelineDemo)[^/]*\.js/;

test('work phone demos expand on demand', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  const chunks: string[] = [];
  page.on('request', (r) => {
    if (LATER_DEMOS.test(r.url())) chunks.push(r.url());
  });
  await page.goto('/');

  // Projects starts within about seven screens (WO-028).
  const projectsTop = await page.evaluate(
    () => document.querySelector('#projects')!.getBoundingClientRect().top + window.scrollY,
  );
  expect(projectsTop, 'Projects top at 375 x 812').toBeLessThanOrEqual(5700);

  const buttons = page.getByRole('button', { name: /^Try the demo/ });
  await expect(buttons).toHaveCount(4);
  // Every demo engagement is collapsed, the first one too.
  const articles = page.locator('#work .wk-live article');
  await expect(articles).toHaveCount(4);
  for (const a of await articles.all()) {
    await expect(a.locator('.wk-demo')).toBeHidden();
    await expect(a.getByRole('button', { name: /^Try the demo/ })).toHaveCount(1);
  }
  for (const b of await buttons.all()) {
    const box = await b.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(300);
  }
  await expect(page.locator('#work .wk-collapse .wk-demo:visible')).toHaveCount(0);

  // Scrolling the whole page past them loads no demo code.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(30);
  }
  await page.waitForLoadState('networkidle');
  expect(chunks, 'collapsed demo code requested before Try the demo').toEqual([]);

  // Press the first one: the demo shows, takes focus, and its code loads and hydrates. The page
  // doesn't jump past the engagement (WO-025): its title stays on screen, clear of the header.
  const id = await buttons.first().getAttribute('aria-controls');
  const first = page.locator(`[aria-controls="${id}"]`);
  const region = page.locator(`#${id}`);
  const article = page.locator('#work article').filter({ has: region });
  await first.scrollIntoViewIfNeeded();
  const loaded = page.waitForRequest((r) => LATER_DEMOS.test(r.url()));
  await first.click();
  await expect(region).toBeVisible();
  await expect(region).toBeFocused();
  await expect(region).toHaveAttribute('role', 'group');
  await expect(region).toHaveAccessibleName('Airline loyalty app demo');
  const nav = await navHeight(page);
  const title = article.locator('.wk-title');
  await expect(title).toBeInViewport();
  await expect
    .poll(() => title.evaluate((t) => Math.round(t.getBoundingClientRect().top)))
    .toBeGreaterThanOrEqual(nav);
  await page.waitForTimeout(800); // a smooth scroll settles
  const top = await title.evaluate((t) => t.getBoundingClientRect().top);
  expect(top, 'title clear of the header').toBeGreaterThanOrEqual(nav);
  expect(top, 'title on screen').toBeLessThan(812 - 40);
  await expect(region).toBeFocused();
  await loaded;
  await expect(region.locator('astro-island')).not.toHaveAttribute('ssr');
  await expect(first).toBeHidden();
  // The other three stay collapsed.
  expect(chunks).toHaveLength(1);
  await expect(page.getByRole('button', { name: /^Try the demo/ })).toHaveCount(3);
});

test('work demos all show inline on laptops and without scripting', async ({
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, 'one pass covers both cases');
  for (const opts of [
    { viewport: { width: 1440, height: 900 } },
    { viewport: { width: 375, height: 812 }, javaScriptEnabled: false },
  ]) {
    const ctx = await browser.newContext({ ...opts, baseURL });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Try the demo/ })).toHaveCount(0);
    await expect(page.locator('#work .wk-live .wk-demo:visible')).toHaveCount(4);
    await ctx.close();
  }
});
