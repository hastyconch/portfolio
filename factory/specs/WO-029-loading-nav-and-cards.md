---
id: WO-029
title: Loading, navigation and cards: Billable answers the first tap, deep links jump, the crumb keeps its name, honest chips
phase: 10
gate: human
agent: builder
depends_on: [WO-027]
touches:
  - src/pages/projects/billable.astro
  - src/demos/billable/BillableMini.tsx (only if a pending first tap is needed)
  - src/layouts/Base.astro
  - src/system/Nav.astro
  - src/system/Projects.astro
  - src/system/ProjectCard.astro
  - src/system/CaseStudyLayout.astro
  - tests/e2e/demo-billable.spec.ts
  - tests/e2e/wayfinding.spec.ts
  - tests/e2e/projects.spec.ts
  - tests/e2e/craft.spec.ts
  - tests/e2e/polish.spec.ts (new tests only)
---

## Goal

These come from the third round of audits on the live site, after Phase 9 (`factory/out/audit3/`).

1. **P1: on a phone, an early tap on Billable's Play does nothing.**
   - On /projects/billable/ at 375 × 812, a tap on "Play the Billable. mini-room" right after the page loads is ignored. The island is still `ssr` when the tap lands, so the server-rendered button has no handler.
   - The game never starts, and nothing says why. A tap 2.5s later starts it. The window is longer on slow networks.
   - The island is `client:visible` (billable.astro:20).
2. **P3: cold deep links scroll through the whole page.**
   - On a phone, a cold load of `/#contact` animates from y = 131 to y = 11,429 over about 1.5s. `/#projects` takes about 1s.
   - Cause: `html { scroll-behavior: smooth }` (liner.css:68) also animates the browser's initial jump to the fragment.
3. **P3: the crumb lags at the bottom of the page.**
   - On a cold `/#contact`, the crumb shows "Résumé" from about 800ms to 1,500ms, while the page is already at the bottom. It shows "Contact" only by 2,500ms.
   - The same lag shows through the phone menu and at 1440.
4. **P3: at 320px, the phone crumb cuts the project name to one letter.**
   - On /projects/travel-planner/ it reads "Projects / T… ▾ 6 / 8": `.np-item` is 12px wide (16px on Billable).
   - Before Phase 9 it showed "Tra…"; the new "n / N" count takes the room.
5. **P3: the song page in light mode has a cream header on an all-dark page,** which leaves a hard seam under the header.
6. **P3: "Featured" chips sit on placeholder art.** Travel Planner and Fashion Companion show "Featured" over their "Screenshots coming" covers.
7. **P3: two small misalignments.**
   - **Phone Projects:** the rule under the lead runs edge to edge (x 0 to 375), while every other rule is inset to the gutter (16 to 359). The border is drawn on `.rail` across its padding.
   - **Case-study pager:** the labels sit 4px inside their rule. On Billable, "Next project" ends at x = 1,296 against a rule ending at 1,300. `.cs-pg` has `padding: var(--space-5) var(--space-1)`.
8. **Minor (accessibility): the case-study gallery region has no name while it is off-screen.**
   - On /projects/travel-planner/, /projects/portfolio/ and /projects/billable/ at 375, `content-visibility: auto` on the gallery section drops `#gallery-h` from Chromium's accessibility tree.
   - So its `aria-labelledby` resolves to nothing, and the landmark list shows an unnamed "region" (CaseStudyLayout.astro:180, :839).

## Design

- **Billable answers the first tap.**
  - Hydrate earlier: `client:idle`, or keep `client:visible` with a generous `rootMargin`.
  - If a tap can still land before hydration on a slow network, the server-rendered button should record a pending start (a data attribute or a one-shot listener) that BillableMini acts on once it mounts. Choose the smaller change that makes the test pass under 4× CPU throttling, and note why.
  - Keep the Lighthouse budgets on /projects/billable/.
