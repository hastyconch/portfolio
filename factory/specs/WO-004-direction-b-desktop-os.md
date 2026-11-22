---
id: WO-004
title: Design direction B — Desktop OS
phase: 1
gate: human
agent: builder
depends_on: [WO-002]
touches:
  - src/directions/b/**
  - src/pages/lab/b/**
---

## Goal

Build design direction **B — Desktop OS** as a complete, polished lab site so the owner can judge
layout and interactivity at phone and desktop size and pick slots from it. Follow the slot
contract in `src/directions/README.md` exactly; all copy comes from `getSiteContent()`.

**Concept:** the portfolio _is_ an operating system. Desktop (≥1024px): a desktop with a dock/menubar; sections and projects open as draggable, focusable app windows (keyboard: windows open via buttons, Escape closes, focus returns; dragging is optional enhancement with a non-drag alternative per WCAG 2.5.7). Mobile: a phone home screen of app icons; tapping opens a full-screen app sheet with a back button. Still must render all section ids so deep links work (e.g. render sections as windows/sheets that are open when targeted, or as a scrollable fallback below). Playful but crisp: Inter + JetBrains Mono, soft glass, tasteful wallpaper gradient. Minimal JS via a small island or vanilla script.

This direction must look and feel **unmistakably different** from the other three
(Editorial, Desktop OS, Product Spec, Liner Notes). Aim for work a hiring manager arriving from
LinkedIn would call beautiful: deliberate type scale, generous rhythm, real hierarchy, no
template look.

## Acceptance criteria

- [ ] `/lab/b/` renders every slot with section ids hero, work, projects, music, resume, contact [e2e:route /lab/b/ renders without console errors or horizontal overflow]
- [ ] A case-study page exists for every project at `/lab/b/<slug>/` [links]
- [ ] Zero serious/critical axe violations on every b page, light and dark [axe]
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

- Run gates with `PW_PORT=4332 npm run gates -- --quick` (unique port so parallel builders don't collide).
- Run `npm ci` first if `node_modules` is missing in your worktree.
