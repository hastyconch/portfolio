---
id: WO-040
title: Work on phones: a still preview per item, details behind a toggle, and demos that open on screen and scroll with the page
phase: 13
gate: human
agent: builder
depends_on: [WO-034, WO-035, WO-036, WO-037]
touches:
  - src/system/Work.astro
  - src/system/DemoFrame.astro
  - src/demos/airline/airline.css (one new phone block at the end of the file only)
  - src/demos/grocer/grocer.css (one new phone block at the end of the file only)
  - src/demos/scheduler/scheduler.css (one new phone block at the end of the file only)
  - src/demos/pipeline/pipeline.css (one new phone block at the end of the file only)
  - src/assets/work/** (new preview images)
  - tests/e2e/work.spec.ts
  - tests/e2e/demo-fit.spec.ts (phone cases only)
  - factory/decisions.md
---

## Goal

The mobile audit of Phase 12 (`/Users/nakuliyer/portfolio/factory/out/audit6/mobile-report.md`, findings 1, 2, 4, 12, 16 (Work only), 17 and 19) found that the demos are hard to reach on a phone. Measured on the live site with iPhone 13 emulation:

- **Work is five or more screens of text.** Collapsed, the four items are 783, 695, 695 and 930px tall: about 4,250px at 390. They are four identical stacks, each ending in the same full-width orange button, and no product shows until you tap.
- **An opened demo lands mostly below the screen.** At 390 × 664 visible, "Try the demo: Airline" leaves the app's top at y = 465. Only 199 of its 594px show, and the tab bar ends at y = 1,059. At 375 × 812, 348px show.
- **The demo catches the first swipe.** A 250px swipe that starts on the Airline app moves the page 0px; only the app's panel scrolls (91px). The app is about 82% of the width, so most swipes start on it.
- **"Hide demo" is only above the demo:** 784px back up from the bottom of Airline, 1,330px for the scheduler.
- **Device frames cost space:** a phone bezel inside a phone takes about 24px of width and 40px of height; the window dots on the scheduler and pipeline read as decoration at phone size.
- **Early taps can be lost:** with 4× CPU throttling on slow 4G, hydration takes 652ms and a tab tap 60ms after opening was dropped.

Scripts and screenshots: `/Users/nakuliyer/portfolio/factory/out/audit6/verify.mjs`, `/Users/nakuliyer/portfolio/factory/out/audit6/shoot.mjs`, `/Users/nakuliyer/portfolio/factory/out/audit6/shots/`, `/Users/nakuliyer/portfolio/factory/out/audit6/usability.md`, `/Users/nakuliyer/portfolio/factory/out/audit6/crit.md`.

## Design

Phones means under 760px wide (where Work paging is already off). Desktop and tablet ≥ 760px stay exactly as they are: check with before and after screenshots at 1440 and 768.

- **A preview per item.** Each Work item on phones shows a still image of its app's first screen (cropped, about 200 to 260px tall, a real `<img>` with width and height and descriptive alt, lazy below the first item). Tapping the preview opens the demo, the same as the "Try the demo" button. No new script beyond what opens the demo today. Capture the stills from the real demos (Playwright, light theme) and commit them as WebP under `src/assets/work/`, served through `astro:assets`.
- **Details behind a toggle on phones.** "What I did", "Outcomes" and "Skills" collapse behind a "Details" disclosure on phones (a real `<details>`/`<summary>` or a button with `aria-expanded`; open by default ≥ 760px, unchanged there). Aim for about 420px per collapsed item at 375, title to button. The intro line and the role stay visible.
- **The button.** Keep one primary action per item. "Try the demo: …" must not wrap onto two lines at 320 (shorter visible text with the full name in the accessible name is fine, but the visible label must be part of the accessible name, WCAG 2.5.3).
- **Open on screen.** On phones, opening a demo scrolls so the demo itself (not the item title) sits just under the header, and focus moves as today. Under reduced motion the scroll is instant.
- **Scroll with the page.** On phones the airline and grocer apps grow to their content height: no inner scroller, the page scrolls, and the app's tab bar sticks to the bottom of the viewport while the app is on screen (`position: sticky` inside the app). Put these rules in one new `@media (max-width: 759.98px)` block at the end of each demo's CSS file; WO-041 and WO-042 edit the rest of those files in parallel, so stay out of everything above your block. The scheduler's horizontal grid scroller stays (it is the content), but nothing may trap vertical swipes.
- **Frames.** Below 480px drop the phone bezel (the screen keeps its radius and a 1px outline); below 600px drop the window dots.
- **Hide demo below too.** When a demo is open on phones, a second "Hide demo" control sits under it. Hiding returns focus to the item's toggle and scrolls the item title into view.
- **Early taps.** A tap inside a demo that lands before hydration is kept and replayed once the island hydrates, the same pending-tap treatment as `BillableMini.tsx` (WO-033).
- **Decisions.** Log the phone layout (preview, details toggle, no inner scroll) in `factory/decisions.md`, pending the owner's sign-off.

## Constraints

- Constitution Art. 12: tokens only, state parity, motion vocabulary. Art. 11: no em dashes in copy.
- Paging (`work-paging.ts`) stays off below 760px and on touch; don't change it.
- LCP < 2000ms and script ≤ 100KB; previews below the first item are lazy.
- WO-041 (airline and grocer internals), WO-042 (scheduler and pipeline internals), WO-043 (résumé) and WO-044 (nav, projects) run in parallel. Stay inside your touches list.

## Acceptance criteria

- [ ] At 375 × 812, each collapsed Work item is ≤ 480px tall and shows a preview image of its app [e2e:work phone items are short and show a preview]
- [ ] At 375 × 812 and 390 × 664, after opening Airline the app's top is within 8px under the header and at least 560px of the app (or the whole viewport below the header) is visible [e2e:work phone demo opens on screen]
- [ ] At 375 × 812, a 250px touch swipe starting on the open Airline or Grocer app scrolls the page by at least 200px [e2e:work phone swipe on a demo scrolls the page]
- [ ] On phones the open app's tab bar stays inside the viewport while the app is on screen [e2e:work phone demo tab bar sticks]
- [ ] A second "Hide demo" control follows an open demo on phones and returns focus to the item's toggle [e2e:work phone hide demo below]
- [ ] "Try the demo" fits on one line at 320 with the visible text inside its accessible name [e2e:work phone button fits at 320]
- [ ] No phone bezel below 480px and no window dots below 600px [e2e:demo-fit phone frames drop chrome]
- [ ] A tap inside a demo before hydration is applied after it [e2e:work phone early tap is kept]
- [ ] At 1440 and 768, Work looks and behaves as before (before and after screenshots in `factory/out/p13/work/`, paging tests still pass) [review]
- [ ] axe clean in light and dark at 375 and 1440; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off on the phone layout [owner]

## Out of scope

- The demos' internal behaviour, focus and controls (WO-041, WO-042).
- Dark versions of the airline and grocer apps (an owner decision, finding 18).

## Notes

- Gates: `PW_PORT=4420 npm run gates -- --quick` while working, the full gates before handing back. Use `astro preview --ignore-lock` if you need your own preview.
- Use the `ui-craft` skill and the `design-critic` agent on 375 and 320, light and dark, until findings are minor. Save screenshots to `factory/out/p13/work/` in the main checkout (`/Users/nakuliyer/portfolio`); factory/out is gitignored.
