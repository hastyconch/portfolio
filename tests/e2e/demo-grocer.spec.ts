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

  // WO-036: at 375 no ring in the demo is clipped, on any tab (Phase 11 found the second Home
  // offer's ring cut by 4px in the old snapping carousel).
  await page.setViewportSize({ width: 375, height: 812 });
  const small = await grocerOnHome(page);
  const names = ['Home', 'Offers', 'Lists', 'Recipes'];
  for (const [k, name] of names.entries()) {
    const t = small.getByRole('tab', { name });
    if (k > 0) {
      // The tabs are one Tab stop: from the current tab, the arrow key moves to the next.
      await tabInto(page, small.getByRole('tab', { name: names[k - 1] }));
      await page.keyboard.press('ArrowRight');
    }
    await expect(t).toHaveAttribute('aria-selected', 'true');
    const stops = small.locator(
      '[role="tabpanel"] :is(button, input, a[href]), [role="tab"][aria-selected="true"]',
    );
    const n = await stops.count();
    expect(n, `${name}: has controls`).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const el = stops.nth(i);
      await tabInto(page, el);
      const r = await ring(el, '--gro-teal');
      const what = `${name} #${i}: ${await el.evaluate((e) => e.textContent?.trim() || e.tagName)}`;
      expect(r.width, what).toBeGreaterThanOrEqual(2);
      expect(r.ratio, what).toBeGreaterThanOrEqual(3);
      expect(r.clipped, what).toEqual([]);
    }
  }
});

test('demo-grocer offers clip in place', async ({ page }) => {
  await page.goto('/demos/grocer/');
  await page.waitForSelector('astro-island:not([ssr])');
  const demo = page.getByRole('group', { name: /grocer loyalty app/i });
  await demo.getByRole('tab', { name: 'Offers' }).click();

  // Each row's bonus or discount is its largest text.
  const rows = demo.locator('.gro-offer');
  expect(await rows.count()).toBeGreaterThanOrEqual(4);
  for (const row of await rows.all()) {
    const sizes = await row.evaluate((li) => {
      const px = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
      const hero = li.querySelector('.gro-bonus')!;
      let other = 0;
      for (const el of li.querySelectorAll('*')) {
        if (el === hero || hero.contains(el) || el.closest('.dk-sr')) continue;
        const own = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent!.trim());
        if (own) other = Math.max(other, px(el));
      }
      return { hero: px(hero), other, text: hero.textContent };
    });
    expect(sizes.hero, `${sizes.text} is the biggest text in its row`).toBeGreaterThan(sizes.other);
  }

  const tally = demo.locator('.gro-tally-n');
  const badge = demo.getByRole('tab', { name: 'Offers' }).locator('.gro-badge');
  await expect(tally).toHaveText(/^\+120\s*pts/);
  await expect(badge).toHaveText('1');

  // Load cereal: the same button, in the same place, turns filled with a check and "Loaded"
  // (its name follows the visible word, WO-041).
  const load = demo.getByRole('button', { name: /^Load(?:ed)? offer: Buy any cereal$/ });
  const before = await load.boundingBox();
  const fill = () => load.evaluate((b) => getComputedStyle(b).backgroundColor);
  const off = await fill();
  await expect(load).toHaveAttribute('aria-pressed', 'false');
  await load.click();
  await page.mouse.move(0, 0); // off the button, so the fill is the resting one, not the hover
  await expect(load).toHaveAttribute('aria-pressed', 'true');
  await expect(load.locator('.gro-load-on')).toHaveCSS('opacity', '1');
  await expect(load.locator('.gro-load-on')).toHaveText('Loaded');
  await expect(load.locator('.gro-load-on svg')).toBeVisible();
  await expect(load.locator('.gro-load-off')).toHaveCSS('opacity', '0');
  await expect.poll(fill, { message: 'filled once loaded' }).not.toBe(off);
  const hi = await demo.evaluate((app) => {
    const probe = document.createElement('i');
    probe.style.color = getComputedStyle(app).getPropertyValue('--gro-hi');
    app.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });
  await expect.poll(fill, { message: 'the highlight colour' }).toBe(hi);
  const after = await load.boundingBox();
  expect(after?.x, 'in place').toBeCloseTo(before!.x, 0);
  expect(after?.width, 'same size').toBeCloseTo(before!.width, 0);

  // The running total and the tab badge follow.
  await expect(tally).toHaveText(/^\+170\s*pts/);
  await expect(badge).toHaveText('2');
  await expect(demo.locator('[aria-live="polite"]')).toContainText('Loaded offer: Buy any cereal');

  // And back: unloading reverses all three.
  await load.click();
  await expect(load).toHaveAttribute('aria-pressed', 'false');
  await expect(tally).toHaveText(/^\+120\s*pts/);
  await expect(badge).toHaveText('1');
});