- **Deep links jump.**
  - On a load with `location.hash`, the first jump to the fragment is instant. Smooth scrolling stays for in-page clicks after that.
  - One way: a tiny inline head script in Base.astro sets `document.documentElement.style.scrollBehavior = 'auto'` when `location.hash` is set, and clears it after the first `scrollend` (or `load` plus a frame, where `scrollend` isn't supported).
  - Keep reduced motion as it is: Base.astro:107 already forces `auto`.
  - Keep the inline script under Vite's 4,096-byte inline limit, or merge it into an existing inline script.
- **The crumb is current at once.** In Nav.astro's scroll spy, also update on `scrollend` and on `load`, so the bottom-of-page rule applies as soon as scrolling stops.
- **The crumb keeps its name at 320.**
  - Below 360px, the project name keeps at least about 6ch before the count gives way. Hide `.np-count`, or let it shrink first.
  - The count stays at ≥ 360px.
- **The song page header matches the page.**
  - On `/music/*` pages, the header uses the dark band treatment (`.ln-dark` tokens) in both themes, so there's no seam.
  - Keep its contrast, focus ring and the progress bar visible.
  - Pass this from the song page's layout as a prop or a body class. Don't edit `src/pages/music/[id].astro` (WO-030 owns it). If a prop is needed there, document the one-line hook for WO-030 in your report instead.
- **Honest chips.**
  - A card shows "Featured" only when it has real cover art, not the "Screenshots coming" placeholder.
  - The "Mock-up" chip is unchanged.
- **Alignments.**
  - On phones, the Projects rule is inset to the gutter like every other rule, for example as a gutter-inset `::before`.
  - `.cs-pg` labels align with their rule: zero inline padding, with the hover background given room by a negative margin. This is the same fix the footer got in WO-027.
- **Gallery name.** The gallery section gets `aria-label={title}`, or `content-visibility` moves onto an inner `.cs-gal` wrapper so the heading stays in the tree.

## Constraints

- Constitution Art. 12: tokens only, state parity, motion vocabulary. Art. 11: no em dashes.
- Keep the header at 60px. Keep WO-023's anchor-landing rules and their tests green.
- LCP < 2000ms and the script budget hold. The Nav inline script must stay inlined (≤ 4,096 bytes): check the built HTML.
- WO-028 (Hero, Work, demos) and WO-030 (Music, Players, Lyrics, the song page, Resume, the PDF) run in parallel. Stay out of their files.

## Acceptance criteria

- [ ] On /projects/billable/ at 375 × 812 with 4× CPU throttling, a tap on Play as soon as the button is visible starts the game (a canvas mounts, and the status is not idle) [e2e:demo-billable first tap starts the game]
- [ ] A cold load of `/#contact` and `/#projects` at 375 × 812 is at its final scroll position within 150ms of `load`, and the crumb names that section by then [e2e:wayfinding cold deep links jump]
- [ ] At 320 × 640 on /projects/travel-planner/, the crumb's project name is at least 40px wide [e2e:wayfinding crumb keeps its name at 320]
- [ ] On /music/roadhouse/ in light mode, the header's background matches the page band [e2e:craft song header matches the band]
- [ ] No "Featured" chip sits on placeholder cover art [e2e:projects featured only with art]
- [ ] At 375, the Projects rule is inset to the gutter. On /projects/billable/ at 1440, the "Next project" text's right edge is within 1px of its rule's right edge [e2e:projects rule and pager align]
- [ ] At 375, the case-study gallery region has an accessible name before it is scrolled into view [e2e:polish case-study gallery is named]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- The hero and Work (WO-028). Music, the song page body and the résumé (WO-030).
- Keyboard reach to the Work stepper (still deferred; see WO-027).

## Notes

- Run gates with `PW_PORT=4402 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence: `factory/out/audit3/` (`usability/billtap.mjs`, `usability/anchors.mjs`, `usability/contactcrumb.mjs`, `a11y/hdr320_projects_travel_planner_.png`, `verify4.mjs`).
