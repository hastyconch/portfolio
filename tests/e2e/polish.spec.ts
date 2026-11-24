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

// WO-038: the résumé redesign. It lands like the other sections, uses colour with contrast, and
// its two columns end together.

/** Walks the page once, so the demo islands have hydrated and no longer move the target. */
const hydrate = async (page: Page) => {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(40);
  }
  await page.waitForLoadState('networkidle');
};
/** Clicks the header link to a section; returns its title's top once the scroll has settled. */
const landing = async (page: Page, isMobile: boolean, id: string) => {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  if (isMobile) {
    await page.locator('.np-menu summary').click();
    await page.locator(`.np-menu-list a[href="#${id}"]`).click();
  } else {
    await page.locator(`.np-links a[href="#${id}"]`).click();
  }
  const top = () =>
    page.evaluate(
      (id) => Math.round(document.getElementById(`${id}-h`)!.getBoundingClientRect().top),
      id,
    );
  let last = Number.NaN;
  await expect
    .poll(
      async () => {
        const now = await top();
        const settled = now === last;
        last = now;
        return settled;
      },
      { intervals: [300], timeout: 8000 },
    )
    .toBe(true);
  return last;
};

test('résumé lands like the other sections', async ({ page, isMobile }) => {
  await page.goto('/');
  await hydrate(page);
  const resume = await landing(page, isMobile, 'resume');
  if (isMobile) {
    const work = await landing(page, isMobile, 'work');
    expect(Math.abs(resume - work), `résumé ${resume}, work ${work}`).toBeLessThanOrEqual(2);
  } else {
    expect(Math.abs(resume - 108), `résumé title top ${resume}`).toBeLessThanOrEqual(2);
  }
});

test('résumé has colour with contrast', async ({ page }) => {
  await page.goto('/');
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    // Let the colour transitions (150ms) finish, so the resting state is measured.
    await page.waitForTimeout(400);
    const found = await page.locator('#resume').evaluate((section) => {
      // Any CSS colour (color-mix included) to sRGB, through a canvas.
      const ctx = document.createElement('canvas').getContext('2d', {
        willReadFrequently: true,
      })!;
      const rgba = (c: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#000';
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      };
      const lum = (c: string) => {
        const f = (v: number) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        const { r, g, b } = rgba(c);
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const ratio = (a: string, b: string) => {
        const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
        return (x + 0.05) / (y + 0.05);
      };
      const bgOf = (start: Element) => {
        for (let el: Element | null = start; el; el = el.parentElement) {
          const bg = getComputedStyle(el).backgroundColor;
          if (rgba(bg).a > 0.5) return bg;
        }
        return getComputedStyle(document.body).backgroundColor;
      };
      const key = (c: string) => {
        const { r, g, b } = rgba(c);
        return `${r},${g},${b}`;
      };
      const body = getComputedStyle(document.body);
      const plain = new Set([key(body.color), key(body.backgroundColor)]);
      const accent = key(body.getPropertyValue('--ln-accent'));
      const texts: { text: string; ratio: number }[] = [];
      const roles = new Set<string>();
      for (const el of section.querySelectorAll('*')) {
        if (!el.getClientRects().length) continue;
        const cs = getComputedStyle(el);
        const bg = bgOf(el);
        // Every visible run of text, its colour on its own background.
        const own = [...el.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim(),
        );
        if (own) {
          texts.push({ text: el.textContent!.trim().slice(0, 40), ratio: ratio(cs.color, bg) });
          if (!plain.has(key(bg))) roles.add('tinted surface');
          if (key(cs.color) === accent) roles.add('accent text');
        }
        // The timeline's marks (borders on pseudo-elements, so they print too).
        for (const pseudo of ['::before', '::after']) {
          const p = getComputedStyle(el, pseudo);
          if (p.content !== 'none' && parseFloat(p.borderLeftWidth) > 0)
            if (key(p.borderLeftColor) === accent) roles.add('accent marks');
        }
      }
      return { texts, roles: [...roles] };
    });
    expect(found.roles, `${scheme}: a tinted panel`).toContain('tinted surface');
    expect(found.roles, `${scheme}: accent text`).toContain('accent text');
    expect(found.roles, `${scheme}: accent marks`).toContain('accent marks');
    expect(found.texts.length).toBeGreaterThan(20);
    for (const t of found.texts)
      expect(t.ratio, `${scheme}: "${t.text}"`).toBeGreaterThanOrEqual(4.5);
  }
});

test('résumé columns balance', async ({ page, isMobile }) => {
  test.skip(isMobile, 'two columns from 1000px');
  await page.goto('/');
  const [main, side] = await page.evaluate(() =>
    ['.cv-main', '.cv-side'].map((s) => {
      const col = document.querySelector(`#resume ${s}`)!;
      return {
        top: col.getBoundingClientRect().top,
        end: col.lastElementChild!.getBoundingClientRect().bottom,
      };
    }),
  );
  expect(Math.abs(main.top - side.top), 'side by side').toBeLessThanOrEqual(1);
  expect(
    Math.abs(main.end - side.end),
    `experience ends at ${main.end}, the side column at ${side.end}`,
  ).toBeLessThanOrEqual(240);
});
