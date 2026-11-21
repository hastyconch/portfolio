import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { routes } from './routes';

const slug = (r: string) => (r === '/' ? 'home' : r.replace(/^\/|\/$/g, '').replace(/\//g, '__'));

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
  });
}
