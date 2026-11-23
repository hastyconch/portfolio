import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { routes } from './routes';

const slug = (r: string) => (r === '/' ? 'home' : r.replace(/^\/|\/$/g, '').replace(/\//g, '__'));

// WO-024: phones, exits and the résumé PDF.
const profile = JSON.parse(readFileSync('src/content/profile.json', 'utf8'))[0] as {
  status: string;
  links: { label: string; href: string }[];
};
const isReal = (href: string) => /^(https?|mailto):/.test(href);

test('hero first screen on phones', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  await page.goto('/');
  const hero = page.locator('#hero');
  // WO-026: the link row holds only working links (Email and LinkedIn once they are real).
  const contacts = profile.links.filter(
    (l) => ['Email', 'LinkedIn'].includes(l.label) && isReal(l.href),
  );
  const items = [
    hero.getByRole('heading', { level: 1 }),
    hero.locator('.hero-headline'),
    hero.getByRole('link', { name: 'Résumé' }),
    ...contacts.map((l) => hero.getByRole('link', { name: l.label, exact: true })),
    hero.getByRole('link', { name: /See the work/ }),
  ];
  for (const el of items) {
    await expect(el).toBeVisible();
    const box = (await el.boundingBox())!;
    expect(
      box.y + box.height,
      `${await el.textContent()} is in the first screen`,
    ).toBeLessThanOrEqual(812);
  }
  await expect(hero.getByRole('link', { name: /See the work/ })).toHaveAttribute('href', '#work');
});

// WO-028: on a laptop the first screen shows the work. At 1440 x 900 the Work title is in the first
// viewport; at 1366 x 768 the name, headline and hero links still are.
test('hero shows the work above the fold', async ({ page, isMobile }) => {
  test.skip(isMobile, 'laptop layout');
  const inView = async (sel: string, height: number) => {
    const el = page.locator(sel);
    await expect(el).toBeVisible();
    const box = (await el.boundingBox())!;
    expect(box.y, `${sel} top`).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, `${sel} is in the first ${height}px`).toBeLessThanOrEqual(height);
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await inView('#work-h', 900);

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  for (const sel of ['#hero .hero-name', '#hero .hero-headline', '#hero .hero-links']) {
    await inView(sel, 768);
  }
});

test('contact links are honest', async ({ page }) => {
  for (const route of ['/', '/projects/billable/']) {
    await page.goto(route);
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('a')]
        .filter((a) => a.textContent?.includes('↗'))
        .map((a) => a.getAttribute('href') ?? '')
        .filter((href) => !/^https?:/.test(href)),
    );
    expect(bad, `${route}: arrows on links that aren't external`).toEqual([]);
    for (const l of profile.links) {
      for (const where of ['#contact', ...(route === '/' ? ['#hero'] : [])]) {
        const links = page.locator(where).getByRole('link', { name: l.label, exact: true });
        if (isReal(l.href)) {
          if (where === '#contact') await expect(links).toHaveAttribute('href', l.href);
        } else {
          await expect(links, `${l.label} in ${where} is not a link yet`).toHaveCount(0);
        }
      }
      if (!isReal(l.href))
        await expect(page.locator('#contact .ft-soon', { hasText: l.label })).toBeVisible();
    }
    // WO-026: the hero has no placeholder contact item: a contact that isn't real yet is in the
    // footer only, and every item in the hero's link row is a working link.
    if (route === '/') {
      const row = page.locator('#hero .hero-links');
      await expect(row.locator(':scope > :not(a[href])')).toHaveCount(0);
      await expect(row).not.toContainText(/to come/i);
      for (const l of profile.links.filter((x) => !isReal(x.href)))
        await expect(row).not.toContainText(l.label);
    }
    if (profile.status === 'placeholder')
      await expect(page.locator('#contact .ln-ph')).toHaveText('Some links to come');
  }
});

// A PDF string, literal "(…)" or hex "<…>" (UTF-16BE when it starts with a byte-order mark).
const pdfText = (s: string) => {
  if (s.startsWith('<')) {
    const hex = Buffer.from(s.slice(1, -1), 'hex');
    if (hex[0] === 0xfe && hex[1] === 0xff) return hex.subarray(2).swap16().toString('utf16le');
    return hex.toString('latin1');
  }
  return s.slice(1, -1).replace(/\\([()\\])/g, '$1');
};
const pdfValues = (pdf: string, key: string) =>
  [...pdf.matchAll(new RegExp(`/${key}\\s*(\\((?:\\\\.|[^\\\\)])*\\)|<[0-9A-Fa-f]*>)`, 'g'))].map(
    (m) => pdfText(m[1]),
  );

