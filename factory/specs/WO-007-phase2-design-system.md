---
id: WO-007
title: Build the chosen design system and retire the lab
phase: 2
gate: human
agent: builder
depends_on: [WO-002, WO-003, WO-006]
touches:
  - src/system/**
  - src/pages/**
  - src/directions/**
  - lighthouserc.cjs
  - factory/picks.yaml
---

## Goal

Turn the owner's Phase 1 picks (`factory/picks.yaml`) into the real site. Direction D (Liner
Notes) becomes `src/system/` and supplies the look, nav, hero, demo frame, projects, case
studies, music and résumé. The Work section takes direction A's organisation: every engagement
open, with a sector / when / role column beside the story, and the live demo inline beside its
engagement (D's frame) so visitors don't scroll past text to reach it. Motion is calm: one-shot
entrances only, no looping animation. The home moves to `/`, case studies to
`/projects/<slug>/`, and `/lab` plus the four directions are removed.

## Acceptance criteria

- [ ] `/` renders hero, work, projects, music, resume and contact sections [e2e:route / renders without console errors or horizontal overflow]
- [ ] A case-study page exists at `/projects/<slug>/` for every project; no links point at `/lab` [links]
- [ ] Zero serious/critical axe violations on every page, light and dark [axe]
- [ ] Skip link is the first tab stop with a visible focus ring [e2e:keyboard: skip link is first tab stop and focus is visible]
- [ ] No animation longer than 0.01s under reduced motion, and no infinite animation otherwise [e2e:reduced motion: no running animations longer than 0.01s]
- [ ] Lighthouse budgets met on every page, with SEO on (pages are indexable except 404) [lighthouse]
- [ ] Work follows A's organisation in D's style; the airline demo sits inline beside its engagement at 1440 and directly after its summary at 375 [review]
- [ ] Owner signs off on the system at phone and desktop size [owner]

## Out of scope

- New demos (Phase 3), real music content (Phase 4), toning down the record wording (noted follow-up).
- Changes to content collections, the Base layout or the airline demo.

## Notes

Picks: `factory/picks.yaml`. Source directions: `src/directions/d` (system) and `src/directions/a/Work.astro` (Work organisation).
