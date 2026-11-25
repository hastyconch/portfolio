import { test, expect, type Page } from '@playwright/test';

// WO-012: the nurse scheduler demo (grid + guided fill). Tests use the first (full-width)
// instance on the harness page.
async function open(page: Page) {
  await page.goto('/demos/scheduler/');
  // Wait for the first island to hydrate (Astro removes `ssr` once it has).
  await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
  const demo = page.locator('.sch-app').first();
  return {
    demo,
    grid: demo.getByRole('grid'),
    live: demo.getByRole('status'),
    cell: (name: RegExp | string) => demo.getByRole('gridcell', { name }),
    glyph: (name: RegExp | string) => demo.getByRole('gridcell', { name }).locator('.sch-glyph'),
  };
}

test('scheduler grid is keyboard operable', async ({ page }) => {
  const { demo, grid, live, cell, glyph } = await open(page);

  // Roving tabindex: exactly one cell is in the tab order.
  await expect(grid.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);
  const first = cell(/^Renee, Monday: Day/);
  await expect(first).toHaveAttribute('tabindex', '0');
  await expect(first.locator('.sch-glyph')).toHaveText('D');

  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(cell(/^Renee, Tuesday/)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(cell(/^Jordan, Tuesday: Off/)).toBeFocused();
  await expect(cell(/^Jordan, Tuesday/)).toHaveAttribute('tabindex', '0');
  await expect(first).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('End');
  await expect(cell(/^Jordan, Sunday/)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(cell(/^Jordan, Monday/)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(cell(/^Morgan, Monday: Night/)).toBeFocused();
  await expect(cell(/^Morgan, Friday: Off, approved leave/)).toHaveCount(1);

  // Coverage rows are part of the grid but read-only.
  await page.keyboard.press('Control+End');
  await expect(cell(/^4\/4 met: RNs on the Sunday night shift/)).toBeFocused();

  // Cells are locked until the open shift is filled.
  await cell(/^Renee, Monday/).focus();
  await page.keyboard.press('Enter');
  await expect(live).toContainText('Fill the open shift first');
  await expect(glyph(/^Renee, Monday: Day/)).toHaveText('D');

  await demo.getByRole('button', { name: 'Assign Renee' }).click();
  await expect(cell(/^Renee, Saturday: Night/)).toBeFocused();

  // Enter and Space cycle Day → Night → Off, with state in text and in the accessible name.
  await cell(/^Renee, Monday/).focus();
  await page.keyboard.press('Enter');
  await expect(glyph(/^Renee, Monday: Night/)).toHaveText('N');
  await page.keyboard.press('Space');
  await expect(glyph(/^Renee, Monday: Off/)).toHaveText('–');
  await expect(live).toContainText('Renee, Monday: Off');

  // Rules recheck live: a night then a day shift breaks the 12h rest rule.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space'); // Tue: Day → Night
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space'); // Wed: Off → Day
  await expect(cell(/^Renee, Wednesday: Day\. Problem: under 12h rest/)).toHaveCount(1);
  await expect(demo.locator('.sch-issues')).toContainText('under 12h rest');
});

test('scheduler guided fill covers the open shift', async ({ page }) => {
  const { demo, live, cell, glyph } = await open(page);
  const task = demo.locator('.sch-task');
  const openCover = cell(/(open shift: |RNs on the )Saturday night/);

  await expect(task.getByRole('heading')).toHaveText('Sat night, ICU: 3 of 4 RNs');
  await expect(openCover).toHaveAccessibleName(
    '3/4 under by 1, open shift: Saturday night, including 2 RNs not shown here.',
  );
  await expect(demo.locator('.sch-status')).toHaveText('1 problem.');

  // Ranked candidates with plain-words reasons.
  const cands = task.locator('.sch-cand');
  await expect(cands.locator('strong')).toHaveText(['Renee', 'Jordan', 'Sam', 'Morgan']);
  await expect(cands.nth(0)).toContainText('Eligible.');
  await expect(cands.nth(1)).toContainText('Overtime: goes to 44h.');
  await expect(cands.nth(2)).toContainText('Blocked: 4th night in a row.');
  await expect(cands.nth(3)).toContainText('Blocked: approved leave.');
  await expect(task).toContainText('Odette and Theo already work Sat.');

  // Blocked nurses cannot be assigned and say why.
  const sam = task.getByRole('button', { name: 'Can’t assign Sam' });
  await expect(sam).toHaveAttribute('aria-disabled', 'true');
  await expect(sam).toHaveAccessibleDescription(/4th night in a row/);
  await sam.focus();
  await page.keyboard.press('Enter');
  await expect(live).toHaveText('Sam can’t be assigned: 4th night in a row.');
  await expect(openCover).toHaveAccessibleName(/^3\/4 under by 1, open shift/);
  await expect(cell(/^Sam, Saturday: Off/)).toHaveCount(1);

  // Assigning an eligible nurse covers the shift and is announced.
  await task.getByRole('button', { name: 'Assign Renee' }).click();
  await expect(live).toContainText('Renee assigned to Saturday night: 4 of 4 RNs.');
  await expect(live).toContainText('All rules pass.');
  await expect(openCover).toHaveAccessibleName(
    '4/4 met: RNs on the Saturday night shift, including 2 RNs not shown here.',
  );
  await expect(glyph(/^Renee, Saturday: Night/)).toHaveText('N');
  await expect(task.getByRole('heading')).toHaveText('Every shift meets its target');
  await expect(demo.locator('.sch-status')).toHaveText('All rules pass.');

  // Reset restores the scenario; the overtime pick is a warning, not a block.
  await demo.getByRole('button', { name: 'Reset' }).click();
  await expect(live).toContainText('Scenario reset');
  await expect(openCover).toHaveAccessibleName(/^3\/4 under by 1, open shift/);
  await task.getByRole('button', { name: 'Assign Jordan' }).click();
  await expect(demo.locator('.sch-status')).toHaveText('1 warning.');
  await expect(demo.locator('.sch-issues')).toContainText('Jordan: 44h this week, 4h overtime.');
  await expect(demo.getByRole('rowheader', { name: /Jordan/ })).toContainText('44h · OT');
});

test('scheduler finds cover for a gap the visitor opens', async ({ page }) => {
  const { demo, cell } = await open(page);
  const task = demo.locator('.sch-task');
  await task.getByRole('button', { name: 'Assign Renee' }).click();
  await expect(task.getByRole('heading')).toHaveText('Every shift meets its target');

  // Take Odette off Saturday night: the panel turns into a new open shift with ranked cover.
  await cell(/^Odette, Saturday: Night/).click();
  await expect(task).toContainText('New gap');
  await expect(task.getByRole('heading')).toHaveText('Sat night, ICU: 3 of 4 RNs');
  await expect(task.locator('.sch-cand strong').first()).toHaveText('Odette');
  await task.getByRole('button', { name: 'Assign Odette' }).click();
  await expect(task.getByRole('heading')).toHaveText('Every shift meets its target');
});

// WO-037: coverage is text plus a shape in every state, so it reads without colour. Each cover
// cell says its count and its state in words ("Met", "Under by 1", "Over by 1"), and the dot
// beside the words changes shape with the state: a filled disc when under, an open ring when
// met, an open square when over.
test('scheduler coverage reads without colour', async ({ page }) => {
  const { demo, cell } = await open(page);
  const covers = demo.locator('.sch-count');
  await expect(covers).toHaveCount(14);

  const read = () =>
    covers.evaluateAll((els) =>
      els.map((el) => {
        const dot = el.querySelector('.sch-dot');
        const s = dot ? getComputedStyle(dot) : null;
        return {
          text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
          name: el.getAttribute('aria-label') ?? '',
          tone: dot?.getAttribute('data-tone') ?? '',
          filled: !!s && s.backgroundColor !== 'rgba(0, 0, 0, 0)',
          round: !!s && s.borderTopLeftRadius === '50%',
        };
      }),
    );
  const check = async () => {
    const cells = await read();
    for (const c of cells) {
      const m = c.text.match(/^(\d)\/(\d) ?(Met|Under by (\d)|Over by (\d))$/);
      expect(m, `cover cell text: "${c.text}"`).not.toBeNull();
      const [have, need] = [Number(m![1]), Number(m![2])];
      const word = m![3].split(' ')[0].toLowerCase();
      expect(c.tone, c.text).toBe(word);
      if (word === 'under') expect(need - have, c.text).toBe(Number(m![4]));
      if (word === 'over') expect(have - need, c.text).toBe(Number(m![5]));
      if (word === 'met') expect(have, c.text).toBe(need);
      // The shape, not the colour, tells the states apart.
      expect({ filled: c.filled, round: c.round }, c.text).toEqual(
        word === 'under'
          ? { filled: true, round: true }
          : word === 'met'
            ? { filled: false, round: true }
            : { filled: false, round: false },
      );
      // The accessible name starts with the same words.
      expect(c.name.toLowerCase(), c.text).toMatch(
        new RegExp(`^${have}/${need} ${m![3].toLowerCase()}`),
      );
    }
    return cells.map((c) => c.tone);
  };

  // Start: one shift under, the rest met.
  let tones = await check();
  expect(tones.filter((t) => t === 'under')).toHaveLength(1);
  await expect(demo.locator('.sch-task')).toContainText('Open shift · Under by 1 RN');

  // All met once the open shift is filled.
  await demo.getByRole('button', { name: 'Assign Renee' }).click();
  tones = await check();
  expect(tones.every((t) => t === 'met')).toBe(true);

  // Renee's Monday day becomes a night: Monday day is under, Monday night is over.
  await cell(/^Renee, Monday: Day/).click();
  tones = await check();
  expect(tones).toContain('under');
  expect(tones).toContain('over');
  await expect(cell(/^3\/4 under by 1, open shift: Monday day/)).toHaveCount(1);
  await expect(cell(/^5\/4 over by 1: RNs on the Monday night shift/)).toHaveCount(1);

  // The rule check and the header figures carry a word or number next to their dot too.
  // (two problems: Monday day is short, and a Monday night then a Tuesday day leaves Renee
  // under 12h rest)
  await expect(demo.locator('.sch-status')).toHaveText('2 problems.');
  await expect(demo.locator('.sch-status .sch-dot')).toHaveAttribute('data-tone', 'under');
});

// WO-042: the scheduler on phones. Focus never sits under the sticky name column, programmatic
// focus never jumps the page, at least three days show beside the names at 375 (two at 320), a tap
// on a locked cell says why in view, touch screens get tapping words, and buttons fit a thumb.

/** How the focused cell sits in the roster: px hidden under the name column, and whether it is
    clear of the name column and inside the scroller. */
async function placement(page: Page) {
  return page.evaluate(() => {
    const cell = document.activeElement as HTMLElement;
    const wrap = cell.closest('.sch-gridwrap') as HTMLElement;
    const names = wrap.querySelector('.sch-corner') as HTMLElement;
    const r = cell.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const n = names.getBoundingClientRect();
    return {
      name: cell.getAttribute('aria-label') ?? '',
      hidden: Math.max(0, Math.min(r.right, n.right) - Math.max(r.left, n.left)),
      inside: r.left >= n.right - 1 && r.right <= w.right + 1,
    };
  });
}

test('scheduler focus never hides under the name column', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const { cell } = await open(page);
  await cell(/^Renee, Monday/).focus();
  const seen: string[] = [];
  const check = async () => {
    const p = await placement(page);
    seen.push(p.name.split(':')[0]);
    expect(p.hidden, p.name).toBeLessThan(1);
    expect(p.inside, p.name).toBe(true);
  };
  await check();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowRight');
    await check();
  }
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowLeft');
    await check();
  }
  // Home and End jump the whole week; the cover rows behave the same.
  await page.keyboard.press('End');
  await check();
  await page.keyboard.press('Control+End');
  await check();
  await page.keyboard.press('Home');
  await check();
  expect(seen).toContain('Renee, Sunday');
  expect(seen.filter((s) => s === 'Renee, Tuesday')).toHaveLength(2);
});

