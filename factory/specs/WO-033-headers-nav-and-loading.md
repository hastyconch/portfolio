---
id: WO-033
title: Headers, navigation and loading: varied section headers, a menu that closes, one history model, a Billable tap that says it's loading
phase: 11
gate: human
agent: builder
depends_on: [WO-029, WO-030]
touches:
  - src/system/Nav.astro
  - src/system/SideHead.astro
  - src/system/Projects.astro
  - src/system/Music.astro (the section header only)
  - src/system/ProjectCard.astro
  - src/system/CaseStudyLayout.astro
  - src/pages/projects/billable.astro
  - src/demos/billable/BillableMini.tsx (the loading announcement only)
  - tests/e2e/wayfinding.spec.ts
  - tests/e2e/projects.spec.ts
  - tests/e2e/music.spec.ts (the header tests only)
  - tests/e2e/demo-billable.spec.ts
  - tests/e2e/polish.spec.ts (new tests only)
---

## Goal

These come from the fourth round of audits on the live site, after Phase 10 (`factory/out/audit4/`).

1. **P2: three identical section headers in a row.**
   - Work, Projects and Music all use a 36px/700 title at x = 140 with the lead at x = 374 (ui-craft anti-slop smell #1). The rhythm reads as a template, and nothing marks which section matters.
2. **P3: the phone menu stays open over a scrolling page.** With the menu open, a swipe scrolled the page 400px underneath it, and the menu stayed open.
3. **P3: two history models.**
   - The header and menu links use `location.replace` (Nav.astro:266-274), so they add no Back entries.
   - The hero's "Résumé" and "See the work" links each add one.
4. **P3: an early Billable tap gives almost no feedback.**
   - On slow 3G the only response for about 6s is a 4px press.
   - Screen readers hear nothing: there's no `aria-busy` and no status text until "Game started…".
   - The "Loading the game…" chip after hydration (BillableMini.tsx:257-260) is not in a live region either.
5. **Minor: the crumb at 320 with WCAG 1.4.12 text spacing.** On /projects/billable/ and /projects/travel-planner/, `.np-item` shrinks to 26px ("B…").
6. **Minor: the case-study gallery list is unnamed while off-screen.**
   - The `<ul tabindex="0" aria-labelledby="gallery-h">` (CaseStudyLayout.astro:185-189) is missing from the accessibility tree at the top of the page.
   - WO-029 fixed this for the region, not for the list.
7. **P3: on phones, each project card's bottom rule curls up at both ends.** `.pc` has a `border-bottom` together with `border-radius: var(--radius-1)` (ProjectCard.astro:102-103).
8. **P3: case-study list rules stop short.** At 1440 the "What it does" list rules (`.cs-features`) stop at x = 1,187, while Stack, Notes and the pager run to 1,300.

## Design

- **Varied section headers.** Keep every section title at the same size and weight (`--text-2xl`, display face); the hierarchy holds. Vary the layout:
  - **Work** keeps the strong two-column header (`SideHead layout="aside"`), unchanged.
  - **Projects:** the title and its lead stack in one column on the left, with the rail's previous and next arrows aligned to the right on the same row. There is no two-column split.
  - **Music:** the title and lead stack in one column above the stage, on the dark band, with no two-column split.
  - Do this with a SideHead layout option, or in each section's own markup. Keep the ids and `aria-labelledby` links, and the WO-022 test that the Music title matches the Work title's size.
- **The menu closes on scroll.**
  - When the phone menu is open, a page scroll of more than a few pixels, or a `touchmove` outside the menu, closes it.
  - Focus doesn't move unless it was inside the menu; then it returns to the Menu toggle.
- **One history model.**
  - Every in-page link to a section (`a[href^="#"]` that targets a section id) behaves like the header links: `location.replace`, with no new history entry. This includes the hero's "Résumé" and "See the work".
  - The Nav wayfinding inline script is 3,907 bytes against Vite's 4,096-byte inline limit. Stay under it: widen the existing selector rather than adding code, or move logic into the menu module. Check the built HTML and report the size.
- **Billable says it's loading.**
  - When the pending-tap script marks the island, it also:
    - sets `aria-busy="true"` on the game region;
    - writes "Loading the game…" into the server-rendered `.bm-sr[role=status]`;
    - shows a visible "Loading…" label on or under the Play button (CSS, using tokens).
  - BillableMini clears these when the game starts. The post-hydration "Loading the game…" chip is announced through the same status element.
  - If hydration fails, the button must not stay pressed forever: clear the pending look after about 10s and restore the button.
- **The crumb under text spacing.** Below 360px, also drop the `.np-sep` separator and the "Projects" crumb's extra width, so the project name keeps at least about 6ch with 1.4.12 spacing applied.
- **Gallery list name.** The `<ul>` gets `aria-label={d.gallery.title}`, like its region.
- **Cards.** Move the card's rule off the rounded box: either a `.pc + .pc` top border, or the radius applied only to the hover/active background. No curl at either end at 375.
- **Case-study rules.** `.cs-features` rules run the same width as Stack, Notes and the pager, or every ruled block shares one measure. Choose whichever keeps line length readable, and note it.

## Constraints

- Constitution Art. 12: tokens only, state parity. Art. 11: no em dashes.
- Keep the header at 60px. Keep WO-023's anchor-landing tests and WO-029's deep-link, crumb and song-header tests green.
- LCP < 2000ms and the script budget hold. The Nav inline scripts must stay inlined.
- WO-031 (liner.css, demo focus CSS) and WO-032 (Hero, Work) run in parallel. Stay out of their files. In Music.astro, change only the section header.

## Acceptance criteria

- [ ] The Projects and Music headers are single-column (the lead sits below the title, not beside it), while Work's lead sits beside its title. All three titles have the same computed font size [e2e:polish section headers vary]
- [ ] At 375 × 812, with the menu open, scrolling the page 200px closes it [e2e:wayfinding phone menu closes on scroll]
- [ ] Clicking the hero's "Résumé" and "See the work", and five header links, adds no history entries [e2e:wayfinding in-page links don't pile up history]
- [ ] With Billable's JS delayed, a tap on Play sets `aria-busy`, puts "Loading the game…" in the status element and shows a visible loading label; the game then starts and these clear [e2e:demo-billable first tap starts the game]
- [ ] At 320 × 640 with 1.4.12 text spacing, the crumb's project name is at least 40px wide [e2e:wayfinding crumb keeps its name at 320]
- [ ] At 375, the case-study gallery list has an accessible name before it is scrolled into view [e2e:polish case-study gallery is named]
- [ ] At 375, a project card's bottom rule is straight to both ends. At 1440 on a case study, the `.cs-features` rules end where the Stack rules end, or the chosen shared measure is applied to every ruled block [e2e:projects rule and pager align]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off, including the header layouts [owner]

## Out of scope

- The Work header, the hero and the phone demos (WO-032). Focus rings and band tokens (WO-031).
- Keyboard reach to the Work stepper (still deferred; see WO-027).

## Notes

- Run gates with `PW_PORT=4413 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence: `factory/out/audit4/` (`usability/`, `a11y/`, `crit/m-pc-rule.png`, `v2.mjs` for the menu).
