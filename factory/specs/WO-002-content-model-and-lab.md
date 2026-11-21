---
id: WO-002
title: Shared content model, airline demo and /lab gallery
phase: 1
gate: auto
agent: builder
depends_on: [WO-001]
touches:
  - src/content.config.ts
  - src/content/**
  - src/lib/**
  - src/layouts/Base.astro
  - src/demos/airline/**
  - src/pages/lab/index.astro
  - src/directions/README.md
  - src/pages/index.astro
  - src/pages/404.astro
  - playwright.config.ts
  - package.json
---

## Goal

Give the four design directions one shared foundation: typed content collections seeded with
real (anonymized) copy and marked placeholders, a neutral Base layout, the anonymized airline
phone demo, the slot contract, and the `/lab` gallery + pick sheet that produces `picks.yaml`.

## Acceptance criteria

- [x] Content collections validate against their Zod schemas [check]
- [x] `/lab/` renders the comparison gallery and pick sheet without errors [e2e:route /lab/ renders without console errors or horizontal overflow]
- [x] `/lab/` has no serious/critical axe violations, light and dark [axe]
- [x] No client names in content or demo [anonymize]
- [x] Slot contract documented for builders [review]

## Out of scope

- The four directions themselves (WO-003 … WO-006).
