import { test, expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// WO-013: the Music story, song pages, the shared lyrics annotator and click-to-load players.
const CONTENT = join(process.cwd(), 'src/content');
const [music] = JSON.parse(readFileSync(join(CONTENT, 'music.json'), 'utf8')) as {
  story: string[];
  collaborator: { name: string; named: boolean };
  status: 'ready' | 'placeholder';
}[];
const songIds = readdirSync(join(CONTENT, 'songs'))
  .filter((f) => f.endsWith('.md'))
  // Features ("Appears on") have no song page.
  .filter((f) => !/^feature: true$/m.test(readFileSync(join(CONTENT, 'songs', f), 'utf8')))
  .map((f) => f.replace(/\.md$/, ''))
  .sort();
const THIRD_PARTY = /spotify|youtube/i;
const songFile = (id: string) => readFileSync(join(CONTENT, 'songs', `${id}.md`), 'utf8');
const titleOf = (id: string) => /^title: (['"])(.+)\1$/m.exec(songFile(id))?.[2] ?? id;
const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A song's first lyric line (long enough not to collide with other copy), if it has lyrics.
const firstLine = (id: string) => /'line': '(.{16,}?)'/.exec(songFile(id))?.[1];

// WO-018: a frame-by-frame probe of the song art. Each animation frame records every rendered,
// non-transparent sleeve (.sa): which panel it's in, whether its cover image is loaded, and how far
// the record's slide-out has run. Installed before any page script so it sees the first frame.
type ArtFrame = {
  selected: string | null;
  shown: { panel: string | null; ready: boolean; slide: number | null }[];
};
const probeArt = () => {
  const w = window as unknown as { __art: ArtFrame[] };
  w.__art = [];
  const tick = () => {
    const sel = document.querySelector('#music [role="tab"][aria-selected="true"]');
    w.__art.push({
      selected: sel?.getAttribute('aria-controls') ?? null,
      shown: [...document.querySelectorAll<HTMLElement>('.sa')]
        .filter((sa) => sa.offsetParent && Number(getComputedStyle(sa).opacity) > 0)
        .map((sa) => {
          const img = sa.querySelector('img');
          const slide = sa.querySelector('.sa-vinyl')?.getAnimations()[0];
          return {
            panel: sa.closest('[role="tabpanel"]')?.id ?? null,
            ready: !img || (img.complete && img.naturalWidth > 0),
            slide: slide ? Number(slide.currentTime) : null,
          };
        }),
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const artFrames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __art: ArtFrame[] }).__art);
// Covers arrive late (as on a slow network), so any frame drawn before them would show.
const slowCovers = (page: Page) =>
  page.route(/\/_astro\/.+\.(webp|avif|png|jpe?g)$/, async (r) => {
    await new Promise((done) => setTimeout(done, 500));
    await r.continue();
  });
// A sleeve that is shown is the selected song's, with its cover loaded, and its record starts
// sliding as it appears (not before, behind a stand-in).
const expectCleanFrames = (frames: ArtFrame[], tabs: boolean) => {
  expect(frames.length).toBeGreaterThan(10);
  let prev: string | null | undefined;
  for (const [i, f] of frames.entries()) {
    expect(f.shown.length, `frame ${i}: sleeves shown`).toBeLessThanOrEqual(1);
    const [art] = f.shown;
    if (art) {
      expect(art.ready, `frame ${i}: cover shown before it loaded`).toBe(true);
      if (tabs) expect(art.panel, `frame ${i}: another song's art`).toBe(f.selected);
      // The first frame a sleeve appears on: its record has only just started.
      if (prev !== art.panel && art.slide !== null)
        expect(art.slide, `frame ${i}: record slid before the cover showed`).toBeLessThan(100);
    }
    prev = art ? art.panel : undefined;
  }
};

// Songs whose lyrics carry at least one annotation (the annotator test needs one to open).
const annotated = songIds.filter((id) =>
  /note:/.test(readFileSync(join(CONTENT, 'songs', `${id}.md`), 'utf8')),
);

test.describe('music', () => {
  test('story renders from content', async ({ page }) => {
    await page.goto('/');
    const story = page.locator('#music [data-story]');
    const paragraphs = story.locator('.mu-story-lead, .mu-story-p');
    // WO-022: a sentence that only describes the UI ("Below are the songs…") is left out.
    const shown = music.story
      .map((p) =>
        p
          .split(/(?<=[.!?])\s+/)
          .filter((s) => !/^Below\b/i.test(s))
          .join(' '),
      )
      .filter((p) => p.trim());
    await expect(paragraphs).toHaveCount(shown.length);
    await expect(story).not.toContainText(/Below are the songs/i);

    const { name, named } = music.collaborator;
    if (named) {
      for (const [i, text] of shown.entries()) await expect(paragraphs.nth(i)).toHaveText(text);
      if (music.story.join(' ').includes(name)) await expect(story).toContainText(name);
    } else {
      // Unnamed collaborator: the name appears nowhere in the section, only "a friend".
      await expect(page.locator('#music')).not.toContainText(name);
    }
    if (music.status === 'placeholder') await expect(story.locator('.ln-ph')).toBeVisible();
  });

  test('home shows a lyrics call-out', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#music');
    // No lyric lines on the home page: they live on the song pages.
    await expect(section.locator('details.ly-d, .mu-excerpt, blockquote')).toHaveCount(0);
    for (const id of songIds) {
      const line = firstLine(id);
      if (line) await expect(section).not.toContainText(line);
    }
    // Each song's panel has one call-out, and it is that song's one link to its page.
    for (const id of songIds) {
      await page.locator(`#mu-tab-${id}`).click();
      const call = page.locator(`#mu-panel-${id} .mu-call`);
      await expect(call).toHaveCount(1);
      await expect(call).toBeVisible();
      const link = call.getByRole('link');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute('href', `/music/${id}/`);
      await expect(link).toHaveAccessibleName(new RegExp(`^Read .+\\s?: ${escape(titleOf(id))}$`));
    }
    // The whole card is the target: a click by its arrow (not on the text) opens the song page.
    const last = songIds[songIds.length - 1];
    const card = page.locator(`#mu-panel-${last} .mu-call`);
    const box = await card.boundingBox();
    await card.click({ position: { x: (box?.width ?? 40) - 24, y: (box?.height ?? 40) / 2 } });
    await expect(page).toHaveURL(new RegExp(`/music/${last}/$`));
  });

  test('tab switch shows only the selected song art', async ({ page }) => {
    await page.addInitScript(probeArt);
    await page.goto('/');
    const tabs = page.locator('#music [role="tab"]');
    await expect(page.locator('#music [role="tabpanel"]:visible .sa')).toHaveAttribute(
      'data-state',
      'in',
    );
    await slowCovers(page);
    // Fast switching with the mouse, then the keyboard, while covers are still on their way.
    await tabs.nth(1).click();
    await tabs.nth(2).click();
    await page.waitForTimeout(150);
    await tabs.nth(1).click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('End');
    await page.waitForTimeout(100);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    const panel = page.locator('#music [role="tabpanel"]:visible');
    await expect(panel.locator('.sa')).toHaveAttribute('data-state', 'in');
    await page.waitForTimeout(200);
    expectCleanFrames(await artFrames(page), true);
  });

  test('song page shows cover and record together', async ({ page }) => {
    await page.addInitScript(probeArt);
    await slowCovers(page);
    await page.goto(`/music/${songIds[0]}/`);
    await expect(page.locator('.sa')).toHaveAttribute('data-state', 'in');
    // Next song, then back and forward.
    await page.locator('a[rel="next"]').click();
    await expect(page.locator('.sa')).toHaveAttribute('data-state', 'in');
    await page.waitForTimeout(200);
    expectCleanFrames(await artFrames(page), false);
    await page.goBack();
    await expect(page.locator('.sa')).toHaveAttribute('data-state', 'in');
    await page.goForward();
    await expect(page.locator('.sa')).toHaveAttribute('data-state', 'in');
    await page.waitForTimeout(200);
    expectCleanFrames(await artFrames(page), false);
  });

  test('section links every song to its page', async ({ page }) => {
    await page.goto('/');
    for (const id of songIds) {
      await expect(page.locator(`#music a[href="/music/${id}/"]`)).toHaveCount(1);
    }
    // The first song's link is in the open tab panel and leads to the song page.
    await page.locator(`#music a[href="/music/${songIds[0]}/"]`).click();
    await expect(page).toHaveURL(new RegExp(`/music/${songIds[0]}/$`));
    await expect(page.locator('h1')).toBeVisible();
  });

  test('annotator is keyboard operable on song pages', async ({ page }) => {
    test.skip(annotated.length === 0, 'No song has annotated lyrics yet (owner content pending).');
    // The full lyrics and annotations live on the song pages; the home page shows an excerpt.
    for (const route of annotated.map((id) => `/music/${id}/`)) {
      await page.goto(route);
      const line = page.locator('details.ly-d:visible').first();
      const summary = line.locator('summary');
      const note = line.locator('.ly-note');

      // Enter opens the note and moves focus into it; Esc closes it and returns focus to the line.
      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(line).toHaveAttribute('open', '');
      await expect(note).toBeVisible();
      await expect(note).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(line).not.toHaveAttribute('open', '');
      await expect(summary).toBeFocused();

      // Space opens it too; the Close button returns focus the same way.
      await page.keyboard.press(' ');
      await expect(note).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(line.locator('[data-close]')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(line).not.toHaveAttribute('open', '');
      await expect(summary).toBeFocused();
    }
  });

  test('players load only on click', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => {
      if (THIRD_PARTY.test(new URL(r.url()).hostname)) requests.push(r.url());
    });
    // Never reach the real services from the test run.
    await page.route(
      (u) => THIRD_PARTY.test(u.hostname),
      (r) => r.abort(),
    );

    const visit = async (p: Page, route: string) => {
      await p.goto(route);
      await p.waitForLoadState('networkidle');
      await expect(p.locator('iframe')).toHaveCount(0);
    };
    for (const route of ['/', ...songIds.map((id) => `/music/${id}/`)]) {
      await visit(page, route);
      expect(requests, `third-party requests before any click on ${route}`).toEqual([]);
    }

    // On a song page, a player button (once the owner adds links) loads its iframe on click.
    await visit(page, `/music/${songIds[0]}/`);
    const play = page.locator('button.pl-play[data-src]');
    if ((await play.count()) === 0) {
      // Placeholder songs: no player to load yet, so each service shows its "coming" state.
      await expect(page.locator('.pl-play.is-soon')).toHaveCount(2);
      return;
    }
    const title = await play.first().getAttribute('data-title');
    await play.first().click();
    await expect(page.locator(`iframe[title="${title}"]`)).toBeVisible();
    await expect.poll(() => requests.length).toBeGreaterThan(0);
  });
});

test('music lists features under Appears on, with a player and no page', async ({ page }) => {
  await page.goto('/');
  const feat = page.locator('#music .mu-feat');
  await expect(feat.getByRole('heading', { name: 'Appears on' })).toBeVisible();
  await expect(feat).toContainText('Lonely');
  await expect(feat.locator('button.pl-play')).not.toHaveCount(0);
  await expect(page.locator('#music a[href="/music/lonely/"]')).toHaveCount(0);
  const res = await page.request.get('/music/lonely/');
  expect(res.status()).toBe(404);
});

// WO-022: the layout of the Music section (tracklist beside the panel, heading, phone strip),
// the quieter players and the song kept in the URL.
type Box = { top: number; bottom: number; left: number; right: number };
const box = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el): Box => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
  });
