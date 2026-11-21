---
id: WO-006
title: Design direction D — Liner Notes
phase: 1
gate: human
agent: builder
depends_on: [WO-002]
touches:
  - src/directions/d/**
  - src/pages/lab/d/**
---

## Goal

Build design direction **D — Liner Notes** as a complete, polished lab site so the owner can judge
layout and interactivity at phone and desktop size and pick slots from it. Follow the slot
contract in `src/directions/README.md` exactly; all copy comes from `getSiteContent()`.

**Concept:** a record sleeve. Dark by default (support light mode too). The home is an album: Side A — Professional, Side B — Personal projects, Bonus Tracks — Music; sections are 'tracks' with numbering and durations-as-years. Bricolage Grotesque for display, DM Sans for body. Large gradient 'album art' tiles (use artColors for songs, project accent for projects). Desktop: horizontal track rail for projects, liner-notes typography for case studies (credits-style stack list). Mobile: vertical tracklist with a mini 'now playing' style header. Music section is the star here; lyrics annotator styled like Genius. Expressive but legible.

This direction must look and feel **unmistakably different** from the other three
(Editorial, Desktop OS, Product Spec, Liner Notes). Aim for work a hiring manager arriving from
LinkedIn would call beautiful: deliberate type scale, generous rhythm, real hierarchy, no
template look.

## Acceptance criteria

- [ ] `/lab/d/` renders every slot with section ids hero, work, projects, music, resume, contact [e2e:route /lab/d/ renders without console errors or horizontal overflow]
- [ ] A case-study page exists for every project at `/lab/d/<slug>/` [links]
- [ ] Zero serious/critical axe violations on every d page, light and dark [axe]
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

- Run gates with `PW_PORT=4334 npm run gates -- --quick` (unique port so parallel builders don't collide).
- Run `npm ci` first if `node_modules` is missing in your worktree.