test('scheduler assign keeps the page still', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const { demo, cell } = await open(page);
  const scrollY = () => page.evaluate(() => window.scrollY);
  const settle = () => page.waitForTimeout(600);

  // A tap on a cell focuses it without moving the page.
  const odette = cell(/^Odette, Monday/);
  await odette.scrollIntoViewIfNeeded();
  await settle();
  let before = await scrollY();
  await odette.click();
  await settle();
  expect(Math.abs((await scrollY()) - before)).toBeLessThanOrEqual(40);

  // Assign moves focus to the assigned cell in the roster, which is off screen above.
  const assign = demo.getByRole('button', { name: 'Assign Renee' });
  await assign.scrollIntoViewIfNeeded();
  await settle();
  before = await scrollY();
  await assign.click();
  await expect(cell(/^Renee, Saturday: Night/)).toBeFocused();
  await settle();
  expect(Math.abs((await scrollY()) - before)).toBeLessThanOrEqual(40);
  // The roster still scrolled sideways to show it.
  expect((await placement(page)).inside).toBe(true);
});

test('scheduler shows more days on phones', async ({ page }) => {
  for (const [width, least] of [
    [375, 3],
    [320, 2],
  ]) {
    await page.setViewportSize({ width, height: 800 });
    const { demo } = await open(page);
    const wrap = demo.locator('.sch-gridwrap');
    const shown = await wrap.evaluate((el) => {
      const w = el.getBoundingClientRect();
      const n = el.querySelector('.sch-corner')!.getBoundingClientRect();
      return [...el.querySelectorAll('thead th:not(.sch-corner)')].filter((th) => {
        const r = th.getBoundingClientRect();
        return r.left >= n.right - 1 && r.right <= w.right + 1;
      }).length;
    });
    expect(shown, `whole days beside the names at ${width}`).toBeGreaterThanOrEqual(least);
    // The open shift's day is one of them.
    const day = (await demo.locator('thead th.is-open').boundingBox())!;
    const box = (await wrap.boundingBox())!;
    expect(day.x + day.width).toBeLessThanOrEqual(box.x + box.width + 1);
    // Name and hours share a line.
    const oneLine = await demo.getByRole('rowheader', { name: /^Renee/ }).evaluate((th) => {
      const a = th.querySelector('.sch-name')!.getBoundingClientRect();
      const b = th.querySelector('.sch-hours')!.getBoundingClientRect();
      return Math.abs(a.bottom - b.bottom) < 4;
    });
    expect(oneLine, `Renee and her hours on one line at ${width}`).toBe(true);
  }
});

