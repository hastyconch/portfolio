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

  const trigger = crumbs(page).getByRole('button', { name: 'Billable., switch project' });
  await expect(crumbs(page).locator('[aria-current="location"]')).toHaveText('Billable.');
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

// WO-027: the crumb's trigger says what it does, the current place is marked on its text (not on
// a button), and the jump list closes once focus moves on past it.
test('crumb trigger names its action', async ({ page, isMobile }) => {
  if (!isMobile) {
    await page.goto('/');
    await scrollTo(page, '#work .wk', 0);
    await expect(
      crumbs(page).getByRole('button', { name: /switch engagement$/ }),
    ).toHaveAccessibleName('Airline loyalty, switch engagement');
    await scrollTo(page, '#work .wk', 1);
    await expect(
      crumbs(page).getByRole('button', { name: /switch engagement$/ }),
    ).toHaveAccessibleName('Grocer loyalty, switch engagement');
    await expect(page.locator('.np button[aria-current]')).toHaveCount(0);
  }

  await page.goto('/projects/felt-and-tiles/');
  const trigger = crumbs(page).getByRole('button', { name: 'Felt & Tiles, switch project' });
  await expect(trigger).toBeVisible();
  await expect(page.locator('.np button[aria-current]')).toHaveCount(0);
  const here = crumbs(page).locator('[aria-current="location"]');
  await expect(here).toHaveText('Felt & Tiles');
  expect(await here.evaluate((el) => el.closest('button'))).toBeNull();

  // Tab past the last entry: the list closes.
  const jump = page.locator('#np-jump');
  const entry = jump.locator('a[aria-current="page"]');
  await press(page, trigger);
  await expect(entry).toBeFocused();
  await page.keyboard.press('End');
  await expect(jump.getByRole('link').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(jump).toBeHidden();
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);

  // Shift+Tab out of it, too.
  await press(page, trigger);
  await expect(entry).toBeFocused();
  await page.keyboard.press('Home');
  await expect(jump.getByRole('link').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(jump).toBeHidden();
});

// WO-027: on a phone the case-study crumb reads "Projects / Felt & Tiles 2 / 8": no stray "/"
// after the folded name, and a count that says the item is one of several.
test('phone crumb', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the folded crumb is for phones');
  await page.goto('/');
  const projects = await page.locator('#rail > li').count();
  await page.goto('/projects/felt-and-tiles/');
  // What shows after the disc, in order.
  const shown = await crumbs(page).evaluate((nav) =>
    [...nav.querySelectorAll<HTMLElement>('.np-sep, .np-sec, .np-item, .np-count')]
      .filter((el) => el.checkVisibility())
      .map((el) => el.textContent!.trim()),
  );
  expect(shown).toEqual(['Projects', '/', 'Felt & Tiles', `2 / ${projects}`]);
  await expect(crumbs(page).locator('.np-count')).toBeVisible();
  await expect(crumbs(page).locator('.np-arrow').first()).toBeHidden();
  const bar = await page.locator('.np-bar').boundingBox();
  expect(bar!.height).toBeLessThanOrEqual(61);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

// WO-027: the header's in-page links replace the history entry, so Back leaves the page.
// WO-033: one history model for every in-page link to a section, the hero's included.
test("in-page links don't pile up history", async ({ page, isMobile }) => {
  await page.goto('/');
  const before = await page.evaluate(() => history.length);
  for (const id of ['resume', 'work']) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.locator(`#hero a[href="#${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
  for (const id of ['work', 'projects', 'music', 'resume', 'contact']) {
    if (isMobile) {
      await page.locator('.np-menu summary').click();
      await page.locator(`.np-menu-list a[href="#${id}"]`).click();
    } else {
      await page.locator(`.np-links a[href="#${id}"]`).click();
    }
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
  }
  expect(await page.evaluate(() => history.length)).toBe(before);
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

// WO-023: a jump to a section lands its top flush under the header (the root's scroll padding
// and the section's own margin no longer add up).
test('sections land under the header', async ({ page, isMobile }) => {
  await page.goto('/');
  // Walk the page once first, so the demo islands (client:visible) have hydrated: a demo that
  // grows as it hydrates while a smooth jump passes it moves the target.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(50);
  }
  await page.waitForLoadState('networkidle');
  for (const id of ['work', 'projects', 'music', 'resume']) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    if (isMobile) {
      await page.locator('.np-menu summary').click();
      await page.locator(`.np-menu-list a[href="#${id}"]`).click();
    } else {
      await page.locator(`.np-links a[href="#${id}"]`).click();
    }
    const gap = () =>
      page.evaluate((id) => {
        const header = document.querySelector('.np')!.getBoundingClientRect().bottom;
        return Math.round(document.getElementById(id)!.getBoundingClientRect().top - header);
      }, id);
    await expect.poll(gap, { message: `#${id} lands under the header` }).toBeLessThanOrEqual(2);
    // and stays there once the smooth scroll has settled
    await page.waitForTimeout(300);
    expect(Math.abs(await gap()), `#${id}`).toBeLessThanOrEqual(2);
  }
});

// WO-023: the header holds still. Clicking or focusing anything in it never scrolls the page.
test('header never scrolls the page', async ({ page }) => {
  await page.goto('/projects/billable/');
  const y = () => page.evaluate(() => Math.round(scrollY));
  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }));
  expect(await y()).toBe(2000);

  // Playwright's own click: it scrolls the target into view if the browser thinks it needs to.
  const trigger = crumbs(page).getByRole('button', { name: 'Billable.' });
  await trigger.click();
  await expect(page.locator('#np-jump')).toBeVisible();
  await page.waitForTimeout(300);
  expect(await y()).toBe(2000);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.waitForTimeout(300);
  expect(await y()).toBe(2000);

  // Shift+Tab from the page's content back into the header.
  await page.evaluate(() =>
    document.querySelector<HTMLElement>('main a[href]')!.focus({ preventScroll: true }),
  );
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(300);
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('.np')),
      'focus is in the header',
    ).toBe(true);
    expect(await y(), `Shift+Tab ${i + 1}`).toBe(2000);
  }
});

