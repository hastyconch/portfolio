---
id: WO-028
title: First screen and phone Work: the work shows above the fold, a shorter phone home, a demo button that reads as one
phase: 10
gate: human
agent: builder
depends_on: [WO-025, WO-026]
touches:
  - src/system/Hero.astro
  - src/system/Work.astro
  - src/demos/pipeline/PipelineDemo.tsx (the Back button's name only)
  - tests/e2e/work.spec.ts
  - tests/e2e/gates.spec.ts (the "hero first screen on phones" test, and a new hero test, only)
  - tests/e2e/demo-*.spec.ts (only to expand a collapsed demo first on phones)
---

## Goal

These come from the third round of audits on the live site, after Phase 9 (`factory/out/audit3/`).

1. **P1: on a laptop, the first screen never shows the work.**
   - At 1440 × 900 the hero runs to about y = 818 and the Work title starts at y = 938, below the fold.
   - The first 900px hold only the record sleeve, the bio and the three stacked `.hero-facts` items. The playable demos are what sets the site apart, and a hiring manager deciding in 30 seconds never sees one.
2. **P2: the phone home is still long.**
   - At 375 × 812 the page is 12,241px, and Projects starts at 6,346px, about 7.8 screens down.
   - Work alone is 5,180px. The first engagement (Airline) is 1,472px because its 687px demo shows inline.
3. **P2: on phones, the demo button looks like a text field, and the tags look like buttons.**
   - `.wk-try-b` is a transparent outline with left-aligned text.
   - The `.wk-badges li` tags beside it are filled (`--ln-badge`) and bold (600).
4. **P3: the Pipeline demo's Back button is named " Back",** with a leading space (PipelineDemo.tsx:561).

## Design

- **The work above the fold (≥ 760px).**
  - At 1440 × 900, the Work section's title must be in the first viewport. At 1366 × 768, the name, headline and hero links must stay in the first viewport.
  - Get there by layout, not by cutting copy:
    - tighten the hero's bottom padding (`.hero` is `padding-block: var(--space-7) var(--space-8)`);
    - present `.hero-facts` more compactly. For example, put the three pillars in a row of three columns under the hero grid, spanning both columns, with smaller vertical padding.
  - Choose whichever reads better and note why in the file header.
  - Keep the cover, its size at ≥ 760px, and the single display moment (the name).
  - The pillars' text is owner content in `profile.json`. Do not rewrite it.
- **A shorter phone home (< 760px).**
  - The first engagement (Airline) also goes behind a "Try the demo" button, so on phones every demo is collapsed. The button and the reveal work as they do for engagements 2 to 4.
  - Update the Work.astro header comment and the tests that expect the first demo inline.
  - Target: at 375 × 812, Projects starts at ≤ 5,700px.
  - Without JS, every demo shows, as today.
- **The demo button reads as a button.**
  - `.wk-try-b` gets the accent fill with on-accent text, and a centred label: "Try the demo: {name}", plus a trailing "▸" with `aria-hidden`.
  - The one-line description stays beneath the button, outside it. Its name still comes from `aria-describedby`.
  - Hover, focus-visible and active parity, using the existing motion tokens. ≥ 44px target. Contrast ≥ 4.5:1 in light and dark.
- **Tags are plain.**
  - `.wk-badges li` drops the `--ln-badge` fill and goes to weight 500, keeping its hairline.
  - The tags must not look tappable: no fill, no hover state.
- **Pipeline Back.** Its accessible name is "Back", with no leading space. Keep the visible ← arrow, `aria-hidden`.

## Constraints

- Constitution Art. 12: tokens only, state parity, motion vocabulary. Art. 11: no em dashes.
- Work pane sizes and `demo-fit.spec.ts` don't change at desktop sizes. Collapsed demos must not hydrate.
- LCP < 2000ms and the script budget hold. The hero is the LCP element on home, so check it.
- WO-029 (Nav, Base, Projects, ProjectCard, CaseStudyLayout, billable.astro) and WO-030 (Music, Players, Lyrics, the song page, Resume, the PDF) run in parallel. Stay out of their files. In `gates.spec.ts`, change only the hero tests; WO-030 owns the résumé PDF test.

## Acceptance criteria

- [ ] At 1440 × 900, the top of the Work section's title is within the first viewport. At 1366 × 768, the name, headline and hero links are within it [e2e:gates hero shows the work above the fold]
- [ ] At 375 × 812, the name, headline and Résumé link are in the first viewport [e2e:gates hero first screen on phones]
- [ ] At 375 × 812, Projects' top is ≤ 5,700px. All four demos are collapsed behind "Try the demo"; expanding one mounts it and focuses it without moving the engagement's title off-screen [e2e:work phone demos expand on demand]
- [ ] The phone demo button has a filled background, a centred label, and the name "Try the demo: {name}". `.wk-badges li` has a transparent background and weight ≤ 500 [e2e:work demo button and tags]
- [ ] The Pipeline Back button's accessible name is exactly "Back" [e2e:demo-pipeline]
- [ ] The demo and fit tests still pass [e2e:demo-fit]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off, including the hero layout [owner]

## Out of scope

- Rewriting the hero copy or the pillars (owner content).
- Nav, deep links, Billable loading and cards (WO-029). Music and the résumé (WO-030).

## Notes

- Run gates with `PW_PORT=4401 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence: `factory/out/audit3/` (`crit/`, `usability/try2.mjs`, `verify.mjs`).
