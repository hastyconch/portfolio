---
id: WO-032
title: Hero and Work: the work on common laptops, quieter pillars, a tablet hero, phone demos that keep their caption and can close
phase: 11
gate: human
agent: builder
depends_on: [WO-028]
touches:
  - src/system/Hero.astro
  - src/system/Work.astro
  - tests/e2e/work.spec.ts
  - tests/e2e/gates.spec.ts (the hero tests only)
---

## Goal

These come from the fourth round of audits on the live site, after Phase 10 (`factory/out/audit4/`).

1. **P1: the work still isn't on the first screen of the most common laptops.**
   - The Work title sits at y = 817 at 1366 × 768 and y = 813 at 1280 × 800. At 1024 × 768, 17px of it shows.
   - The fold lands in the empty band of Work's 112 to 120px top padding (`--space-section`), so the page looks like it ends after the pillars.
   - At 1440 there's a 153px gap between the pillar rule (y = 668) and the Work title (821). There's also a second rule under the Work header at about y = 934.
   - After "See the work" at 1366, the Airline phone mock's tab bar is cut off.
2. **P1: the pillar row reads as a template.**
   - Three bold titles over three grey sentences between two rules is the classic landing-page value block (ui-craft anti-slop smell #3).
   - It sits right under the album cover, the site's strongest moment.
3. **P3: the tablet hero (760 to 999px) stacks a 470px sleeve above the name.**
   - At 800 × 1000 the name sits at y = 690, and Work starts at 1,277.
   - The 224px pillar columns wrap every title, leaving one word on the second line.
4. **P3: opened phone demos.**
   - The one-line task (`#…-try-d`) hides with the button. The Nurse scheduler demo is 1,281px tall and no longer says what to do.
   - The reveal only goes one way: there's no way to close a demo.
   - Back from a case study collapses every demo again (the scroll position is kept).
   - Screen readers hear two nested groups with nearly the same name: "Airline loyalty app demo" wrapping "Demo: airline loyalty app (mock data)" (Work.astro:218-220).
5. **P3: the skill tags still look like small buttons.** Each has a 1px hairline border and a 4px radius, the same shape as the Menu button.

## Design

- **The work on common laptops (≥ 760px).**
  - When Work follows the hero, its top padding drops to about `--space-7`, overriding `--space-section` for this section only, from inside Work.astro.
  - Remove the doubled rule under the Work header if it is redundant with the first engagement's rule.
  - Targets: the Work title's top is within the viewport at 1366 × 768 and 1280 × 800. At 1440 × 900, the first engagement's kicker (or title) is also within it.
  - The other sections keep the shared rhythm.
- **Quieter pillars.**
  - Keep the pillars' text as written (owner content in `profile.json`).
  - They stop reading as a feature grid:
    - no rules above and below the row;
    - no bold column headers.
  - Each pillar is one run of text at `--text-sm`: the title in `--ln-ink` at weight 600, then the body in `--ln-ink-2`. For example, the title as a run-in followed by a full stop, or an inline `dt`.
  - At ≥ 1000px they may stay three columns, or become one compact list under the hero links. Choose whichever keeps the Work target above and reads less like a template, and note why in the file header.
- **Tablet hero (760 to 999px).**
  - Either put the sleeve beside the notes from 760px, or cap the sleeve at about 300px wide when the hero is one column.
  - Target at 800 × 1000: the name is above y = 500, and no pillar title wraps to leave a single word.
- **Phone demos (< 760px) keep their caption and can close.**
  - When a demo opens, its one-line task stays visible as a caption above the demo.
  - The button becomes a toggle: "Hide demo" while open, with `aria-expanded` reflecting the state. Closing returns focus to the toggle and keeps the engagement's title on screen.
  - The demo stays mounted when hidden: hide it, don't unmount it.
  - Which demos are open is remembered for the page in `sessionStorage`. Back from a case study restores them, along with the scroll position. Restored demos hydrate as they come into view.
  - Only one group per demo in the accessibility tree. Drop the outer wrapper's `role` and `aria-label`, and focus the demo's own group, or keep the outer and drop the inner. Choose the one with fewer changes and keep the name "{name} demo".
  - Without JS, every demo shows as today.
- **Plain tags.** `.wk-badges li` loses its border and radius. The tags render as `--ln-ink-2` text separated by middots (CSS `::before`, `aria-hidden`), in the same list markup.

## Constraints

- Constitution Art. 12: tokens only, state parity, motion vocabulary. Art. 11: no em dashes.
- Work pane sizes and `demo-fit.spec.ts` don't change at desktop sizes. Collapsed demos must not hydrate.
- LCP < 2000ms on home. The hero is the LCP element.
- WO-031 (liner.css, demo focus CSS) and WO-033 (Nav, Projects, Music, SideHead, ProjectCard, CaseStudyLayout, Billable page) run in parallel. Stay out of their files.
- **Section headers.** WO-033 varies the Projects and Music headers. Work keeps the strong two-column header (SideHead `layout="aside"`). Don't change SideHead.

## Acceptance criteria

- [ ] At 1366 × 768 and 1280 × 800, the Work title's top is within the first viewport. At 1440 × 900, the first engagement's kicker is too [e2e:gates hero shows the work above the fold]
- [ ] At 375 × 812, the name, headline and Résumé link are in the first viewport [e2e:gates hero first screen on phones]
- [ ] The pillars have no border rules, and their titles have the same font size as their bodies [e2e:gates hero pillars are quiet]
- [ ] At 800 × 1000, the hero name's top is ≤ 500px [e2e:gates hero on tablets]
- [ ] On a phone, opening a demo shows its caption above it and turns the toggle into "Hide demo" with `aria-expanded="true"`. Closing hides the demo, focuses the toggle and keeps the title on screen. Back from a case study restores an open demo. Each demo has one group in the accessibility tree [e2e:work phone demos open, close and come back]
- [ ] `.wk-badges li` has no border and no border radius [e2e:work demo button and tags]
- [ ] The demo and fit tests still pass [e2e:demo-fit]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off, including the pillar treatment [owner]

## Out of scope

- Rewriting the hero copy or the pillars' text (owner content).
- Focus rings and band tokens (WO-031). Nav history for the hero links, section headers and cards (WO-033).

## Notes

- Run gates with `PW_PORT=4412 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence: `factory/out/audit4/` (`crit/hero-800.png`, `crit/hero-1024.png`, `usability/first.mjs`, `usability/d1366-see-work.png`, `v1.mjs`).
