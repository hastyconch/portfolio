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