test('demo-grocer home leads with the balance', async ({ page }) => {
  await page.goto('/demos/grocer/');
  await page.waitForSelector('astro-island:not([ssr])');
  const demo = page.getByRole('group', { name: /grocer loyalty app/i });
  const panel = demo.getByRole('tabpanel');

  // The balance is the first thing in the panel and its biggest text.
  const balance = panel.locator('.gro-points');
  await expect(balance).toHaveText(/^4,650\s*pts$/);
  const biggest = await panel.evaluate((root) => {
    let max = 0;
    let who = '';
    for (const el of root.querySelectorAll('*')) {
      const own = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent!.trim());
      const px = parseFloat(getComputedStyle(el).fontSize);
      if (own && px > max) [max, who] = [px, el.className];
    }
    return who;
  });
  expect(biggest).toBe('gro-points');
  const firstText = await panel.evaluate((root) => root.textContent!.trim().slice(0, 40));
  expect(firstText).toMatch(/^Hi Sam · Pantry Points4,650/);

  // A labelled bar to the next reward, not a bare percentage.
  const bar = panel.getByRole('progressbar', { name: '350 pts to $10 off' });
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('aria-valuenow', '4650');
  await expect(bar).toHaveAttribute('aria-valuemax', '5000');
  await expect(panel.getByText('350 pts to $10 off')).toBeVisible();
  await expect(panel.getByText('%')).toHaveCount(0);
  const box = await bar.boundingBox();
  expect(box!.width, 'a bar, not a ring').toBeGreaterThan(box!.height * 10);

  // Then a short picked-for-you run, then the list.
  const order = await panel.evaluate((root) =>
    [...root.querySelectorAll('.gro-balance, .gro-picks, .gro-next')].map((n) => n.className),
  );
  expect(order).toEqual(['gro-balance', 'gro-picks', 'gro-next']);
  expect(await panel.locator('.gro-picks .gro-offer').count()).toBeLessThanOrEqual(3);
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
  await demo.getByRole('button', { name: 'Load all' }).click();
  const loads = demo.getByRole('button', { name: /^Load(?:ed)? offer/ });
  await expect(loads).toHaveCount(5);
  for (const b of await loads.all()) {
    await expect(b).toHaveAttribute('aria-pressed', 'true');
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
  await expect(live).toContainText('Reward earned');
  await expect(live).toContainText('plus 435 points');
  await expect(live).toContainText('$2 off');
  await expect(demo.getByText('Reward unlocked')).toBeVisible();
  await expect(demo.getByText('5,085', { exact: true })).toBeVisible();

  await tab('Home').click();
  await expect(demo.getByText('Reward ready')).toBeVisible();
  await expect(demo.locator('.gro-points')).toHaveText(/^5,085/);
  await expect(demo.getByText('All 5 offers earned this week')).toBeVisible();
});

// WO-031: on home the demo's own teal ring wins over the site's (it lost on specificity before),
// with at least 3:1 against the surface beside it and no clipping by the app's frame.
// (The ring helpers match demo-airline.spec.ts.)

/** Home, with the grocer demo open (phones press "Try the demo" first) and hydrated. */
async function grocerOnHome(page: Page) {
  await page.goto('/');
  const article = page.locator('article').filter({ has: page.locator('.gro-app') });
  const tryIt = article.locator('[data-wk-try]');
  if (await tryIt.isVisible()) await tryIt.click();
  await article.locator('.gro-app').scrollIntoViewIfNeeded();
  await page.locator('astro-island:not([ssr]) .gro-app').waitFor();
  return page.getByRole('group', { name: /grocer loyalty app/i });
}