// WO-023: a control that reaches the end of its list stays focusable (aria-disabled), so focus
// never falls to <body>.
test('focus survives end of list', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'the rail arrows and the stepper are for laptops');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const onBody = () => page.evaluate(() => document.activeElement === document.body);

  // Projects rail: Enter on "Scroll projects forward" until the end.
  await scrollTo(page, '#projects');
  const fwd = page.getByRole('button', { name: 'Scroll projects forward' });
  await fwd.focus();
  for (let i = 0; i < 12 && (await fwd.getAttribute('aria-disabled')) !== 'true'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    expect(await onBody()).toBe(false);
  }
  await expect(fwd).toHaveAttribute('aria-disabled', 'true');
  await expect(fwd).toBeFocused();
  const left = await page.locator('#rail').evaluate((r) => r.scrollLeft);
  await page.keyboard.press('Enter'); // ignored at the end
  await expect(fwd).toBeFocused();
  expect(await page.locator('#rail').evaluate((r) => r.scrollLeft)).toBe(left);

  // Home stepper: step to the end of the list.
  await scrollTo(page, '#work .wk', 3);
  const next = page.locator('button.np-next');
  await expect(next).toHaveAccessibleName('Next: More client work');
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#work-more-h')).toBeFocused();
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(next).toBeDisabled();
  // The end step is still a control you can reach; it does nothing.
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(next).toBeFocused();

  // Scrolling out of Work while the stepper holds focus keeps it shown until focus moves on.
  await scrollTo(page, '#projects');
  await expect(section(page).getByRole('link')).toHaveText('Projects');
  await expect(item(page)).toBeVisible();
  await expect(next).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await onBody()).toBe(false);
  await expect(item(page)).toBeHidden();
});

// WO-033: nor over a page that scrolls under it.
test('phone menu closes on scroll', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'the menu is for phones');
  await page.goto('/');
  const menu = page.locator('.np-menu');
  const toggle = menu.locator('summary');
  const open = () => menu.evaluate((d: HTMLDetailsElement) => d.open);
  // Back to the top, and at rest (the menu measures a scroll from where the page settles).
  const top = async () => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
  };

  // A page scroll of 200px closes it.
  await toggle.tap();
  await page.waitForTimeout(100);
  expect(await open(), 'opening it does not close it').toBe(true);
  await page.evaluate(() => scrollBy({ top: 200, behavior: 'instant' }));
  await expect.poll(open).toBe(false);

  // So does a swipe on the page, the way a finger scrolls it.
  await top();
  await toggle.tap();
  expect(await open()).toBe(true);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.synthesizeScrollGesture', {
    x: 187,
    y: 700,
    yDistance: -400,
    speed: 800,
    gestureSourceType: 'touch',
  });
  await expect.poll(open).toBe(false);

  // Focus inside the menu goes back to its toggle.
  await top();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(menu.locator('.np-menu-list a').first()).toBeFocused();
  await page.evaluate(() => scrollBy({ top: 200, behavior: 'instant' }));
  await expect.poll(open).toBe(false);
  await expect(toggle).toBeFocused();
});

