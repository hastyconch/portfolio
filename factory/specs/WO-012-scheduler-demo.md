---
id: WO-012
title: Nurse scheduler desktop demo (grid + guided fill)
phase: 3
gate: human
agent: builder
depends_on: [WO-007]
touches:
  - src/demos/scheduler/**
  - src/pages/demos/scheduler.astro
  - tests/e2e/demo-scheduler.spec.ts
---

## Goal

An interactive desktop demo for the "Healthcare workforce management" engagement
(`src/content/work/05-healthcare-wfm.md`). The owner chose to **combine** the two wireframe
concepts (decision log, 2026-11-22):

- **A — the grid:** one week for an invented ICU unit. About 6 invented nurses as rows and 7 days as columns. Each cell is Day (07–19), Night (19–07) or Off. A coverage row shows Day and Night staffing against targets, and a live rule checker flags violations on the cells and in a summary.
- **B — the guided task, inside that grid:** the demo opens with one open shift highlighted ("Sat night, ICU — 3 of 4 RNs"). A side panel ranks candidates, and every rule is explained in plain words:
  - Eligible.
  - Overtime: goes to 44h.
  - Blocked: 4th night in a row.
  - Blocked: approved leave.

  Assigning one updates the grid, the coverage and the rule summary, and announces the change.

- After the guided task, the visitor can edit any cell freely (cycle Day → Night → Off), and the rules recheck live. A **Reset** button restores the scenario.

**Rules to model:**

- 12h rest between shifts (Night followed by Day is a violation).
- Max 3 nights in a row.
- Overtime past 40h a week (12h shifts).
- Approved leave.
- Day and Night coverage targets.

Everything is invented: unit, names and rules wording. No real hospital, union or vendor names.

## Acceptance criteria

- [ ] `src/demos/scheduler/SchedulerDemo.tsx` (default export) + `scheduler.css`; designed for a desktop window ≥ 720px and still usable (scrolling inside its own grid region, no page overflow) at 360px [review]
- [ ] Harness page `/demos/scheduler/` (`<Base noindex>`) shows it full width and in a 360px column [e2e:route /demos/scheduler/ renders without console errors or horizontal overflow]
- [ ] Grid is a keyboard-navigable grid (arrow keys move, Enter/Space cycles a cell; roving tabindex) with cell states exposed to assistive tech, not by colour alone [e2e:scheduler grid is keyboard operable]
- [ ] Guided fill: ranking + reasons shown; assigning an eligible nurse covers the shift and is announced via `aria-live`; blocked nurses cannot be assigned and say why [e2e:scheduler guided fill covers the open shift]
- [ ] Zero serious/critical axe violations in light and dark [axe]
- [ ] Mock data only; invented names [anonymize]

## Out of scope

- Placing it on the home page (integration does that), multi-week views, edits outside `touches`.

## Notes

- Wireframe the owner reviewed: concept A (grid + rule checker) and B (fill the open shift), combined.
- Run gates with `PW_PORT=4344 npm run gates -- --quick`. Run `npm ci` first if `node_modules` is missing.