test.describe('on a touch screen', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  test('scheduler touch feedback and copy', async ({ page }) => {
    const { demo, cell, live } = await open(page);
    const help = demo.locator('.sch-help');
    // The instructions talk about tapping, not arrow keys.
    await expect(help).toContainText(/tap/i);
    expect(await help.evaluate((e) => (e as HTMLElement).innerText)).not.toMatch(/arrow keys/i);

    // A tap on a cell that can't take the shift yet says why, in view.
    const hint = demo.locator('.sch-taphint');
    await expect(hint).toHaveCount(0);
    await cell(/^Renee, Monday/).tap();
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText(/^Fill the open shift first/);
    await expect(live).toContainText('Fill the open shift first');
    await expect(hint).toBeInViewport();

    // Once the shift is filled the hint goes, and the copy says what a tap does.
    await demo.getByRole('button', { name: 'Assign Renee' }).tap();
    await expect(hint).toHaveCount(0);
    await expect(help).toContainText(/Tap a cell to cycle/);
  });

  test('scheduler targets fit a thumb', async ({ page }) => {
    const { demo } = await open(page);
    const sizes = await demo.locator('button, summary').evaluateAll((els) =>
      els
        .filter((e) => (e as HTMLElement).offsetParent !== null)
        .map((e) => ({
          name: (e.textContent ?? '').trim(),
          h: e.getBoundingClientRect().height,
        })),
    );
    expect(sizes.length).toBeGreaterThanOrEqual(6);
    for (const s of sizes) expect(s.h, s.name).toBeGreaterThanOrEqual(44);
  });
});

// On a mouse or trackpad the instructions keep the keyboard words.
test.describe('with a mouse', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false });

  test('scheduler keeps keyboard words for a fine pointer', async ({ page }) => {
    const { demo } = await open(page);
    const help = demo.locator('.sch-help');
    expect(await help.evaluate((e) => (e as HTMLElement).innerText)).toMatch(/Arrow keys move/);
  });
});