test('resume pdf', async ({ page, request }) => {
  const res = await request.get('/resume.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  const body = await res.body();
  expect(body.subarray(0, 5).toString()).toBe('%PDF-');
  // WO-026: two pages, tagged (structure and a marked-content flag), and titled.
  const pdf = body.toString('latin1');
  expect(pdf.match(/\/Type\s*\/Page\b(?!s)/g) ?? [], 'pages').toHaveLength(2);
  expect(pdf).toMatch(/\/Marked\s+true/);
  expect(pdf).toContain('/StructTreeRoot');
  expect(pdfValues(pdf, 'Title')).toContain('Nakul Iyer, Résumé');
  // WO-030: the tag tree starts with H1 (the name), so "Résumé" is an H2 under it. A depth-first
  // walk from the StructTreeRoot over the structure elements' /K references.
  const objects = new Map(
    [...pdf.matchAll(/(?:^|\n)(\d+) 0 obj\s*([\s\S]*?)\nendobj/g)].map((m) => [m[1], m[2]]),
  );
  const headings: string[] = [];
  const walk = (id: string, depth = 0) => {
    const obj = objects.get(id) ?? '';
    const tag = /\/S\s*\/(H[1-6])\b/.exec(obj)?.[1];
    if (tag) headings.push(tag);
    const kids = /\/K\s*(\[[^\]]*\]|\d+ 0 R)/.exec(obj)?.[1] ?? '';
    if (depth < 100) for (const [, kid] of kids.matchAll(/(\d+) 0 R/g)) walk(kid, depth + 1);
  };
  walk(/\/StructTreeRoot\s+(\d+) 0 R/.exec(pdf)?.[1] ?? '');
  expect(headings[0], 'first heading tag').toBe('H1');
  expect(
    headings.filter((h) => h === 'H1'),
    'one H1',
  ).toHaveLength(1);
  expect(headings[1], 'then "Résumé"').toBe('H2');

  await page.goto('/');
  const link = page.locator('#resume').getByRole('link', { name: 'Download résumé (PDF)' });
  await expect(link).toHaveAttribute('href', '/resume.pdf');
  await expect(link).toHaveAttribute('download', 'Nakul-Iyer-Resume.pdf');
  await expect(page.locator('#resume').getByRole('button', { name: 'Print résumé' })).toBeVisible();
  // The actions have their own row: Download and Print side by side, the placeholder chip not
  // between them.
  const [dl, pr] = await Promise.all(
    [link, page.locator('#resume [data-print]')].map((l) => l.boundingBox()),
  );
  expect(Math.abs(dl!.y + dl!.height / 2 - (pr!.y + pr!.height / 2))).toBeLessThanOrEqual(2);
  await expect(page.locator('#resume .cv-actions .ln-ph')).toHaveCount(0);

  // The committed PDF matches the content it was made from.
  execFileSync('node', ['factory/stations/resume-pdf.mjs', '--check'], { stdio: 'pipe' });
});

test('reflow at 320', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'one narrow pass');
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  expect(await overflow(), 'scrolls sideways at 320').toBeLessThanOrEqual(0);
  // WCAG 1.4.12 text spacing.
  await page.addStyleTag({
    content:
      '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }',
  });
  expect(await overflow(), 'scrolls sideways at 320 with text spacing').toBeLessThanOrEqual(0);
  // And with every demo open and hydrated.
  const tries = page.getByRole('button', { name: /^Try the demo/ });
  for (let n = await tries.count(); n > 0; n--) {
    await tries.first().click();
    await expect(tries).toHaveCount(n - 1);
  }
  for (const island of await page.locator('#work astro-island').all()) {
    await island.locator('xpath=..').scrollIntoViewIfNeeded();
    await expect(island).not.toHaveAttribute('ssr');
  }
  expect(await overflow(), 'scrolls sideways at 320 with the demos open').toBeLessThanOrEqual(0);
});

for (const route of routes) {
  test.describe(`route ${route}`, () => {
    test('renders without console errors or horizontal overflow', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'page scrolls horizontally').toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });

    for (const scheme of ['light', 'dark'] as const) {
      test(`axe: no serious/critical violations (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(route);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const blocking = results.violations.filter((v) =>
          ['serious', 'critical'].includes(v.impact ?? ''),
        );
        expect(
          blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) → ${v.nodes[0]?.target}`),
        ).toEqual([]);
      });

      test(`screenshot (${scheme})`, async ({ page }, info) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(route);
        const dir = `factory/out/shots/${info.project.name}`;
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: `${dir}/${slug(route)}-${scheme}.png`, fullPage: true });
      });
    }

    test('keyboard: skip link is first tab stop and focus is visible', async ({
      page,
      isMobile,
    }) => {
      test.skip(!!isMobile, 'keyboard pass runs on desktop');
      await page.goto(route);
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toHaveText(/skip to content/i);
      const outline = await focused.evaluate((el) => getComputedStyle(el).outlineStyle);
      expect(outline).not.toBe('none');
    });

    test('reduced motion: no running animations longer than 0.01s', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      const long = await page.evaluate(
        () =>
          document.getAnimations().filter((a) => {
            const d = a.effect?.getComputedTiming().duration;
            return typeof d === 'number' && d > 10;
          }).length,
      );
      expect(long).toBe(0);
    });

    test('calm motion: no looping animations', async ({ page }) => {
      await page.goto(route);
      const looping = await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations === Infinity).length,
      );
      expect(looping).toBe(0);
    });
  });
}
