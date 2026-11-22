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
// Songs whose lyrics carry at least one annotation (the annotator test needs one to open).
const annotated = songIds.filter((id) =>
  /note:/.test(readFileSync(join(CONTENT, 'songs', `${id}.md`), 'utf8')),
);

test.describe('music', () => {
  test('story renders from content', async ({ page }) => {
    await page.goto('/');
    const story = page.locator('#music [data-story]');
    const paragraphs = story.locator('.mu-story-lead, .mu-story-p');
    await expect(paragraphs).toHaveCount(music.story.length);

    const { name, named } = music.collaborator;
    if (named) {
      for (const [i, text] of music.story.entries())
        await expect(paragraphs.nth(i)).toHaveText(text);
      if (music.story.join(' ').includes(name)) await expect(story).toContainText(name);
    } else {
      // Unnamed collaborator: the name appears nowhere in the section, only "a friend".
      await expect(page.locator('#music')).not.toContainText(name);
    }
    if (music.status === 'placeholder') await expect(story.locator('.ln-ph')).toBeVisible();
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

  test('annotator is keyboard operable', async ({ page }) => {
    test.skip(annotated.length === 0, 'No song has annotated lyrics yet (owner content pending).');
    for (const route of ['/', `/music/${annotated[0]}/`]) {
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
