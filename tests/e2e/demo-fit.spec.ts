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
