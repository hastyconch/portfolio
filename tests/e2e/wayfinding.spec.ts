import { test, expect, type Locator, type Page } from '@playwright/test';
import { routes } from './routes';

// WO-019: the header says where you are (a breadcrumb and the marked nav link), a stepper and a
// jump list move between siblings, a case study's "On this page" marks the section in view, and
// page changes use cross-document view transitions (CSS only, never under reduced motion).

const crumbs = (page: Page) => page.getByRole('navigation', { name: 'Breadcrumb' });
const section = (page: Page) => crumbs(page).locator('.np-c-sec');
const item = (page: Page) => crumbs(page).locator('.np-c-item');

async function scrollTo(page: Page, selector: string, index = 0) {
  await page.evaluate(
    ([sel, i]) =>
      (document.querySelectorAll(sel)[i as number] as HTMLElement).scrollIntoView({
        behavior: 'instant',
        block: 'start',
      }),
    [selector, index] as const,
  );
}

// Click a control in the sticky header where it is. (Playwright's own click first scrolls the
// element into view, and scrolling a sticky element into view jumps to the top of the page.)
async function press(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  const box = (await target.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test('work crumb follows the pane', async ({ page, isMobile }) => {
  await page.goto('/');
  // The hero shows no crumb and marks no section.
  await expect(section(page)).toBeHidden();
  await expect(page.locator('.np-nav a[aria-current]')).toHaveCount(0);

  await scrollTo(page, '#work');
  await expect(section(page)).toBeVisible();
  await expect(section(page).getByRole('link')).toHaveText('Work');
  await expect(section(page).getByRole('link')).toHaveAttribute('href', '#work');
  const workLinks = page.locator('.np-nav a[aria-current="true"]');
  await expect(workLinks).toHaveCount(2); // the laptop links and the phone menu
  for (const a of await workLinks.all()) await expect(a).toHaveText('Work');

  // Inside a pane: the engagement's short name, as the current location (laptops and tablets).
  await scrollTo(page, '#work .wk', 0);
  if (isMobile) {
    await expect(item(page)).toBeHidden();
    await expect(section(page).getByRole('link')).toHaveText('Work');
  } else {
    const current = crumbs(page).locator('[aria-current="location"]');
    await expect(current).toHaveText('Airline loyalty');
    await scrollTo(page, '#work .wk', 1);
    await expect(current).toHaveText('Grocer loyalty');
    await expect(crumbs(page).locator('.np-count')).toHaveText('2 / 4');
  }

  // Past Work, the crumb and the nav link follow the next section.
  await scrollTo(page, '#projects');
  await expect(section(page).getByRole('link')).toHaveText('Projects');
  await expect(item(page)).toBeHidden();
  await expect(page.locator('.np-links a[aria-current]')).toHaveText('Projects');
});

test('stepper moves between engagements', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'the stepper is for 760px and up');
  await page.goto('/');
  await scrollTo(page, '#work .wk', 0);
  const current = crumbs(page).locator('[aria-current="location"]');
  await expect(current).toHaveText('Airline loyalty');
  await expect(page.getByRole('button', { name: 'Previous engagement' })).toBeDisabled();

  const next = page.getByRole('button', { name: 'Next engagement: Grocer loyalty' });
  await press(page, next);
  await expect(current).toHaveText('Grocer loyalty');
  await expect(page.locator('#work-02-grocer-loyalty')).toBeFocused();
  // The pane settles right under the header.
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.round(
          (document.querySelectorAll('#work .wk')[1] as HTMLElement).getBoundingClientRect().top,
        ),
      ),
    )
    .toBe(60);

  // From the keyboard, too.
  await page.getByRole('button', { name: 'Next engagement: Healthcare scheduling' }).focus();
  await page.keyboard.press('Enter');
  await expect(current).toHaveText('Healthcare scheduling');
  await expect(page.locator('#work-05-healthcare-wfm')).toBeFocused();

  await press(page, page.getByRole('button', { name: 'Previous engagement: Grocer loyalty' }));
  await expect(current).toHaveText('Grocer loyalty');
  await expect(page.locator('#work-02-grocer-loyalty')).toBeFocused();

  // The jump list holds the four engagements, then the rest of the client work.
  await press(page, current);
  const jump = page.locator('#np-jump');
  await expect(jump).toBeVisible();
  await expect(jump.getByRole('link')).toHaveText([
    'Airline loyalty',
    'Grocer loyalty',
    'Healthcare scheduling',
    'AI program management',
    'More client work',
  ]);
  await expect(jump.locator('a[aria-current]')).toHaveText('Grocer loyalty');
  await jump.getByRole('link', { name: 'AI program management' }).click();
  await expect(jump).toBeHidden();
  await expect(current).toHaveText('AI program management');
  await expect(page.locator('#work-07-real-estate-tpm')).toBeFocused();
});

