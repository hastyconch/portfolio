import { test, expect } from '@playwright/test';
import { routes } from './routes';

// WO-014 / constitution art. 12: the record theme lives on the hero cover and in Music only.
// Everywhere else (and in the page title) the site uses plain language.
// "Liner Notes" (capitalised) is the name of the design direction, which the portfolio case
// study is allowed to mention; the lowercase phrase as a label is not.
const RECORD =
  /\b(side [ab]|tracklist|now playing|thanks for listening|bonus tracks?|producer[’']s notes|next track|previous track|in the studio)\b|℗|33⅓/i;
const LINER = /\bliner notes\b/;

const plainRoutes = routes.filter((r) => !r.startsWith('/music/') && !r.startsWith('/demos/'));

for (const route of plainRoutes) {
  test(`plain language outside Music: ${route}`, async ({ page }) => {
    await page.goto(route);
    const text = await page.evaluate(() => {
      const body = document.body.cloneNode(true) as HTMLElement;
      body.querySelectorAll('#music, script, style, template').forEach((el) => el.remove());
      return `${document.title}\n${body.textContent ?? ''}`;
    });
    const hit = text.match(RECORD)?.[0] ?? text.match(LINER)?.[0] ?? null;
    expect(hit, 'record vocabulary outside Music').toBeNull();
  });
}

test('nav links are plain section names', async ({ page, isMobile }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Sections' });
  if (isMobile) await nav.getByText('Menu').click();
  for (const name of ['Work', 'Projects', 'Music', 'Résumé', 'Contact']) {
    await expect(nav.getByRole('link', { name, exact: true }).first()).toBeVisible();
  }
});

// WO-023: the sticky header is solid. Nothing scrolling under it reads through.
test('header is solid', async ({ page }) => {
  for (const scheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const route of ['/', '/projects/billable/']) {
      await page.goto(route);
      const s = await page.locator('header.np').evaluate((el) => {
        const cs = getComputedStyle(el) as CSSStyleDeclaration & {
          webkitBackdropFilter?: string;
        };
        return {
          bg: cs.backgroundColor,
          filter: cs.backdropFilter,
          webkit: cs.webkitBackdropFilter ?? 'none',
        };
      });
      const alpha = s.bg.match(/^rgba?\(([^)]+)\)$/)?.[1].split(/[\s,/]+/)[3];
      expect(alpha === undefined || Number(alpha) === 1, `${scheme} ${route}: ${s.bg}`).toBe(true);
      expect(s.bg).not.toBe('transparent');
      expect(s.filter, `${scheme} ${route}`).toBe('none');
      expect(s.webkit || 'none', `${scheme} ${route}`).toBe('none');
    }
  }
});

// WO-029: a song page is dark in both schemes, and its header takes the same band, so there is no
// cream strip over it in light mode. The name and the progress bar still show against it.
test('song header matches the band', async ({ page }) => {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/music/roadhouse/');
    const c = await page.evaluate(() => {
      const css = (sel: string) => getComputedStyle(document.querySelector(sel)!);
      return {
        header: css('header.np').backgroundColor,
        band: css('article.sg').backgroundColor,
        bar: css('.np-progress span').backgroundColor,
        ink: css('.np-brand').color,
        height: Math.round(document.querySelector('header.np')!.getBoundingClientRect().height),
      };
    });
    expect(c.header, `${scheme}: header against the band`).toBe(c.band);
    expect(c.bar, scheme).not.toBe(c.header);
    expect(c.ink, scheme).not.toBe(c.header);
    expect(c.height, `${scheme}: header height`).toBeLessThanOrEqual(61);
  }
});

// WO-021 (taste-skill): nothing fades in because the page scrolled. Scroll-linked animations are
// allowed only for the reading-progress bar in the header.
for (const route of ['/', '/projects/billable/', '/music/roadhouse/']) {
  test(`no scroll fade-ins: ${route}`, async ({ page }) => {
    await page.goto(route);
    const scrollLinked = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((el) => {
          const s = getComputedStyle(el) as CSSStyleDeclaration & { animationTimeline?: string };
          const tl = s.animationTimeline ?? 'auto';
          return tl !== 'auto' && tl !== '' && !el.closest('.np-progress');
        })
        .map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
    );
    expect(scrollLinked).toEqual([]);
    expect(await page.locator('.reveal').count()).toBe(0);
  });
}
