---
id: WO-021
title: Taste pass: a copy-tells gate, no scroll fade-ins, Projects as one pane, flagged copy fixed
phase: 7
gate: human
agent: builder
depends_on: [WO-019]
touches:
  - factory/stations/tastelint.mjs (vendored from taste-skill, MIT)
  - factory/stations/gates.sh
  - .github/workflows/gates.yml
  - package.json (script)
  - factory/constitution.md (Art. 11 names the new check)
  - factory/decisions.md
  - src/system/tokens.css (remove the scroll reveal)
  - src/system/Work.astro, src/system/Projects.astro, src/system/Resume.astro, src/system/CaseStudyLayout.astro (drop `reveal` classes; Projects pane)
  - src/system/liner.css (Projects snap point)
  - src/content/** (copy fixes only)
  - src/demos/scheduler/**, src/demos/pipeline/**, src/demos/grocer/GrocerDemo.tsx (names and words)
  - tests/e2e/demo-scheduler.spec.ts, tests/e2e/demo-fit.spec.ts, tests/e2e/demo-pipeline.spec.ts, tests/e2e/craft.spec.ts, tests/e2e/projects.spec.ts
---

## Goal

The owner asked to bring the useful parts of the taste-skill (Leonxlnx/taste-skill, MIT) into this
phase. These are the parts judged to fit (see the Phase 7 discussion):

1. **A copy-tells gate.** Vendor taste-skill's `scripts/copy-lint.mjs` as
   `factory/stations/tastelint.mjs`, with a header naming the version and the licence, like
   craftaudit. Run it over every built page in `dist/`.
   - Its FAILs (chatbot residue, the old slop words and stock phrases) block the gate.
   - WARN and INFO are printed but don't block, because some are false positives here: for
     example, the scheduler legend's "!" glyph.
2. **No fade-ins on scroll.** taste-skill lists "a card, row or tile that fades in on scroll; a
   fade-in on every section" as a top tell. Remove the `.reveal` scroll animation and the
   classes.
   - The hero entrance, the Music vinyl, the scroll progress bar and the Work pane snap stay:
     they are the page's moments.
3. **Projects as one pane.** "One section per screen": on laptops (≥ 1100 × 600, motion
   allowed), the Projects section takes one viewport below the nav, heading and rail together,
   and the page snaps to it like a Work pane.
   - It stays a flowing section on phones and short windows.
4. **Fix the flagged copy:**
   - "intricate" (healthcare work), "as an AI-enabled product manager" (AI SDLC work);
   - "unlock" (scheduler help, the Felt & Tiles gallery, the grocer reward line);
   - "since 2019" said twice on the home page;
   - the default-cast mock names: Priya and Ines in the scheduler, Maya and Ines in the pipeline.
     Rename them to names that fit the mock's locale and are not on the linter's cast list.
     Update the tests that name them.

## Acceptance criteria

- [ ] `npm run tastelint` runs on every dist page and exits 0, with no FAIL on any page [check]
- [ ] No element on any page runs a scroll-linked fade (no `animation-timeline: view()` outside the Work pane machinery, no `.reveal`) [e2e:craft no scroll fade-ins]
- [ ] At 1440 × 900, Projects' heading and its first row of cards are in one viewport after a jump to `#projects` [e2e:projects projects is one pane]
- [ ] The scheduler and pipeline tests pass with the new names; the demo-fit tests still pass [e2e:demo-scheduler]
- [ ] axe clean; Lighthouse budgets on every page [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- The taste-skill's photo, icon, palette and "dealt" machinery; it is built for company marketing sites.
- Captions on demos ("Playable. Invented brand, mock data."): kept on purpose, for honesty.
