---
id: WO-009
title: Grocer loyalty phone demo
phase: 3
gate: human
agent: builder
depends_on: [WO-007]
touches:
  - src/demos/grocer/**
  - src/pages/demos/grocer.astro
  - tests/e2e/demo-grocer.spec.ts
---

## Goal

An interactive, anonymized phone demo for the "Grocer loyalty & digital experience" engagement
(`src/content/work/02-grocer-loyalty.md`). A signed-in member of an **invented** grocer whose
loyalty account is **already linked**. Four tabs:

- **Home:** points balance and progress to the next reward.
- **Offers:** personalized offers to load. Example: "Buy any cereal, +50 pts". Loading one updates the state and is announced.
- **Lists:** a shopping list where you tick items off, with items that match an offer flagged.
- **Recipes:** a recipe card whose "Add ingredients to list" button adds to the list.

Mirror the structure and quality of `src/demos/airline/AirlineDemo.tsx`. That means a React
component and its own CSS, mock data only, a tablist driven by the arrow keys, and an
`aria-live` region for state changes. Use your own invented brand and palette: no real grocer's
name, logo or brand colours.

## Acceptance criteria

- [ ] `src/demos/grocer/GrocerDemo.tsx` (default export) + `grocer.css`; fills its parent's height like the airline demo does inside a 336×630 phone screen [review]
- [ ] Harness page `/demos/grocer/` (`<Base noindex>`) shows the demo in a 336×630 box [e2e:route /demos/grocer/ renders without console errors or horizontal overflow]
- [ ] Tabs, offers, list ticks and recipe → list all work by keyboard alone, with visible focus [e2e:grocer demo is keyboard operable]
- [ ] Zero serious/critical axe violations in light and dark [axe]
- [ ] Component + CSS add ≤ 15 KB gzipped of JS over the airline demo's React runtime [review]
- [ ] Mock data only; invented brand; no real retailer names [anonymize]

## Out of scope

- Placing the demo on the home page (integration does that), and edits outside `touches`.

## Notes

- Run gates with `PW_PORT=4341 npm run gates -- --quick`.
- Run `npm ci` first if `node_modules` is missing.
