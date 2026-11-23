---
id: WO-025
title: Demos and Work: no scroll trap over the demos, a demo button that looks like one, quieter tags
phase: 9
gate: human
agent: builder
depends_on: [WO-023, WO-024]
touches:
  - src/system/DemoFrame.astro
  - src/system/Work.astro
  - src/demos/** (landmarks, and Billable's pause and hit blink only)
  - tests/e2e/work.spec.ts
  - tests/e2e/demo-*.spec.ts
---

## Goal

These come from the second round of audits on the live site, after Phase 8.

1. **P1: scrolling stops over the Scheduler and Pipeline demos.**
   - `.df-screen` in the desktop and diagram frames has `overflow: auto` plus `overscroll-behavior: contain` (DemoFrame.astro:213-214). The content overflows by only 1 to 3px (scheduler: 523 vs 520).
   - So with the pointer over the demo, the wheel scrolls the frame 3px and then stops: 20 notches moved the page 0px.
   - On a phone, a swipe over an expanded Scheduler or Pipeline moves the page 0px, and Scheduler (1,219px) is taller than the screen.
2. **P2: the accent edge is on every skill tag** (`.wk-badges li`, a 3px accent left border). The new phone "Try the demo" cards use the same edge, so the one tappable thing reads like a tag.
3. **P3: "Try the demo" has two problems.**
   - Tapping it jumps the page 175 to 228px, because `focus()` scrolls, and the engagement title goes off-screen.
   - Its accessible name is one run-on string ("Try the demo Grocer loyalty app Load offers, build a list, earn points.").
4. **P3: the home page has about 19 named regions.** 16 come from labelled `<section>`s inside the demos, and 3 more from the `.wk-demo` wrappers (`role="region"` at every width).
5. **P3: Billable has two problems.**
   - It keeps playing after keyboard focus leaves the game.
   - Its hit-invulnerability blink flips every 60ms (about 8 Hz, `src/demos/billable/game/entities/Player.ts:321-322`).
6. **P3: there is about 220px of empty space after "More client work" at 1440,** and a doubled top rule there (the section rule plus the grid rule).

## Design

- **No scroll trap.**
  - Drop `overscroll-behavior: contain` from `.df-screen`, or limit it to `overscroll-behavior-x`.
  - Remove the stray 1 to 3px overflow, so a demo that fits doesn't scroll at all: find the cause, or `overflow: clip` when the content fits. Demos that really are taller than their frame may still scroll inside it, then hand the wheel back to the page at the end.
  - Check every desktop and diagram demo: scheduler, pipeline, and any other using those frames.
- **Tags are quiet, the demo button is a button.**
  - `.wk-badges li` gets a neutral hairline border (the existing line or rule token) and no accent edge.
  - The phone "Try the demo" control looks like a button, not a card with an accent edge: a filled or outlined button with the demo's name, the one line beneath, a ≥ 44px target, and hover / focus-visible / active parity.
  - Keep "Try the demo" as the visible label. Drop the "↓", which reads as a jump link.
- **No jump.**
  - On activation, `focus({ preventScroll: true })` on the revealed demo.
  - Then scroll so the engagement's head (kicker, title) sits flush under the header. Use instant scrolling under reduced motion and smooth scrolling otherwise.
- **Name.**
  - The button's accessible name is "Try the demo: {name}". The one line goes in `aria-describedby`.
  - The revealed wrapper is `role="group"` with that label, not a region. At ≥ 760px, where there is no button, the wrapper has no role and no label.
- **Landmarks.** Inside the demos, a `<section>` with `aria-label` or `aria-labelledby` becomes a `<div>`. Use `role="group"` where the grouping helps, so the demos add no `region` landmarks. Keep the visible headings. The home page ends with no `region` landmarks from demos.
- **Billable.**
  - Pause when focus leaves the game, meaning `.bm` and its controls, not the on-screen pad or the Pause button. Do this the same way Esc pauses, focusing Resume only if focus is still inside.
  - The hit blink uses the steady fade from the reduced-motion path at every setting, or blinks at ≤ 3 Hz.
- **Spacing.**
  - Tighten the space after "More client work" to the section rhythm (`--space-section` or less), not double padding.
  - Remove the doubled rule.

## Constraints

- Constitution Art. 12: tokens only, state parity, the motion vocabulary. Art. 11: no em dashes.
- Work pane sizes and `demo-fit.spec.ts` don't change at desktop sizes.
- WO-026 (Music, Players, Hero, Resume) and WO-027 (Nav, ProjectCard, Projects, SideHead, Footer, CaseStudyLayout, 404, liner.css) run in parallel. Stay out of their files.

## Acceptance criteria

- [ ] At 1440 × 900, with the pointer over the Scheduler and over the Pipeline demo, 10 wheel notches of 100px move the page at least 800px [e2e:work wheel passes over demos]
- [ ] At 375 × 812 (touch), after expanding Scheduler, a swipe over it moves the page [e2e:work swipe passes over demos]
- [ ] `.wk-badges li` has no accent-coloured border. The phone demo button's name is "Try the demo: {name}", with the line as its description [e2e:work demo button and tags]
- [ ] Activating "Try the demo" leaves the engagement's title in the viewport and focus in the demo [e2e:work phone demos expand on demand]
- [ ] Home has no `region` landmarks inside `.wk-demo` at 375 or 1440 [e2e:work demos add no landmarks]
- [ ] Billable pauses when focus tabs out of the game; the hit blink is not a fast flip [e2e:demo-billable pauses when focus leaves]
- [ ] The demo and fit tests still pass [e2e:demo-fit]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- Music, Players, Hero and the résumé (WO-026). Nav, cards, section headers and small alignments (WO-027).
- New demo features.

## Notes

- Run gates with `PW_PORT=4396 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence (gitignored, main checkout): `factory/out/audit2/usability/trap2.mjs`,
  `touchtrap3.mjs`, `factory/out/audit2/trapcheck.mjs`, `factory/out/audit2/a11y/`.
