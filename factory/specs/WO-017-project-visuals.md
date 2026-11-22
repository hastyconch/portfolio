---
id: WO-017
title: Real visuals for every project (screenshots + designed tiles)
phase: 6
gate: human
agent: builder
depends_on: [WO-014]
touches:
  - src/system/ProjectCard.astro
  - src/system/Projects.astro
  - src/system/CaseStudyLayout.astro
  - src/content/projects/**
  - src/content.config.ts
  - src/assets/projects/**
  - tests/e2e/projects.spec.ts
---

## Goal

The flat colour tiles are "extremely boring". Each project should show **what the app actually
looks like**: on its card, and as a screenshot gallery in its case study.

**Sources (owner decision):**

- **Run locally and screenshot, on demo or public data only:**
  - **Box Scores:** `gh repo clone hastyconch/box-scores`. It's public and uses the public ESPN
    API.
  - **Felt & Tiles:** `hastyconch/felt-and-tiles`. Use `wrangler dev` with a local D1, or
    whatever runs without secrets; play as a guest.
  - **Billable.:** `~/corporate-video-game`. Read-only: build or run it from a copy in the
    scratchpad, never modify the original.
  - **Fashion Companion:** `hastyconch/fashion-companion`, public. Only if it renders
    meaningful screens without Supabase keys, for example via its own mock or seed mode.
    Otherwise treat it as owner-supplied.
- **TCG Companion:** no code is available. Design a faithful mock of its main screens (price
  comparison, deal alerts, collection) as static images built from HTML/CSS with invented data.
  Label them "Mock-up" in their caption.
- **Owner-supplied** (travel planner, parking registrar, and fashion if it can't run): create
  the gallery slots and the content structure, show a designed "Screenshots coming" state that
  doesn't look broken, and document the exact files and sizes the owner should drop into
  `src/assets/projects/<slug>/` (for example `01-home.png`, phone or desktop).

Clone into the session scratchpad, never into this repo. Never commit secrets, real personal
data or real names. Screenshots must only show demo or invented data, and must pass
`npm run anonymize` (no metadata; convert to WebP with sharp).

## Design

- **Cards:** each project card shows a cropped real screen in a device-appropriate frame
  (phone, browser or game) instead of a colour swatch. Each tile gets its own subtle, distinct
  backdrop drawn from the app's palette, not a uniform style.
- **Case studies:** a hero image of the app, plus a gallery of 3–5 screens with captions. Reuse
  the existing `gallery` field in `src/content.config.ts`; the "This portfolio" project already
  uses it. Images are responsive and lazy below the fold. LCP < 2s.
- Follow the ui-craft skill (`~/.claude/skills/ui-craft/`, `references/surfaces.md`): images
  get 1px outlines and concentric radii.

## Acceptance criteria

- [ ] Every project card shows a real screen or (TCG) a labelled mock-up, not a colour swatch [review]
- [ ] Box Scores, Felt & Tiles and Billable case studies have galleries of real screens [e2e:projects show real screens]
- [ ] Owner-supplied projects show a designed pending state and the drop-in instructions live in `src/assets/projects/README.md` [review]
- [ ] No secrets, personal data or metadata in images [anonymize]
- [ ] Lighthouse budgets on every case study and `/` [lighthouse]
- [ ] axe clean, light and dark [axe]
- [ ] Owner sign-off [owner]

## Out of scope

- Work (WO-015), demos (WO-016), music (WO-018).

## Notes

- Run gates with `PW_PORT=4383 npm run gates -- --quick`.
