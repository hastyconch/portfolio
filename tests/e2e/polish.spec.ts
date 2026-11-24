import { test, expect, type Page } from '@playwright/test';

// WO-027: small alignments and polish. Flush footer rows, a pager rule that spans the content
// column, and a real way out of the 404. WO-033: the section headers vary in layout.

const left = (page: Page, sel: string) =>
  page
    .locator(sel)
    .first()
    .evaluate((el) => el.getBoundingClientRect().left);

// WO-033: three identical headers in a row read as a template. Work keeps its two columns;
// Projects and Music stack the lead under the title. Every title stays the same size.
test('section headers vary', async ({ page, isMobile }) => {
  await page.goto('/');
  const head = (title: string, lead: string) =>
    page.evaluate(
      ([t, l]) => {
        const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const h = box(t);
        const p = box(l);
        return {
          size: getComputedStyle(document.querySelector(t)!).fontSize,
          title: { left: h.left, right: h.right, bottom: h.bottom },
          lead: { left: p.left, top: p.top },
        };
      },
      [title, lead] as const,
    );
  const work = await head('#work-h', '#work .sh-lead');
  const projects = await head('#projects-h', '#projects .sh-lead');
  const music = await head('#music-h', '#music .mu-story-lead');

  for (const [name, h] of [
    ['Projects', projects],
    ['Music', music],
  ] as const) {
    expect(h.lead.top, `${name}: the lead sits under the title`).toBeGreaterThanOrEqual(
      h.title.bottom - 1,
    );
    expect(Math.abs(h.lead.left - h.title.left), `${name}: one column`).toBeLessThanOrEqual(1);
    expect(h.size, `${name}: the same title size as Work`).toBe(work.size);
  }
  if (isMobile) return;

  // Laptops: Work's lead sits beside its title, on the same line.
  expect(work.lead.left, 'Work: the lead beside the title').toBeGreaterThan(work.title.right);
  expect(work.lead.top).toBeLessThan(work.title.bottom);
  // The rail arrows sit at the right of the Projects header, level with it.
  const btns = (await page.locator('#projects .rail-btns').boundingBox())!;
  const header = (await page.locator('#projects .sh').boundingBox())!;
  expect(btns.x + btns.width).toBeGreaterThan(header.x + header.width - 2);
  expect(btns.y).toBeGreaterThanOrEqual(header.y);
  expect(btns.y + btns.height).toBeLessThanOrEqual(header.y + header.height + 1);
});

test('alignments', async ({ page, isMobile }) => {
  await page.goto('/');
  const rule = await left(page, '.ft-links');
  const labels = await page
    .locator('.ft-label')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left));
  expect(labels.length).toBeGreaterThan(0);
  for (const x of labels)
    expect(Math.abs(x - rule), 'label is flush with its hairline').toBeLessThanOrEqual(1);
  // One column on phones: the labels start where "Get in touch" does. (On laptops the links
  // are the second column, flush with their own rules.)
  if (isMobile) {
    const title = await left(page, '#contact-h');
    for (const x of labels)
      expect(Math.abs(x - title), 'label is flush with the title').toBeLessThanOrEqual(1);
  }

  // The first project (Potluck Picker since WO-039) has only a "Next project" link: its rule
  // spans the content column, from the column's start to its end.
  await page.goto('/projects/potluck-picker/');
  const main = (await page.locator('.cs-main').boundingBox())!;
  const pager = page.locator('.cs-pager .cs-pg');
  await expect(pager).toHaveCount(1);
  await expect(pager).toContainText('Next project');
  const pg = (await pager.boundingBox())!;
  expect(Math.abs(pg.x - main.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(pg.x + pg.width - (main.x + main.width))).toBeLessThanOrEqual(1);
  expect(await pager.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('1px');
});

// WO-029: the case-study gallery skips rendering until it nears the view (content-visibility),
// which drops its heading from Chromium's accessibility tree. The region keeps its name anyway.
test('case-study gallery is named', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'checked at 375, where the gallery starts far below the fold');
  const cdp = await context.newCDPSession(page);
  for (const slug of ['travel-planner', 'portfolio', 'billable']) {
    await page.goto(`/projects/${slug}/`);
    const title = (await page.locator('#gallery-h').textContent())!.trim();
    const below = await page
      .locator('#gallery')
      .evaluate((s) => s.getBoundingClientRect().top > innerHeight * 2);
    expect(below, `${slug}: the gallery is off-screen`).toBe(true);
    await cdp.send('Accessibility.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const regions = nodes
      .filter((n) => !n.ignored && n.role?.value === 'region')
      .map((n) => String(n.name?.value ?? ''));
    expect(regions, `${slug}: named regions`).toContain(title);
    expect(
      regions.filter((n) => !n.trim()),
      `${slug}: unnamed regions`,
    ).toEqual([]);
    // WO-033: so does the screens list inside it (a focusable scroller, named like its region).
    const lists = nodes
      .filter((n) => !n.ignored && n.role?.value === 'list')
      .map((n) => String(n.name?.value ?? ''));
    expect(lists, `${slug}: the gallery list`).toContain(title);
    await cdp.send('Accessibility.disable');
  }
});

test('404 way out', async ({ page }) => {
  await page.goto('/this-page-does-not-exist/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  const home = page.getByRole('main').getByRole('link', { name: 'Go to the home page' });
  await expect(home).toHaveAttribute('href', '/');
  const box = (await home.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  const projects = page.getByRole('main').getByRole('link', { name: 'Projects', exact: true });
  await expect(projects).toHaveAttribute('href', '/#projects');
  expect((await projects.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await projects.click();
  await expect(page).toHaveURL(/\/#projects$/);
});
