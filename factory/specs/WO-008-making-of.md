---
id: WO-008
title: Keep the making-of history and add "This portfolio" as a project
phase: 3
gate: human
agent: builder
depends_on: [WO-007]
touches:
  - factory/history/**
  - src/assets/making-of/**
  - src/content/projects/portfolio.md
  - src/content.config.ts
  - src/system/CaseStudyLayout.astro
---

## Goal

Preserve enough of the four-direction process to tell how this site was made, and publish that
story as a project: the software factory, the constitution, four parallel directions, the lab,
the owner's picks and the gates.

## Acceptance criteria

- [ ] Phase 1 source is preserved under git tag `phase1-directions` and documented in `factory/history/README.md` [review]
- [ ] Screenshots of all four directions (desktop and phone) plus the lab view live in `src/assets/making-of/`, free of metadata [anonymize]
- [ ] `/projects/portfolio/` renders the story and a gallery of the four directions with alt text [e2e:route /projects/portfolio/ renders without console errors or horizontal overflow]
- [ ] Gallery images are responsive and lazy-loaded within the Lighthouse budgets [lighthouse]
- [ ] Owner approves the making-of copy [owner]

## Out of scope

- Phase 3 demos (WO-009 onward).

## Notes

Narrative source: `factory/history/phase-0-2.md`.
