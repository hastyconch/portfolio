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
  await expect(live).toContainText('Reward earned');

  await tab('Home').click();
  await expect(demo.getByText('Reward ready')).toBeVisible();
  await expect(demo.getByText('All 4 offers earned this week')).toBeVisible();
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
 *  are sampled 40px from the top (in Home's band) and 40px from the bottom. */
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
        'left (band)': [a, 40, b, 40],
        'right (band)': [w - a, 40, w - b, 40],
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
  // Home's teal band sits under the top and the upper sides: check the pixels.
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
