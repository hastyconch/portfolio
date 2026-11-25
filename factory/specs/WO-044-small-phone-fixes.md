---
id: WO-044
title: Small phone fixes: a crumb that never runs under Menu, a sharper Potluck gallery, and a readable Potluck card
phase: 13
gate: human
agent: builder
depends_on: [WO-039]
touches:
  - src/system/Nav.astro (crumb only)
  - src/system/CaseStudyLayout.astro (gallery sizes only)
  - src/system/ProjectCard.astro (cover crop only)
  - src/content/projects/potluck-picker.md (cover image field only, if needed)
  - src/assets/projects/potluck-picker/** (a tighter card crop, if needed)
  - tests/e2e/wayfinding.spec.ts (crumb tests only)
  - tests/e2e/projects.spec.ts (new tests only)
---

## Goal

The mobile audit of Phase 12 (`/Users/nakuliyer/portfolio/factory/out/audit6/mobile-report.md`, findings 9 and 20):

- **The header crumb runs under the Menu button at 320.** "Projects" ends 5px inside the Menu button, "Résumé" 3px inside; under the WCAG text-spacing test "Résumé" overlaps it by about 47px.
- **The Potluck gallery is slightly soft on 3× screens:** `sizes` works out to 171px but each shot shows at 222px, so a 480px file is stretched 1.39×.
- **The Potluck card's phone screenshot** is about 48px wide on the card and unreadable.

## Design

- **Crumb.** The section name truncates with an ellipsis (as case studies already do) and never overlaps Menu, at 320 and with text spacing. If it can't fit a readable minimum, hide the section name under 360px. The full name stays available to assistive tech.
- **Gallery.** Make `sizes` match the rendered width at every breakpoint, and make sure the widths generated include one large enough for 3× at the largest phone size.
- **Card.** Crop the Potluck card's cover to the part of the screen that reads at card size (for example the dish list or the big question), from the existing screenshots; don't invent content and keep the alt text accurate.

## Constraints

- Constitution Art. 11 and 12. Keep the WO-019 wayfinding behaviour.
- WO-040 to WO-043 run in parallel; stay inside your touches list.

## Acceptance criteria

- [ ] At 320, on Work, Projects, Music and Résumé, the crumb's right edge is left of the Menu button, with and without text spacing [e2e:wayfinding crumb never runs under Menu at 320]
- [ ] Each Potluck gallery image's chosen source is ≥ 2.5× its rendered width at 375 on a 3× screen [e2e:projects potluck gallery is sharp]
- [ ] The Potluck card's cover shows a legible crop at 375 (design-critic check) [review]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]

## Out of scope

- The localhost link in the Potluck share screenshot (needs a recapture from the owner's live app).

## Notes

- Gates: `PW_PORT=4424 npm run gates -- --quick`, the full gates before handing back. Screenshots to `/Users/nakuliyer/portfolio/factory/out/p13/small/`.
