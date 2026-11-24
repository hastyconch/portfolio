import { test, expect, type Locator, type Page } from '@playwright/test';
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
  // WO-035: Redeem leads with the balance, then a type-led list: the points price right-aligned
  // in each row, the taxes under it and the cash fare as a comparison.
  const panel = demo.getByRole('tabpanel');
  await expect(panel.locator('.sky-hero')).toHaveText('48,250 pts');
  const lisbon = panel.locator('.sky-dest').filter({ hasText: 'Lisbon' });
  await expect(lisbon).toContainText('35,000 pts');
  await expect(lisbon).toContainText('+ $89 taxes');
  await expect(lisbon).toContainText('or $612 cash');
  const edges = await panel.locator('.sky-dest').evaluateAll((rows) =>
    rows.map((row) => {
      const right = (sel: string) => row.querySelector(sel)!.getBoundingClientRect().right;
      const cs = getComputedStyle(row);
      const inner = row.getBoundingClientRect().right - parseFloat(cs.paddingRight);
      return [right('.sky-dest-pts'), right('.sky-dest-tax'), inner].map(Math.round);
    }),
  );
  for (const [pts, tax, inner] of edges) {
    expect(pts, 'points flush right').toBe(inner);
    expect(tax, 'taxes flush right').toBe(inner);
  }
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
  await expect(demo.getByRole('group', { name: 'Your reward trip' })).toContainText('LIS');
  await expect(demo.getByText('13,250 points', { exact: true })).toBeAttached();
});

// WO-031: on home the demo's own ring wins over the site's (it lost on specificity before), so it
// is the same ring as on /demos/airline/, with at least 3:1 against the surface beside it, and
// no clipping by the app's rounded, overflow-hidden frame.

/** Home, with the airline demo open (phones press "Try the demo" first) and hydrated. */
async function airlineOnHome(page: Page) {
  await page.goto('/');
  const article = page.locator('article').filter({ has: page.locator('.sky-app') });
  const tryIt = article.locator('[data-wk-try]');
  if (await tryIt.isVisible()) await tryIt.click();
  await article.locator('.sky-app').scrollIntoViewIfNeeded();
  await page.locator('astro-island:not([ssr]) .sky-app').waitFor();
  return page.getByRole('group', { name: /airline loyalty app/i });
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

test("demo-airline focus ring is the demo's on home", async ({ page }) => {
  for (const scheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const demo = await airlineOnHome(page);
    const book = demo.getByRole('button', { name: 'Book reward' });
    await tabInto(page, book);
    const r = await ring(book, '--sky-plum');
    expect(r.color, `${scheme}: the demo's plum, not the site accent`).toBe(r.own);
    expect(r.width, scheme).toBeGreaterThanOrEqual(2);
    expect(r.ratio, `${scheme}: ring against its surface`).toBeGreaterThanOrEqual(3);
    expect(r.clipped, scheme).toEqual([]);
  }
});

test('demo-airline panel ring is inset', async ({ page }) => {
  for (const scheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const demo = await airlineOnHome(page);
    const panel = demo.getByRole('tabpanel');
    await tabInto(page, panel);
    const r = await ring(panel, '--sky-plum');
    expect(r.color, scheme).toBe(r.own);
    expect(r.offset + r.width, `${scheme}: the ring sits inside the panel`).toBeLessThanOrEqual(0);
    expect(r.clipped, `${scheme}: all four sides show`).toEqual([]);
    expect(r.ratio, scheme).toBeGreaterThanOrEqual(3);
    // Home's plum band sits under the top and the upper sides: check the pixels.
    for (const [side, ratio] of Object.entries(await insetEdges(page, panel, r.width))) {
      expect(
        ratio,
        `${scheme}: ${side} edge of the ring against the pixels inside it`,
      ).toBeGreaterThanOrEqual(3);
    }
  }

  // The tab bar sits on the screen's rounded bottom edge: the ring sits inside each tab, and the
  // corner tab's ring curves with the screen.
  const home = page.getByRole('group', { name: /airline loyalty app/i }).getByRole('tab', {
    name: 'Home',
  });
  await tabInto(page, home);
  const r = await ring(home, '--sky-plum');
  expect(r.offset + r.width, 'inside the tab').toBeLessThan(0);
  expect(r.clipped).toEqual([]);
  const corner = await home.evaluate((el) => ({
    tab: getComputedStyle(el).borderBottomLeftRadius,
    screen: getComputedStyle(el.closest('.df-screen')!).borderBottomLeftRadius,
  }));
  expect(corner.tab, 'curves with the screen corner').toBe(corner.screen);
});

/** The demo on home (opened and hydrated) or on its own harness page. */
async function open(page: Page, route: string) {
  if (route === '/') return airlineOnHome(page);
  await page.goto(route);
  await page.waitForSelector('astro-island:not([ssr])');
  return page.getByRole('group', { name: /airline loyalty app/i });
}

// WO-035: the quick actions on Home are one row of equal buttons whose labels never wrap, in every
// pane the demo appears in: the Work section at three laptop sizes and a phone, and the harness.
test('demo-airline actions stay on one line', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'the sizes are set here, one by one');
  const panes: [string, number, number][] = [
    ['/', 1440, 900],
    ['/', 1366, 768],
    ['/', 1280, 800],
    ['/', 375, 812],
    [ROUTE, 1440, 900],
  ];
  for (const [route, w, h] of panes) {
    await page.setViewportSize({ width: w, height: h });
    const demo = await open(page, route);
    const acts = demo.getByRole('list', { name: 'Quick actions' }).getByRole('button');
    await expect(acts).toHaveCount(3);
    const m = await acts.evaluateAll((els) =>
      els.map((b) => {
        const label = b.querySelector(':scope > span')!;
        return {
          name: b.textContent,
          h: Math.round(b.getBoundingClientRect().height),
          lines: label.getClientRects().length,
          clipped: b.scrollWidth > b.clientWidth,
        };
      }),
    );
    const where = `${route} at ${w}×${h}`;
    expect(new Set(m.map((a) => a.h)).size, `${where}: equal heights ${JSON.stringify(m)}`).toBe(1);
    for (const a of m) {
      expect(a.lines, `${where}: "${a.name}" on one line`).toBe(1);
      expect(a.clipped, `${where}: "${a.name}" fits its button`).toBe(false);
    }
  }
});