/** Focus `target` the way a keyboard does: from the element before it, press Tab. */
async function tabInto(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  await target.evaluate((el) => {
    const stops = [
      ...document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, summary, [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((n) => n.getClientRects().length);
    stops[stops.indexOf(el as HTMLElement) - 1]?.focus();
  });
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
}

/** The focused element's ring: colour, the demo's own ring colour (`own`, a custom property on
 *  the app), the surface it sits on, their contrast, and any side an overflow-clipping ancestor
 *  cuts off. Colours are composited to sRGB hex. */
async function ring(el: Locator, own: string) {
  return el.evaluate((e, ownVar) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true })!;
    const paint = (c: string) => {
      cx.fillStyle = c;
      cx.fillRect(0, 0, 1, 1);
      return [...cx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const hex = (c: number[]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
    const lum = (c: number[]) =>
      c
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const cs = getComputedStyle(e);
    const offset = parseFloat(cs.outlineOffset);
    const width = cs.outlineStyle === 'none' ? 0 : parseFloat(cs.outlineWidth);
    // The surface: an outset ring sits on the parent's backgrounds, an inset one on its own.
    const chain: string[] = [];
    for (let n = offset < 0 ? e : e.parentElement; n; n = n.parentElement) {
      chain.push(getComputedStyle(n).backgroundColor);
    }
    let surface = paint('#fff');
    for (const c of chain.reverse()) surface = paint(c);
    const color = paint(cs.outlineColor);
    const [hi, lo] = [lum(color), lum(surface)].sort((a, b) => b - a);
    const app = e.closest('.sky-app, .gro-app')!;
    paint('#fff');
    const expected = paint(getComputedStyle(app).getPropertyValue(ownVar).trim());
    const r = e.getBoundingClientRect();
    const g = offset + width;
    const clipped: string[] = [];
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const ns = getComputedStyle(n);
      if (ns.overflowX === 'visible' && ns.overflowY === 'visible') continue;
      const nr = n.getBoundingClientRect();
      if (r.top - g < nr.top - 0.5) clipped.push('top');
      if (r.bottom + g > nr.bottom + 0.5) clipped.push('bottom');
      if (r.left - g < nr.left - 0.5) clipped.push('left');
      if (r.right + g > nr.right + 0.5) clipped.push('right');
    }
    return {
      color: hex(color),
      own: hex(expected),
      ratio: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100,
      offset,
      width,
      clipped: [...new Set(clipped)],
    };
  }, own);
}

/** An inset ring, from a screenshot: on each side, the contrast between the ring (half a ring
 *  width in from the edge) and the pixels just inside it (one ring width further in). The sides
 *  are sampled 40px from the top and 40px from the bottom. */
async function insetEdges(page: Page, el: Locator, ring: number) {
  const png = (await el.screenshot({ scale: 'css', animations: 'disabled' })).toString('base64');
  const { width: w, height: h } = (await el.boundingBox())!;
  return page.evaluate(
    async ({ png, w, h, ring }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const cx = cv.getContext('2d', { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const px = (x: number, y: number) =>
        [
          ...cx.getImageData(
            Math.floor((x * img.width) / w),
            Math.floor((y * img.height) / h),
            1,
            1,
          ).data,
        ].slice(0, 3);
      const lum = (c: number[]) =>
        c
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      const ratio = (p: number[], q: number[]) => {
        const [hi, lo] = [lum(p), lum(q)].sort((a, b) => b - a);
        return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
      };
      const a = ring / 2;
      const b = ring * 1.5;
      const at: Record<string, [number, number, number, number]> = {
        top: [w - 12, a, w - 12, b],
        'left (top)': [a, 40, b, 40],
        'right (top)': [w - a, 40, w - b, 40],
        left: [a, h - 40, b, h - 40],
        right: [w - a, h - 40, w - b, h - 40],
        bottom: [8, h - a, 8, h - b],
      };
      return Object.fromEntries(
        Object.entries(at).map(([k, [x1, y1, x2, y2]]) => [k, ratio(px(x1, y1), px(x2, y2))]),
      );
    },
    { png, w, h, ring },
  );
}

test("demo-grocer focus ring is the demo's on home", async ({ page }) => {
  for (const scheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const demo = await grocerOnHome(page);
    const load = demo.getByRole('button', { name: /^Load offer/ }).first();
    await tabInto(page, load);
    const r = await ring(load, '--gro-teal');
    expect(r.color, `${scheme}: the demo's teal, not the site accent`).toBe(r.own);
    expect(r.width, scheme).toBeGreaterThanOrEqual(2);
    expect(r.ratio, `${scheme}: ring against its surface`).toBeGreaterThanOrEqual(3);
    expect(r.clipped, scheme).toEqual([]);
  }
});

test('demo-grocer panel and tab bar rings are inset', async ({ page }) => {
  const demo = await grocerOnHome(page);
  // The panel is a Tab stop only as a keyboard-focusable scroller (a tab with no controls in
  // it); make it one here to check the ring's geometry.
  const panel = demo.getByRole('tabpanel');
  await panel.evaluate((el) => (el.tabIndex = 0));
  await tabInto(page, panel);
  let r = await ring(panel, '--gro-teal');
  expect(r.color).toBe(r.own);
  expect(r.offset + r.width, 'the ring sits inside the panel').toBeLessThanOrEqual(0);
  expect(r.clipped, 'all four sides show').toEqual([]);
  // Check the pixels: the ring shows against whatever is inside it on every side.
  for (const [side, ratio] of Object.entries(await insetEdges(page, panel, r.width))) {
    expect(ratio, `${side} edge of the ring against the pixels inside it`).toBeGreaterThanOrEqual(
      3,
    );
  }

  // The tab bar sits on the screen's rounded bottom edge: the ring sits inside each tab, and the
  // corner tab's ring curves with the screen.
  const home = demo.getByRole('tab', { name: 'Home' });
  await tabInto(page, home);
  r = await ring(home, '--gro-teal');
  expect(r.offset + r.width, 'inside the tab').toBeLessThan(0);
  expect(r.clipped).toEqual([]);
  const corner = await home.evaluate((el) => ({
    tab: getComputedStyle(el).borderBottomLeftRadius,
    screen: getComputedStyle(el.closest('.df-screen')!).borderBottomLeftRadius,
  }));
  expect(corner.tab, 'curves with the screen corner').toBe(corner.screen);
});

// WO-041: focus follows the action, every control fits a thumb, and Load's name says its state.
// (onScreen and settle match demo-airline.spec.ts.)

/** Where `el` sits against the visible page: the band under the site's sticky header. */
async function onScreen(el: Locator) {
  return el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const header = document.querySelector('header.np')?.getBoundingClientRect().bottom ?? 0;
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      header: Math.round(header),
      view: window.innerHeight,
    };
  });
}

