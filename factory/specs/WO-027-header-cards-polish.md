---
id: WO-027
title: Header, cards and polish: honest controls in the header, even card lines, one section-header pattern, small alignments
phase: 9
gate: human
agent: builder
depends_on: [WO-019, WO-023]
touches:
  - src/system/Nav.astro
  - src/system/ProjectCard.astro
  - src/system/Projects.astro
  - src/system/SideHead.astro
  - src/system/Footer.astro
  - src/system/CaseStudyLayout.astro
  - src/pages/404.astro
  - src/system/liner.css (the `.ln-vinyl` rim on dark only)
  - tests/e2e/wayfinding.spec.ts
  - tests/e2e/projects.spec.ts
  - tests/e2e/polish.spec.ts (new)
---

## Goal

These come from the second round of audits on the live site, after Phase 8:

- **P2: the Projects cards' hairlines sit at different heights.** At 1440 the rule under each card's meta row is at y ≈ 695, 693, 672 and 695, so it moves with each card's content. This is the section built to show craft.
- **P2: Work, Projects and Music lay out their section headers three different ways.**
  - Work puts the title left and the intro in the content column.
  - Projects stacks the title over the intro at full width.
  - Music follows Work; WO-026 adjusts its weight.
- **Minor (WCAG 4.1.2 / 2.4.6): the crumb trigger.**
  - It is named only by the item ("Airline loyalty") and carries `aria-current="location"` on a button.
  - Its popover stays open when Tab leaves it (2.4.11 risk).
- **P3: on phones, the case-study crumb starts with a stray "/".** The name is hidden, so the logo is followed by "/ Projects / Billable.".
- **P3: nav clicks pile up history entries.** 5 clicks add 5 entries, so Back scrolls around the page before it leaves.
- **P3: the phone case-study jump list is easy to miss.** There is only a small ▾; the stepper and "2 / 8" are hidden on phones.
- **P3: small alignment slips.**
  - The footer's contact labels sit about 4px in from their hairlines and from "Get in touch".
  - Billable's "Next project" rule starts at x = 736 and lines up with nothing.
- **P3: the 404's way out is a 172 × 22 text link.**
- **P3: on the dark Music band, the Aaron's Painting record shows only as a ghost ring.** It is black vinyl on near-black.

## Design

- **Even card lines.** At ≥ 900px, each card's body is a column whose stack line sits at the bottom: `margin-top: auto` in a flex column, or a subgrid across the rail. The hairline then lines up on every card in the rail. Phones keep their list layout.
- **One section-header pattern.**
  - Projects follows Work's layout at ≥ 900px: the title in the left column, the lead in the content column, and the rail arrows with the lead.
  - Do it in `SideHead.astro` if Work uses it too, so there is one pattern. If Work has its own markup, make Projects match it.
  - Phones stay stacked.
- **Crumb trigger.**
  - Its accessible name says what it does: "{item}, switch project" on case studies and "{item}, switch engagement" on home, or `aria-describedby` pointing at a hidden "Jump to another project" text.
  - `aria-current="location"` moves onto the visible item text, not the button.
  - The popover closes on `focusout` when focus leaves both the popover and its trigger.
- **Phone crumb.**
  - Hide the separator that follows the hidden name.
  - On case studies, show the count beside the trigger ("2 / 8") at < 760px, so the jump list is discoverable. It is text, not a stepper.
- **History.** In-page nav links (`#work`, `#projects` and so on) on the home page update the hash with `history.replaceState` and scroll as now. They don't add history entries. Cross-page links are unchanged.
- **Alignments.**
  - Footer contact rows start flush with "Get in touch" and their hairlines. If the hover background needs room, bleed it with a negative margin.
  - Billable's "Next project" pager rule spans the content column.
- **404.** "Go to the home page" becomes a ≥ 44px button-styled link, plus a "Projects" link, with hover / focus-visible / active parity.
- **Record rim on dark.** In `.ln-dark`, `.ln-vinyl` gets a faint rim highlight (an inset ring or a hairline in the existing line token) so the record reads on the dark band. The light-theme record is unchanged.

## Constraints

- Constitution Art. 12: tokens only, state parity, no new effects beyond the rim. Art. 11: no em dashes.
- Don't change header height (60px) or the anchor landing rules from WO-023.
- WO-025 owns DemoFrame, Work and the demos. WO-026 owns Music, Players, the song page, Hero, Resume and the PDF. Stay out of their files. `liner.css`: the `.ln-vinyl` rule only.

## Acceptance criteria

- [ ] At 1440 × 900, the stack hairline's top is the same, within 1px, on every visible project card [e2e:projects card lines align]
- [ ] At 1440, the Projects title and lead are in two columns, matching Work's title column x and lead column x within 2px [e2e:polish section headers share one pattern]
- [ ] The crumb trigger's name or description says it opens a list. `aria-current` is not on a button. The popover closes when Tab leaves it [e2e:wayfinding crumb trigger names its action]
- [ ] At 375 on a case study, the crumb shows no leading "/" and shows "n / N" [e2e:wayfinding phone crumb]
- [ ] Five in-page nav clicks on home leave `history.length` unchanged [e2e:wayfinding nav does not pile up history]
- [ ] The footer's contact labels start at the same x as "Get in touch" (±1px). Billable's pager rule starts at the content column's x [e2e:polish alignments]
- [ ] The 404's home link is at least 44px tall, and there is a Projects link [e2e:polish 404 way out]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- **Making the Work stepper reachable by keyboard from inside a pane.** This is advisory, not an SC failure. It is inherent to the header coming first in DOM order, and the pane headings, the jump list and the skip link already cover navigation. Revisit if the owner wants it.

## Notes

- Run gates with `PW_PORT=4398 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence (gitignored, main checkout): `factory/out/audit2/crit/`, `factory/out/audit2/a11y/`, `factory/out/audit2/usability/`.