// WO-035: on Status nothing leaves its box: every element of the progress track and the tier list
// sits inside its parent, no label is cut off, and no perk label runs past two lines.
test('demo-airline status has no overflow', async ({ page, isMobile }) => {
  const panes: [string, number, number][] = isMobile
    ? [['/', 375, 812]]
    : [
        [ROUTE, 1440, 900],
        ['/', 1366, 768],
        ['/', 1280, 800],
      ];
  for (const [route, w, h] of panes) {
    await page.setViewportSize({ width: w, height: h });
    const demo = await open(page, route);
    await demo.getByRole('tab', { name: 'Status' }).click();
    const status = demo.locator('.sky-status');
    await expect(status).toBeVisible();
    // Let the demo's own entrance animations finish (the page around it may run others).
    await status.evaluate((root) =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => root.contains((a.effect as KeyframeEffect | null)?.target ?? null))
          .map((a) => a.finished),
      ),
    );
    const bad = await status.evaluate((root) => {
      const out: string[] = [];
      const name = (e: Element) =>
        `${e.tagName.toLowerCase()}.${[...e.classList].join('.')} "${e.textContent?.slice(0, 24)}"`;
      for (const el of root.querySelectorAll('*')) {
        if (el.closest('.dk-sr') || !el.parentElement) continue;
        const r = el.getBoundingClientRect();
        const p = el.parentElement.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        if (r.left < p.left - 0.5 || r.right > p.right + 0.5)
          out.push(`${name(el)} leaves its parent sideways`);
        if (r.top < p.top - 0.5 || r.bottom > p.bottom + 0.5)
          out.push(`${name(el)} leaves its parent vertically`);
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible')
          out.push(`${name(el)} is cut off`);
      }
      for (const label of root.querySelectorAll('.sky-perk > span')) {
        const lh = parseFloat(getComputedStyle(label).lineHeight);
        if (label.getBoundingClientRect().height > lh * 2 + 1)
          out.push(`perk "${label.textContent}" runs past two lines`);
      }
      return out;
    });
    expect(bad, `${route} at ${w}×${h}`).toEqual([]);
  }
});