// WO-023: the phone menu never stays open over the page.
test('phone menu closes on focus out', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the menu is for phones');
  await page.goto('/');
  const menu = page.locator('.np-menu');
  const toggle = menu.locator('summary');
  const open = () => menu.evaluate((d: HTMLDetailsElement) => d.open);

  // Tabbing past the last item closes it.
  await toggle.focus();
  await page.keyboard.press('Enter');
  expect(await open()).toBe(true);
  const items = await menu.locator('.np-menu-list a').count();
  for (let i = 0; i < items; i++) await page.keyboard.press('Tab');
  await expect(menu.locator('.np-menu-list a').last()).toBeFocused();
  expect(await open()).toBe(true);
  await page.keyboard.press('Tab');
  expect(await open()).toBe(false);

  // Escape from inside closes it and returns focus to the toggle.
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  expect(await open()).toBe(false);
  await expect(toggle).toBeFocused();

  // Escape works from anywhere while it is open, too.
  await page.keyboard.press('Enter');
  expect(await open()).toBe(true);
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await page.keyboard.press('Escape');
  expect(await open()).toBe(false);
  await expect(toggle).toBeFocused();
});

// WO-029: a cold deep link jumps to its section instead of scrolling through the page, and the
// crumb names that section by then. Smooth scrolling stays for in-page links after the load.
test('cold deep links jump', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'measured on a phone, where the page is longest');
  await page.addInitScript(() => {
    const w = window as unknown as { __at150?: { y: number; crumb: string } };
    addEventListener('load', () =>
      setTimeout(() => {
        const li = document.querySelector<HTMLElement>('.np-c-sec');
        w.__at150 = {
          y: Math.round(scrollY),
          crumb: li && !li.hidden ? li.querySelector('a')!.textContent!.trim() : '',
        };
      }, 150),
    );
  });
  for (const [id, label] of [
    ['contact', 'Contact'],
    ['projects', 'Projects'],
  ]) {
    await page.goto('about:blank'); // a cold load each time, not a same-page fragment change
    await page.goto(`/#${id}`);
    const at150 = await page
      .waitForFunction(() => (window as unknown as { __at150?: object }).__at150)
      .then((h) => h.jsonValue() as Promise<{ y: number; crumb: string }>);
    // Nothing moves after that.
    await page.waitForTimeout(1500);
    const now = await page.evaluate(() => ({
      y: Math.round(scrollY),
      max: document.documentElement.scrollHeight - innerHeight,
      gap: Math.round(
        document.getElementById(location.hash.slice(1))!.getBoundingClientRect().top -
          document.querySelector('.np')!.getBoundingClientRect().bottom,
      ),
      smooth: getComputedStyle(document.documentElement).scrollBehavior,
    }));
    expect(Math.abs(at150.y - now.y), `#${id}: in place 150ms after load`).toBeLessThanOrEqual(1);
    expect(at150.crumb, `#${id}: the crumb by then`).toBe(label);
    // The final place: Contact at the bottom of the page, Projects flush under the header.
    if (id === 'contact') expect(Math.abs(now.max - now.y)).toBeLessThanOrEqual(1);
    else expect(Math.abs(now.gap)).toBeLessThanOrEqual(2);
    expect(now.smooth, 'in-page links glide again').toBe('smooth');
  }
});

// WO-029: on the narrowest phones the count gives way, so the project keeps its name.
test('crumb keeps its name at 320', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the folded crumb is for phones');
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/projects/travel-planner/');
  const name = crumbs(page).locator('.np-item');
  await expect(name).toBeVisible();
  expect((await name.boundingBox())!.width, 'the project name').toBeGreaterThanOrEqual(40);
  const bar = await page.locator('.np-bar').boundingBox();
  expect(bar!.height).toBeLessThanOrEqual(61);
  // WO-033: and under WCAG 1.4.12 text spacing, on both narrow-crumb case studies.
  for (const slug of ['travel-planner', 'billable']) {
    await page.goto(`/projects/${slug}/`);
    await page.addStyleTag({
      content:
        '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important } p { margin-bottom: 2em !important }',
    });
    await expect(name).toBeVisible();
    expect((await name.boundingBox())!.width, `${slug}: the name, spaced`).toBeGreaterThanOrEqual(
      40,
    );
    expect((await page.locator('.np-bar').boundingBox())!.height).toBeLessThanOrEqual(61);
  }
  // From 360px up, the count is back.
  await page.setViewportSize({ width: 360, height: 640 });
  await expect(crumbs(page).locator('.np-count')).toBeVisible();
});
