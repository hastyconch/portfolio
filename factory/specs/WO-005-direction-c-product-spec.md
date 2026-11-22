---
id: WO-005
title: Design direction C — Product Spec
phase: 1
gate: human
agent: builder
depends_on: [WO-002]
touches:
  - src/directions/c/**
  - src/pages/lab/c/**
---

## Goal

Build design direction **C — Product Spec** as a complete, polished lab site so the owner can judge
layout and interactivity at phone and desktop size and pick slots from it. Follow the slot
contract in `src/directions/README.md` exactly; all copy comes from `getSiteContent()`.

**Concept:** PM-native. The site reads like a beautifully designed product workspace: work and projects as tickets/cards with status pills (Shipped, In progress, Placeholder), sector and skill tags, metrics; expandable spec drawers (native <details> or accessible disclosure) for contributions and stack; a roadmap/timeline view for the résumé; the case-study page is a crisp PRD (Problem → Features → Roadmap → Architecture table → Engineering notes). IBM Plex Sans + IBM Plex Mono. Desktop: dense, well-aligned dashboard grid with a left rail nav. Mobile: swipeable/stacked cards, sticky section tabs. Calm, precise, high information density without clutter.

This direction must look and feel **unmistakably different** from the other three
(Editorial, Desktop OS, Product Spec, Liner Notes). Aim for work a hiring manager arriving from
LinkedIn would call beautiful: deliberate type scale, generous rhythm, real hierarchy, no
template look.

## Acceptance criteria

- [ ] `/lab/c/` renders every slot with section ids hero, work, projects, music, resume, contact [e2e:route /lab/c/ renders without console errors or horizontal overflow]
- [ ] A case-study page exists for every project at `/lab/c/<slug>/` [links]
- [ ] Zero serious/critical axe violations on every c page, light and dark [axe]
- [ ] Skip link is first tab stop; nav, lyric annotations and demo are keyboard operable [e2e:keyboard: skip link is first tab stop and focus is visible]
- [ ] No animation longer than 0.01s under reduced motion [e2e:reduced motion: no running animations longer than 0.01s]
- [ ] Airline demo is embedded via `<AirlineDemo client:visible />` inside this direction's DemoFrame [review]
- [ ] Lyrics annotator works (select a line with a note → annotation shown, focus managed) [review]
- [ ] Spotify/YouTube only as click-to-load placeholders; no third-party requests on load [review]
- [ ] Placeholder content visibly marked; `planned` items labelled as roadmap [review]
- [ ] Distinct from other directions and visually polished at 375 and 1440 [owner]

## Out of scope

- Editing anything outside `touches` (shared content, Base layout, demos, configs, package.json).
- Other demos beyond the airline phone demo (Phase 3).
- Real lyrics, album art or links (owner input pending).

## Notes

- Run gates with `PW_PORT=4333 npm run gates -- --quick` (unique port so parallel builders don't collide).
- Run `npm ci` first if `node_modules` is missing in your worktree.
