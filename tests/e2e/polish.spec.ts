import { test, expect, type Page } from '@playwright/test';

// WO-027: small alignments and polish. One section-header pattern for Work and Projects, flush
// footer rows, a pager rule that spans the content column, and a real way out of the 404.

const left = (page: Page, sel: string) =>
  page
    .locator(sel)
    .first()
    .evaluate((el) => el.getBoundingClientRect().left);

test('section headers share one pattern', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'phones stack the title over the lead');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const work = { title: await left(page, '#work-h'), lead: await left(page, '#work .sh-lead') };
  const proj = {
    title: await left(page, '#projects-h'),
    lead: await left(page, '#projects .sh-lead'),
  };
  // Two columns: the lead starts to the right of the title column.
  const titleRight = await page
    .locator('#projects-h')
    .evaluate((el) => el.getBoundingClientRect().right);
  expect(proj.lead).toBeGreaterThan(titleRight);
  expect(Math.abs(proj.title - work.title)).toBeLessThanOrEqual(2);
  expect(Math.abs(proj.lead - work.lead)).toBeLessThanOrEqual(2);
  // The rail arrows sit with the lead, on its row, not over the title column.
  const btns = await page.locator('#projects .rail-btns').boundingBox();
  const lead = await page.locator('#projects .sh-lead').boundingBox();
  expect(btns!.x).toBeGreaterThan(lead!.x);
  expect(btns!.y).toBeLessThan(lead!.y + lead!.height);
  expect(btns!.y + btns!.height).toBeGreaterThan(lead!.y);
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

  // Billable, the first project, has only a "Next project" link: its rule spans the content
  // column, from the column's start to its end.
  await page.goto('/projects/billable/');
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
