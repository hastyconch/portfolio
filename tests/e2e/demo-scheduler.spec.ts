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
  const first = cell(/^Priya, Monday: Day/);
  await expect(first).toHaveAttribute('tabindex', '0');
  await expect(first.locator('.sch-glyph')).toHaveText('D');

  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(cell(/^Priya, Tuesday/)).toBeFocused();
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
  await expect(cell(/^4\/4 RNs on the Sunday night shift/)).toBeFocused();

  // Cells are locked until the open shift is filled.
  await cell(/^Priya, Monday/).focus();
  await page.keyboard.press('Enter');
  await expect(live).toContainText('Fill the open shift first');
  await expect(glyph(/^Priya, Monday: Day/)).toHaveText('D');

  await demo.getByRole('button', { name: 'Assign Priya' }).click();
  await expect(cell(/^Priya, Saturday: Night/)).toBeFocused();

  // Enter and Space cycle Day → Night → Off, with state in text and in the accessible name.
  await cell(/^Priya, Monday/).focus();
  await page.keyboard.press('Enter');
  await expect(glyph(/^Priya, Monday: Night/)).toHaveText('N');
  await page.keyboard.press('Space');
  await expect(glyph(/^Priya, Monday: Off/)).toHaveText('–');
  await expect(live).toContainText('Priya, Monday: Off');

  // Rules recheck live: a night then a day shift breaks the 12h rest rule.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space'); // Tue: Day → Night
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space'); // Wed: Off → Day
  await expect(cell(/^Priya, Wednesday: Day\. Problem: under 12h rest/)).toHaveCount(1);
  await expect(demo.locator('.sch-issues')).toContainText('under 12h rest');
});

test('scheduler guided fill covers the open shift', async ({ page }) => {
  const { demo, live, cell, glyph } = await open(page);
  const task = demo.locator('.sch-task');
  const openCover = cell(/(open shift: |RNs on the )Saturday night/);

  await expect(task.getByRole('heading')).toHaveText('Sat night, ICU — 3 of 4 RNs');
  await expect(openCover).toHaveAccessibleName('3/4 open shift: Saturday night, 1 short.');
  await expect(demo.locator('.sch-status')).toHaveText('1 problem.');

  // Ranked candidates with plain-words reasons.
  const cands = task.locator('.sch-cand');
  await expect(cands.locator('strong')).toHaveText(['Priya', 'Jordan', 'Sam', 'Morgan']);
  await expect(cands.nth(0)).toContainText('Eligible.');
  await expect(cands.nth(1)).toContainText('Overtime: goes to 44h.');
  await expect(cands.nth(2)).toContainText('Blocked: 4th night in a row.');
  await expect(cands.nth(3)).toContainText('Blocked: approved leave.');
  await expect(task).toContainText('Ines and Theo already work Sat.');

  // Blocked nurses cannot be assigned and say why.
  const sam = task.getByRole('button', { name: 'Can’t assign Sam' });
  await expect(sam).toHaveAttribute('aria-disabled', 'true');
  await expect(sam).toHaveAccessibleDescription(/4th night in a row/);
  await sam.focus();
  await page.keyboard.press('Enter');
  await expect(live).toHaveText('Sam can’t be assigned: 4th night in a row.');
  await expect(openCover).toHaveAccessibleName(/^3\/4 open shift/);
  await expect(cell(/^Sam, Saturday: Off/)).toHaveCount(1);

  // Assigning an eligible nurse covers the shift and is announced.
  await task.getByRole('button', { name: 'Assign Priya' }).click();
  await expect(live).toContainText('Priya assigned to Saturday night. Saturday night: 4 of 4 RNs.');
  await expect(live).toContainText('All rules pass.');
  await expect(openCover).toHaveAccessibleName('4/4 RNs on the Saturday night shift.');
  await expect(glyph(/^Priya, Saturday: Night/)).toHaveText('N');
  await expect(task.getByRole('heading')).toHaveText('Priya works Sat night');
  await expect(demo.locator('.sch-status')).toHaveText('All rules pass.');

  // Reset restores the scenario; the overtime pick is a warning, not a block.
  await demo.getByRole('button', { name: 'Reset' }).click();
  await expect(live).toContainText('Scenario reset');
  await expect(openCover).toHaveAccessibleName(/^3\/4 open shift/);
  await task.getByRole('button', { name: 'Assign Jordan' }).click();
  await expect(demo.locator('.sch-status')).toHaveText('1 warning.');
  await expect(demo.locator('.sch-issues')).toContainText('Jordan: 44h this week, 4h overtime.');
  await expect(demo.getByRole('rowheader', { name: /Jordan/ })).toContainText('44h · OT');
});