// Jump to the section, then measure. Positions are taken from the section's top (all in one go,
// so a scroll that settles in between can't skew them), as if the section sat right under the
// header: the anchor offset (liner.css, WO-023) doesn't change the result.
const jumpToMusic = async (page: Page) => {
  await page.locator('#music').evaluate((el) => el.scrollIntoView());
};
const measureMusic = (page: Page, selectors: string[]) =>
  page.evaluate((sels) => {
    const header =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ln-header')) || 0;
    const top = document.getElementById('music')?.getBoundingClientRect().top ?? 0;
    return sels.map((s) => {
      const r = document.querySelector(s)?.getBoundingClientRect();
      if (!r) throw new Error(`no ${s}`);
      const y = header - top;
      return { top: r.top + y, bottom: r.bottom + y, left: r.left, right: r.right, header };
    });
  }, selectors);
const selectedTabs = (page: Page) => page.locator('#music [role="tab"][aria-selected="true"]');
const tabIds = (page: Page) =>
  page
    .locator('#music [role="tab"]')
    .evaluateAll((ts) => ts.map((t) => t.getAttribute('data-song') ?? ''));

test('music tracklist beside the panel', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Laptop layout (1440 × 900).');
  await page.goto('/');
  await jumpToMusic(page);
  const vh = page.viewportSize()?.height ?? 900;
  const [title, list, panel, sleeve] = await measureMusic(page, [
    '#music-h',
    '#music [role="tablist"]',
    '#music [role="tabpanel"]:not([hidden])',
    '#music [role="tabpanel"]:not([hidden]) .sa',
  ]);
  // The title, the whole tracklist and the top of the sleeve are above the fold.
  expect(title.top).toBeGreaterThanOrEqual(title.header);
  expect(list.bottom).toBeLessThanOrEqual(vh);
  expect(sleeve.top).toBeLessThan(vh - 100);
  // The list is to the right of the panel, the two aligned to the top.
  expect(list.left).toBeGreaterThanOrEqual(panel.right);
  expect(Math.abs(list.top - panel.top)).toBeLessThanOrEqual(2);
  // One column of rows, with no number badge over the covers.
  const lefts = await page
    .locator('#music [role="tab"]')
    .evaluateAll((ts) => ts.map((t) => t.getBoundingClientRect().left));
  expect(new Set(lefts).size).toBe(1);
  await expect(page.locator('#music .mu-tab-art .ln-num')).toHaveCount(0);
  // Switching songs doesn't move anything above the panel (measured from the section's top).
  const above = () =>
    page.evaluate(() => {
      const top = (s: string) => document.querySelector(s)?.getBoundingClientRect().top ?? 0;
      return [top('#music-h'), top('#music [role="tablist"]')].map((t) => t - top('#music'));
    });
  const before = await above();
  await page.locator('#music [role="tab"]').last().click();
  expect(await above()).toEqual(before);
});