/** Settle the demos' own animations, then the page's smooth scroll. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => {
          const target = (a.effect as KeyframeEffect | null)?.target;
          return target instanceof Element && target.closest('.sky-app, .gro-app');
        })
        .map((a) => a.finished.catch(() => undefined)),
    );
    let y = -1;
    while (y !== window.scrollY) {
      y = window.scrollY;
      await new Promise((r) => setTimeout(r, 150));
    }
  });
}

/** `el` has focus, and its top edge is on screen under the site header. */
async function expectFocusShown(page: Page, el: Locator, what: string) {
  await expect(el, `${what}: focused`).toBeFocused();
  await settle(page);
  const at = await onScreen(el);
  expect(at.top, `${what}: top under the header ${JSON.stringify(at)}`).toBeGreaterThanOrEqual(
    at.header - 1,
  );
  expect(at.top, `${what}: top on screen`).toBeLessThan(at.view - 100);
}

test('grocer focus follows tab switches', async ({ page }) => {
  const demo = await grocerOnHome(page);
  const tab = (name: string) => demo.getByRole('tab', { name });
  const press = async (name: string) => {
    const control = demo.getByRole('button', { name });
    await tabInto(page, control);
    // tabInto's stepping can start a smooth scroll; press once the page is still.
    await settle(page);
    await page.keyboard.press('Enter');
  };

  await press('See all 5');
  await expect(tab('Offers')).toHaveAttribute('aria-selected', 'true');
  await expectFocusShown(page, demo.getByRole('tabpanel', { name: 'Offers' }), 'See all 5');

  await tab('Home').click();
  await press('Open list');
  await expect(tab('Lists')).toHaveAttribute('aria-selected', 'true');
  await expectFocusShown(page, demo.getByRole('tabpanel', { name: 'Lists' }), 'Open list');

  // Check out the whole list: the button goes away with it, and focus lands on the receipt.
  for (const box of await demo.getByRole('checkbox').all()) {
    if (!(await box.isChecked())) await box.check();
  }
  await press('Check out');
  await expect(demo.getByRole('button', { name: /^Check out/ })).toHaveCount(0);
  await expectFocusShown(page, demo.getByRole('group', { name: 'Receipt' }), 'Check out');

  await press('See this week’s recipe');
  await expectFocusShown(page, demo.getByRole('tabpanel', { name: 'Recipes' }), 'See recipe');

  await tab('Home').click();
  await press('View receipt');
  await expectFocusShown(page, demo.getByRole('tabpanel', { name: 'Lists' }), 'View receipt');
});

