---
id: WO-015
title: Work as locked-in panes, with skill badges that mean something
phase: 6
gate: human
agent: builder
depends_on: [WO-014]
touches:
  - src/system/Work.astro
  - src/system/DemoFrame.astro
  - src/system/tokens.css
  - src/system/liner.css
  - tests/e2e/work.spec.ts
---

## Goal

The owner's feedback on the Work section:

- **Panes that lock in.** Each engagement that has a demo should feel like one pane. When the
  visitor scrolls, the page settles on the next engagement instead of resting half-way between
  two. Use CSS scroll snapping:
  - `scroll-snap-type: y proximity` on the root;
  - `scroll-snap-align: start` on each demo engagement, with `scroll-margin-top` set to the
    sticky nav height;
  - each demo engagement laid out to fit one viewport (`min-height` / `max-height` around
    `100svh` minus the nav) at laptop sizes (1280×720 up to 1440×900).

  Use _proximity_, not _mandatory_: mandatory traps keyboard and assistive-tech users and breaks
  sections taller than the viewport. Turn snapping off below 760px wide (phones scroll
  naturally) and under `prefers-reduced-motion`. The "More client work" list and the other
  sections don't snap.

- **Skill badges.** The small skill list beside each engagement (Discovery, Requirements, Agile
  delivery, Loyalty…) reads as unimportant. Design distinct badges that look like they mean
  something:
  - a deliberate shape, weight and colour treatment, set apart from the body copy;
  - consistent with ui-craft `references/surfaces.md` (tags may use the full radius);
  - AA contrast in light and dark;
  - not the accent orange everywhere. A tinted neutral with an accent edge, or an icon-less
    "stamp", are fine directions.
- **One pane per engagement.** The demo frames must fit the pane. `DemoFrame` may scale its
  device to the available height (container queries or `max-height` + `aspect-ratio`). The
  healthcare scheduler and the TPM pipeline get compact layouts inside their own demo
  components (WO-016 compresses their internals). Here, give their frames a height budget
  (about 560–620px tall at 1440×900).

## Acceptance criteria

- [ ] At 1440×900 each demo engagement (title, meta, story, demo) fits in one viewport below the nav [e2e:work engagements fit one viewport at 1440x900]
- [ ] Scroll snapping is proximity, on demo engagements only, off below 760px and under reduced motion [e2e:work snap is proximity and off under reduced motion]
- [ ] Skill badges are visually distinct, AA in light and dark, and keyboard-irrelevant (not focusable) [axe]
- [ ] `npm run craft` stays within budget [check]
- [ ] Lighthouse budgets met on `/` [lighthouse]
- [ ] Owner sign-off on the preview [owner]

## Out of scope

- Demo internals (`src/demos/**`, WO-016), projects (WO-017), music (WO-018).

## Notes

- Read the ui-craft skill (`~/.claude/skills/ui-craft/`) first.
- Run gates with `PW_PORT=4381 npm run gates -- --quick`.
