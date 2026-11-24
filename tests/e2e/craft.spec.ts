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

// WO-031: the site ring is unchanged outside the demos (the demos' own rings now win inside
// them): 3px solid, 3px out, in the band's accent; the skip link's ring is ink.
test('craft focus ring outside demos', async ({ page, isMobile }) => {
  for (const scheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    const targets = [
      page.locator('.skip-link'),
      page.locator('header.np a').first(),
      page.locator('main a[href]:not(.wk-demo *, .mu-call-a)').first(),
      page.locator('#music .mu-tab, #music button.pl-play').first(),
      page.locator('footer .ft-links a').first(),
    ];
    if (!isMobile)
      targets.push(
        page
          .getByRole('navigation', { name: 'Sections' })
          .getByRole('link', { name: 'Work', exact: true }),
      );
    for (const [i, t] of targets.entries()) {
      if (i > 0) await t.focus();
      const s = await t.evaluate((el) => {
        const probe = document.createElement('span');
        probe.style.color = el.classList.contains('skip-link')
          ? 'var(--ln-ink)'
          : 'var(--ln-accent)';
        el.parentElement!.append(probe);
        const want = getComputedStyle(probe).color;
        probe.remove();
        const cs = getComputedStyle(el);
        return {
          name: `${el.tagName.toLowerCase()}.${el.className}`,
          fv: el.matches(':focus-visible'),
          color: cs.outlineColor,
          want,
          style: cs.outlineStyle,
          width: cs.outlineWidth,
          offset: cs.outlineOffset,
        };
      });
      const at = `${scheme} ${s.name}`;
      expect(s.fv, at).toBe(true);
      expect(s.color, at).toBe(s.want);
      expect(s.style, at).toBe('solid');
      expect(s.width, at).toBe('3px');
      expect(s.offset, at).toBe('3px');
    }
  }
});

// WO-031: --ln-hairline re-resolves in every band, so in light mode the hairlines on the dark
// surfaces (song players and pager, the Music band, the footer, the 404's footer) are the dark
// band's rule, not the cream page's.
test('craft hairlines follow their band', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  const must: Record<string, string[]> = {
    '/music/roadhouse/': ['.sg-pg', '.pl-play', '.ft-links a'],
    '/': ['#music .pl-play', '.ft-links a'],
    '/this-page-does-not-exist/': ['.ft-links a'],
  };
  for (const [route, named] of Object.entries(must)) {
    await page.goto(route);
    const bands = await page.evaluate((named) => {
      return [...document.querySelectorAll<HTMLElement>('.ln-dark')].map((band) => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--ln-rule)';
        band.append(probe);
        const rule = getComputedStyle(probe).color;
        probe.remove();
        const off: string[] = [];
        const lines = new Set<Element>();
        for (const el of [band, ...band.querySelectorAll('*')]) {
          if (el.closest('.ln-dark') !== band) continue;
          const cs = getComputedStyle(el);
          for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
            if (cs[`border${side}Style`] !== 'solid' || cs[`border${side}Width`] !== '1px')
              continue;
            lines.add(el);
            const c = cs[`border${side}Color`];
            if (c !== rule) off.push(`${el.tagName.toLowerCase()}.${el.className} ${side}: ${c}`);
          }
        }
        const found = named.filter((sel) =>
          [...band.querySelectorAll(sel)].some((el) => lines.has(el)),
        );
        return { band: band.className, rule, off, found };
      });
    }, named);
    expect(bands.length, route).toBeGreaterThan(0);
    for (const b of bands) {
      expect(b.rule, `${route} ${b.band}: the dark band's rule`).toBe('rgb(59, 52, 46)');
      expect(b.off, `${route} ${b.band}`).toEqual([]);
    }
    const found = new Set(bands.flatMap((b) => b.found));
    for (const sel of named) expect(found.has(sel), `${route}: a hairline on ${sel}`).toBe(true);
  }
  // The cream page keeps its own rule.
  await page.goto('/');
  const cream = await page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue('--ln-hairline').trim(),
  );
  expect(cream).toBe('1px solid #c9bba5');
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