test('project switcher', async ({ page, isMobile }) => {
  await page.goto('/');
  const projects = await page.locator('#rail > li').count();

  await page.goto('/projects/billable/');
  await expect(section(page).getByRole('link')).toHaveText('Projects');
  await expect(section(page).getByRole('link')).toHaveAttribute('href', '/#projects');
  const marked = page.locator(
    isMobile ? '.np-menu-list a[aria-current]' : '.np-links a[aria-current]',
  );
  await expect(marked).toHaveText('Projects');
  if (!isMobile) {
    await expect(page.getByRole('link', { name: 'Next project: Felt & Tiles' })).toBeVisible();
    await expect(crumbs(page).locator('.np-count')).toHaveText(`1 / ${projects}`);
  }

  const trigger = crumbs(page).getByRole('button', { name: 'Billable.' });
  await expect(trigger).toHaveAttribute('aria-current', 'location');
  await press(page, trigger);
  const jump = page.locator('#np-jump');
  await expect(jump).toBeVisible();
  await expect(jump.getByRole('link')).toHaveCount(projects);
  const current = jump.locator('a[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toContainText('Billable.');
  await expect(current).toBeFocused();
  // Every entry shows its cover art and its format.
  await expect(jump.locator('.np-thumb')).toHaveCount(projects);
  await expect(jump.locator('.np-jump-f').first()).toHaveText(/\S/);

  // Escape closes it and focus returns to the trigger.
  await page.keyboard.press('Escape');
  await expect(jump).toBeHidden();
  await expect(trigger).toBeFocused();

  // One step to Felt & Tiles.
  await press(page, trigger);
  await jump.getByRole('link', { name: /Felt & Tiles/ }).click();
  await expect(page).toHaveURL(/\/projects\/felt-and-tiles\/$/);
  await expect(crumbs(page).locator('[aria-current="location"]')).toHaveText('Felt & Tiles');

  // No horizontal overflow, and the header stays one line.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const bar = await page.locator('.np-bar').boundingBox();
  expect(bar!.height).toBeLessThanOrEqual(61);
});

test('toc marks section', async ({ page }) => {
  await page.goto('/projects/felt-and-tiles/');
  const toc = page.getByRole('navigation', { name: 'On this page' });
  const marked = toc.locator('a[aria-current="true"]');
  await scrollTo(page, '#stack');
  await expect(marked).toHaveCount(1);
  await expect(marked).toHaveText('Stack');
  await scrollTo(page, '#problem');
  await expect(marked).toHaveText('Problem');
  await scrollTo(page, '#features');
  await expect(marked).toHaveText('What it does');
});

test('no duplicate transition names', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'names do not depend on the viewport');
  test.setTimeout(120_000);
  for (const route of routes) {
    await page.goto(route);
    const found = await page.evaluate(() => {
      const names = [...document.querySelectorAll('*')]
        .map((el) => getComputedStyle(el).viewTransitionName)
        .filter((n) => n && n !== 'none');
      // Every @view-transition rule sits inside a prefers-reduced-motion: no-preference block.
      const vt: string[] = [];
      const walk = (rules: CSSRuleList, media: string) => {
        for (const r of [...rules]) {
          if (r instanceof CSSMediaRule) walk(r.cssRules, `${media} ${r.conditionText}`);
          else if (r.cssText.startsWith('@view-transition')) vt.push(media);
        }
      };
      for (const s of [...document.styleSheets]) {
        try {
          walk(s.cssRules, '');
        } catch {
          // cross-origin sheets have no readable rules
        }
      }
      return { names, vt };
    });
    expect(new Set(found.names).size, `${route}: ${found.names.join(', ')}`).toBe(
      found.names.length,
    );
    if (!route.startsWith('/demos/')) {
      expect(found.names, route).toContain('site-header');
      expect(found.vt.length, `${route} has @view-transition`).toBeGreaterThan(0);
    }
    for (const m of found.vt) expect(m, route).toMatch(/prefers-reduced-motion:\s*no-preference/);
  }
});
