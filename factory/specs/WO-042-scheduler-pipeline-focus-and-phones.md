---
id: WO-042
title: Scheduler and pipeline on phones: focus that never hides, no page jumps, and a main button that stays put
phase: 13
gate: human
agent: builder
depends_on: [WO-037]
touches:
  - src/demos/scheduler/SchedulerDemo.tsx
  - src/demos/scheduler/scheduler.css (not the phone block at the end, which is WO-040's)
  - src/demos/pipeline/PipelineDemo.tsx
  - src/demos/pipeline/pipeline.css (not the phone block at the end, which is WO-040's)
  - tests/e2e/demo-scheduler.spec.ts
  - tests/e2e/demo-pipeline.spec.ts
---

## Goal

The mobile audit of Phase 12 (`/Users/nakuliyer/portfolio/factory/out/audit6/mobile-report.md`, findings 3, 5, 13, 14, 15 and 21 for these two demos):

- **Scheduler focus hides behind the sticky name column (WCAG 2.4.11).** Moving left with the arrow keys at 375 puts "Renee, Tuesday" fully under the 120px column (80 of 80px hidden), and Thursday 74 of 80px.
- **"Assign" jumps the page 611px up:** focus moves to a grid cell without `preventScroll`.
- **Scheduler on phones:** the name column takes 38% of the width (about 2.4 days show at 375, 1.5 at 320); "Under by 1" touches its cell border; tapping a cell before the open shift is filled gives no visible feedback; the copy says "Arrow keys move…" on a touch screen.
- **Targets:** Scheduler Assign 32px and "Rules checked" 28px; Pipeline buttons 40px and one citation link 22px.
- **The pipeline's main button moves between steps:** its y is 348, 324, 308, 276, 343 and 437, so a thumb that stays put misses it.
- **Pipeline Play still plays under reduced motion** (it can be paused).

## Design

- **Focus never hides.** Give the grid scroller `scroll-padding-inline-start` equal to the sticky column's width plus a small margin, and make sure keyboard moves scroll the focused cell fully into view (adjust `scrollLeft` if the browser's own scroll leaves it covered).
- **No page jumps.** Every programmatic focus uses `{ preventScroll: true }` and then scrolls only the grid, and only if the target is out of view.
- **Scheduler at phone widths.** Name and hours on one line in a narrower column (about 88 to 96px at 375), the grid snaps to day columns, "Under by 1" gets its padding, a tap on a cell that can't take the shift yet shows the hint as visible text, and on touch the instructions talk about tapping, not arrow keys (keep the keyboard copy for fine pointers or keep both, short).
- **Pipeline's action row stays put.** Pin the step actions to the bottom of the pane so the main button keeps the same y across steps.
- **Targets.** On coarse pointers every control in both demos has a hit area ≥ 44px tall; the citation link ≥ 24px with spacing.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, Play steps without animation (or advances one step per press); it never auto-animates.

## Constraints

- Keep the Phase 12 look (WO-037). WO-040 adds a phone block at the end of each CSS file and owns the frame (window dots, bezel); don't change the app's height or the frame.
- Constitution Art. 11 and 12. No new dependencies.

## Acceptance criteria

- [ ] At 375, arrow-left and arrow-right through every day keep the focused cell fully clear of the sticky column [e2e:scheduler focus never hides under the name column]
- [ ] "Assign" and every other programmatic focus move the page by at most 40px [e2e:scheduler assign keeps the page still]
- [ ] At 375, at least 3 day columns show beside the name column; at 320, at least 2 [e2e:scheduler shows more days on phones]
- [ ] A tap on a cell that can't take the shift shows visible hint text; on touch the instructions mention tapping [e2e:scheduler touch feedback and copy]
- [ ] The pipeline's main button keeps the same y (± 4px) across all steps at 375 and 1440 [e2e:pipeline main button stays put]
- [ ] On a coarse pointer at 375, every button in both demos has a hit area ≥ 44px tall [e2e:scheduler targets fit a thumb] [e2e:pipeline targets fit a thumb]
- [ ] Under reduced motion, Play never auto-animates [e2e:pipeline play respects reduced motion]
- [ ] Design-critic pass at 375 and 320, light and dark: nothing above minor [review]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]

## Out of scope

- The frame and the app's height on phones (WO-040).

## Notes

- Gates: `PW_PORT=4422 npm run gates -- --quick`, the full gates before handing back. Screenshots to `/Users/nakuliyer/portfolio/factory/out/p13/scheduler-pipeline/`.
