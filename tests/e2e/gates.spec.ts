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
  const email = profile.links.find((l) => l.label === 'Email')!;
  const items = [
    hero.getByRole('heading', { level: 1 }),
    hero.locator('.hero-headline'),
    hero.getByRole('link', { name: 'Résumé' }),
    isReal(email.href)
      ? hero.getByRole('link', { name: 'Email' })
      : hero.locator('.hero-links .hero-soon', { hasText: 'Email' }),
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
    if (profile.status === 'placeholder')
      await expect(page.locator('#contact .ln-ph')).toHaveText('Some links to come');
  }
});

test('resume pdf', async ({ page, request }) => {
  const res = await request.get('/resume.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');

  await page.goto('/');
  const link = page.locator('#resume').getByRole('link', { name: 'Download PDF' });
  await expect(link).toHaveAttribute('href', '/resume.pdf');
  await expect(link).toHaveAttribute('download', '');
  await expect(page.locator('#resume').getByRole('button', { name: 'Print résumé' })).toBeVisible();

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