test('grocer checkout focuses the receipt with items left', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'a phone, where the button scrolled out of view');
  const demo = await grocerOnHome(page);
  await demo.getByRole('tab', { name: 'Lists' }).click();
  await demo.getByRole('checkbox', { name: 'Bananas' }).check();
  const checkout = demo.getByRole('button', { name: /^Check out/ });
  await tabInto(page, checkout);
  await page.keyboard.press('Enter');
  await expectFocusShown(page, demo.getByRole('group', { name: 'Receipt' }), 'Check out');
  // The ring is on the box around the slip, outside the slip's torn-edge mask.
  const ring = await demo
    .getByRole('group', { name: 'Receipt' })
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(ring).not.toBe('none');
});

test('grocer targets fit a thumb', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'a touch screen at 375');
  expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
  const demo = await grocerOnHome(page);
  const all: { name: string | null | undefined; h: number }[] = [];
  const measure = async () =>
    all.push(
      ...(await demo.locator('button').evaluateAll((els) =>
        els
          .filter((b) => b.getClientRects().length)
          .map((b) => ({
            name: b.textContent?.trim(),
            h: Math.round(b.getBoundingClientRect().height * 10) / 10,
          })),
      )),
    );
  for (const name of ['Home', 'Offers', 'Lists', 'Recipes']) {
    await demo.getByRole('tab', { name }).click();
    await measure();
  }
  // After a checkout: the receipt's links on Lists and Home.
  await demo.getByRole('tab', { name: 'Lists' }).click();
  for (const box of await demo.getByRole('checkbox').all()) await box.check();
  await demo.getByRole('button', { name: /^Check out/ }).click();
  await measure();
  await demo.getByRole('tab', { name: 'Home' }).click();
  await measure();
  expect(all.length).toBeGreaterThan(15);
  expect(all.filter((b) => b.h < 44)).toEqual([]);
});

test('grocer loaded state is named', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'runs once, on desktop');
  await page.goto('/demos/grocer/');
  await page.waitForSelector('astro-island:not([ssr])');
  const demo = page.getByRole('group', { name: /grocer loyalty app/i });
  await demo.getByRole('tab', { name: 'Offers' }).click();

  // The name carries the visible word: "Load" before, "Loaded" after (label in name, 2.5.3).
  const load = demo.getByRole('button', { name: 'Load offer: Buy any cereal', exact: true });
  await load.click();
  const loaded = demo.getByRole('button', { name: 'Loaded offer: Buy any cereal', exact: true });
  await expect(loaded).toHaveAttribute('aria-pressed', 'true');
  await expect(loaded.locator('.gro-load-on')).toHaveText('Loaded');
  await loaded.click();
  await expect(load).toHaveAttribute('aria-pressed', 'false');

  // Every aria-controls points at an element that exists, and the selected tab at its panel.
  for (const name of ['Home', 'Offers', 'Lists', 'Recipes']) {
    const t = demo.getByRole('tab', { name });
    await t.click();
    const missing = await demo.evaluate((app) =>
      [...app.querySelectorAll('[aria-controls]')]
        .map((el) => el.getAttribute('aria-controls')!)
        .filter((id) => !document.getElementById(id)),
    );
    expect(missing, `${name} selected`).toEqual([]);
    const id = await t.getAttribute('aria-controls');
    await expect(demo.getByRole('tabpanel')).toHaveAttribute('id', id!);
  }
});

test('grocer offer names keep their width', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones, 320 to 390');
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 800 });
    const demo = await grocerOnHome(page);
    await demo.getByRole('tab', { name: 'Offers' }).click();
    const rows = await demo.locator('.gro-offer').evaluateAll((els) =>
      els.map((li) => ({
        name: li.querySelector('.gro-offer-t')!.textContent,
        w: Math.round(li.querySelector('.gro-offer-t')!.getBoundingClientRect().width),
      })),
    );
    for (const r of rows) expect(r.w, `${width}: "${r.name}"`).toBeGreaterThanOrEqual(136);
    // The checkout line breaks between its parts, not inside "+10 pts".
    await demo.getByRole('tab', { name: 'Lists' }).click();
    await demo.getByRole('checkbox', { name: 'Bananas' }).check();
    const est = demo.locator('.gro-checkout .gro-nowrap');
    await expect(est).toHaveText(/^about \+\d+ pts$/);
    const lines = await est.evaluate(
      (e) => e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight),
    );
    expect(lines, `${width}: one line`).toBeLessThan(1.5);
  }
});
