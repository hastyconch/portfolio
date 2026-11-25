import { test, expect, type Page } from '@playwright/test';

// WO-016: at 1440 × 900 the Work section gives the wide demos a fixed frame (WO-015 measured
// scheduler 1160 × 549, pipeline 1160 × 502). Each demo must fit its box with no scrollbar
// anywhere inside it, in every step the visitor can reach with the main flow.
const BOXES = [
  { route: '/demos/scheduler/', pane: '1160x540', w: 1160, h: 540 },
  { route: '/demos/pipeline/', pane: '1160x500', w: 1160, h: 500 },
];

/** Elements inside the pane that would show a scrollbar, plus the pane's own overflow. */
async function overflow(page: Page, pane: string) {
  return page.locator(`[data-pane="${pane}"]`).evaluate((root) => {
    const out: string[] = [];
    const check = (el: Element) => {
      const s = getComputedStyle(el);
      const y = el.scrollHeight - el.clientHeight;
      const x = el.scrollWidth - el.clientWidth;
      const scrollsY = /(auto|scroll)/.test(s.overflowY) && y > 1;
      const scrollsX = /(auto|scroll)/.test(s.overflowX) && x > 1;
      if (scrollsY || scrollsX)
        out.push(`${el.tagName.toLowerCase()}.${el.className} overflows by ${x}×${y}px`);
    };
    check(root);
    root.querySelectorAll('*').forEach(check);
    return out;
  });
}

test.describe('demos fit their pane', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const box of BOXES) {
    test(`${box.route} fits ${box.w}×${box.h}`, async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'the laptop pane is a desktop layout');
      await page.goto(box.route);
      await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
      const pane = page.locator(`[data-pane="${box.pane}"]`);
      const size = await pane.boundingBox();
      expect(size?.width).toBe(box.w);
      expect(size?.height).toBe(box.h);

      const states: string[] = [];
      const record = async (state: string) => {
        await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
        const bad = await overflow(page, box.pane);
        if (bad.length) states.push(`${state}: ${bad.join('; ')}`);
      };

      if (box.route.includes('scheduler')) {
        const demo = pane.locator('.sch-app');
        await record('start');
        await demo.getByRole('button', { name: 'Assign Jordan' }).click();
        await record('overtime warning');
        await demo.getByRole('button', { name: 'Reset' }).click();
        await demo.getByRole('button', { name: 'Assign Renee' }).click();
        await record('all covered');
        await demo.getByRole('gridcell', { name: /^Odette, Saturday: Night/ }).click();
        await record('new gap');
      } else {
        const act = pane.locator('.pl-next');
        await record('step 1');
        for (let i = 2; i <= 5; i++) {
          await act.click();
          if (i === 5) await expect(pane.getByText('Delivered on time')).toBeVisible();
          await record(`step ${i}`);
          if (i === 4) {
            await act.click(); // send the nudge: the reply joins the thread
            await record('step 4, nudge sent');
          }
        }
        // Each citation open in turn on the extraction step (one source shows at a time).
        await pane.getByRole('button', { name: /Step 2:/ }).click();
        const cites = await pane.locator('.pl-step.is-on summary').all();
        for (const [i, s] of cites.entries()) {
          await s.click();
          await record(`step 2, citation ${i + 1} open`);
        }
      }
      expect(states).toEqual([]);
    });
  }
});

// WO-040: on phones the Work frames drop the chrome that only costs room. Below 480px the phone
// has no bezel, island or status strip (the screen keeps its corners and a 1px outline); below
// 600px a window has no dots. Above those widths they are as before.
test('demo-fit phone frames drop chrome', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone cases');
  const chrome = () =>
    page.evaluate(() => {
      const phone = document.querySelector('#work .df-phone .df-device')!;
      const s = getComputedStyle(phone);
      const screen = getComputedStyle(phone.querySelector('.df-screen')!);
      return {
        bezel: parseFloat(s.paddingTop) + parseFloat(s.paddingLeft),
        island: getComputedStyle(phone.querySelector('.df-island')!).display,
        strip: parseFloat(screen.paddingTop),
        radius: screen.borderTopLeftRadius,
        outline: s.boxShadow,
        dots: [...document.querySelectorAll('#work .df-titlebar')].map(
          (t) => getComputedStyle(t).display,
        ),
      };
    });
  for (const width of [320, 375, 479]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const c = await chrome();
    expect(c.bezel, `${width}: no bezel`).toBe(0);
    expect(c.island, `${width}: no island`).toBe('none');
    expect(c.strip, `${width}: no status strip`).toBe(0);
    expect(c.radius, `${width}: the screen keeps its corners`).not.toBe('0px');
    expect(c.outline, `${width}: a 1px outline`).toMatch(/0px 0px 0px 1px/);
    expect(c.dots.length).toBeGreaterThan(0);
    expect(new Set(c.dots), `${width}: no window dots`).toEqual(new Set(['none']));
    // The open phone app takes the column's full width, up to the phone's 360px.
    const toggle = page.locator('#work [data-wk-try]').first();
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();
    const app = (await page.locator('#work .sky-app').boundingBox())!;
    const col = (await page.locator('#work .wk-live article').first().boundingBox())!;
    expect(Math.round(app.width), `${width}: the app fills the column`).toBe(
      Math.round(Math.min(col.width, 360)),
    );
  }
  await page.setViewportSize({ width: 599, height: 800 });
  await page.goto('/');
  let c = await chrome();
  expect(c.bezel, '599: the bezel is back').toBeGreaterThan(0);
  expect(new Set(c.dots), '599: no window dots').toEqual(new Set(['none']));
  await page.setViewportSize({ width: 600, height: 800 });
  c = await chrome();
  expect(new Set(c.dots), '600: the dots are back').toEqual(new Set(['flex']));
});