test('music heading matches sections', async ({ page }) => {
  await page.goto('/');
  const style = (sel: string) =>
    page.locator(sel).evaluate((el) => {
      const s = getComputedStyle(el);
      return { size: s.fontSize, family: s.fontFamily, weight: s.fontWeight };
    });
  const music = await style('#music-h');
  expect(music).toEqual(await style('#work-h'));
  await expect(page.locator('#music-h')).toHaveText('Music');
  await expect(page.locator('#music-h')).not.toHaveClass(/\blabel\b/);
});

test('music phone strip shows the panel', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Phone layout (375 × 812).');
  await page.goto('/');
  await jumpToMusic(page);
  const tabs = page.locator('#music [role="tab"]');
  // One row of covers, at most 160px tall.
  const strip = await box(page, '#music [role="tablist"]');
  expect(strip.bottom - strip.top).toBeLessThanOrEqual(160);
  const rows = await tabs.evaluateAll((ts) => ts.map((t) => t.getBoundingClientRect().top));
  expect(new Set(rows).size).toBe(1);
  // The hard case: the strip at the bottom of the screen, so the panel is below the fold.
  await page
    .locator('#music [role="tablist"]')
    .evaluate((el) => el.scrollIntoView({ block: 'end' }));
  const sixth = tabs.nth(5);
  await sixth.tap();
  await expect(sixth).toHaveAttribute('aria-selected', 'true');
  const id = await sixth.getAttribute('data-song');
  await expect(page.locator(`#mu-panel-${id} .mu-title`)).toBeInViewport();
  // No sideways scroll on the page itself.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('music remembers the song', async ({ page }) => {
  await page.goto('/');
  const ids = await tabIds(page);
  const [, second, third] = ids;
  // Choosing a song replaces the URL's hash: no new history entry.
  const length = await page.evaluate(() => history.length);
  await page.locator(`#mu-tab-${second}`).click();
  await expect(page).toHaveURL(new RegExp(`/#song-${second}$`));
  await page.locator(`#mu-tab-${third}`).focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(new RegExp(`/#song-${third}$`));
  expect(await page.evaluate(() => history.length)).toBe(length);

  // Loading /#song-<id> selects it and lands on the section.
  await page.goto(`/#song-${second}`);
  await expect(selectedTabs(page)).toHaveAttribute('data-song', second);
  await expect(page.locator(`#mu-panel-${second}`)).toBeVisible();
  await expect(page.locator('#music-h')).toBeInViewport();

  // Back from the song's page shows it selected.
  await page.locator(`#mu-panel-${second} a[data-song-link]`).click();
  await expect(page).toHaveURL(new RegExp(`/music/${second}/$`));
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/#song-${second}$`));
  await expect(selectedTabs(page)).toHaveAttribute('data-song', second);

  // The song page's "All songs" link comes back to the same song.
  await page.goto(`/music/${third}/`);
  const all = page.locator('.sg-back a');
  await expect(all).toHaveAttribute('href', `/#song-${third}`);
  await all.click();
  await expect(selectedTabs(page)).toHaveAttribute('data-song', third);
  await expect(page.locator(`#mu-panel-${third}`)).toBeVisible();
});

test('music players', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#music');
  // Only the players that work: no "link coming" state on the home page.
  await expect(section.locator('.pl-play.is-soon')).toHaveCount(0);
  await expect(section).not.toContainText(/link coming/i);
  for (const id of await tabIds(page)) {
    await page.locator(`#mu-tab-${id}`).click();
    const buttons = page.locator(`#mu-panel-${id} button.pl-play`);
    for (const b of await buttons.all()) {
      await expect(b).toHaveAccessibleName(
        new RegExp(`^Play on \\w+\\s?: ${escape(titleOf(id))}$`),
      );
      await expect(b).toHaveAccessibleDescription(/^Loads the \w+ player$/);
      await expect(b).not.toContainText(/Loads the/);
    }
  }
  // The song page still shows every service.
  await page.goto(`/music/${songIds[0]}/`);
  await expect(page.locator('.pl-player')).toHaveCount(2);
});
