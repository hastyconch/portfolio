---
id: WO-023
title: Scrolling and the header: anchors land flush, no wheel trap, a header that holds still and keeps focus
phase: 8
gate: human
agent: builder
depends_on: [WO-019, WO-021]
touches:
  - src/system/liner.css
  - src/system/Nav.astro
  - src/system/Projects.astro
  - src/system/Work.astro (the snap and scroll-margin rules only; WO-024 owns the rest of the file)
  - tests/e2e/work.spec.ts
  - tests/e2e/wayfinding.spec.ts
  - tests/e2e/projects.spec.ts
  - tests/e2e/craft.spec.ts
  - factory/decisions.md
---

## Goal

The Phase 8 audits found five problems with scrolling and the header. The owner approved fixing them.

1. **Anchors land low.**
   - The root `scroll-padding-top` (header + `--space-3`, 72px) and `.ln-sec { scroll-margin-top: var(--ln-header) }` (60px) add up, so a nav jump lands a section at y = 132 instead of under the 61px header.
   - On the dark Music band this shows as a cream strip: the owner's complaint, "the top is cut off". It also affects `#work` and `#resume` on desktop, and `#projects` on phones.
2. **The wheel gets trapped in Work.**
   - Root `scroll-snap-type: y proximity` plus viewport-tall panes means every position is near a snap point.
   - In Chromium, 1 to 15 wheel notches from the top of a pane snap back to where they started. Only a big flick, PageDown or Space escapes.
   - The owner agreed to remove the page-level snap. The header stepper already moves pane to pane.
3. **The header jumps the page.**
   - The header's controls sit inside the root scroll-padding zone, so clicking or focusing them scrolls the page. On /projects/billable/ at y = 2000, a click on the crumb trigger moves the page to 1544, and each Shift+Tab into the header jumps about 456px.
   - On the home page this can hide `.np-c-item`, so Escape drops focus to `<body>`.
4. **Focus is lost when a button disables itself.**
   - The Projects rail arrows, and the home stepper with its list item, become `disabled` / `hidden` while focused. Focus falls to `<body>`.
   - The phone menu stays open over the page when focus tabs out of it, and Escape stops working.
5. **The header is see-through.** `.np` uses 94% background plus `blur(8px)`, and demo UI reads through it. Also, the Projects rail's horizontal position is lost on Back.

## Design

- **Anchors.**
  - A section lands flush under the header; an in-page heading keeps the 12px of room.
  - Remove `scroll-margin-top` from `.ln-sec` in liner.css, or set it to `calc(var(--space-3) * -1)` so section bands land exactly at the header's bottom edge.
  - Remove the Work and Projects `scroll-margin-top` workarounds that only existed for the snap.
  - The footer and hero have their own `scroll-margin-top`. WO-024 removes those, so make the liner.css rule the one source of truth and document it in a comment.
- **No page-level snap.**
  - Remove `scroll-snap-type` from the root and the `scroll-snap-align` on `.wk` and `.projects`.
  - Keep the Work panes' size and the Projects pane's one-screen layout; they are composition, not snapping.
  - Horizontal rails keep their x snap.
  - Update `work.spec.ts`: the snap tests become "no vertical snap", and the fit tests stay.
  - Record the change in `factory/decisions.md`. It reverses part of WO-015 and WO-021 because of the wheel trap.
- **A header that holds still.**
  - Give the header and its descendants `scroll-margin-top: calc(-1 * var(--ln-scroll-pad))` (or the equivalent) so focusing them never scrolls the page.
  - Clicking or focusing any header control, at any scroll position, leaves `scrollY` unchanged.
  - **Solid background.** `.np` is `background: var(--ln-bg)` with no `backdrop-filter`.
- **Focus never falls to `<body>`.**
  - **Rail arrows.** Use `aria-disabled="true"` and ignore activation instead of `disabled`, keeping the disabled style. Or move focus to the other arrow before disabling.
  - **Home stepper.** Don't hide `.np-c-item` while it is `:focus-within`. An end-of-list step uses `aria-disabled`.
  - **Phone menu.**
    - Close it on `focusout` when `relatedTarget` is outside the menu and its toggle.
    - Escape closes it from anywhere while it is open (a document-level listener) and returns focus to the toggle.
- **The rail keeps its place.** Save `rail.scrollLeft` on `pagehide` (sessionStorage, keyed by path) and restore it on `pageshow` and load. Restore instantly, with no smooth scroll.

## Constraints

- Constitution Art. 12: tokens only, state parity. Art. 11: no em dashes.
- Work pane sizes and the `demo-fit.spec.ts` tests don't change.
- WO-022 (Music) and WO-024 (Hero, Footer, Work demos on phones, DemoFrame, Resume) run in
  parallel. In `Work.astro`, change only the snap and scroll-margin lines.
- CLS < 0.05; the script budget holds.

## Acceptance criteria

- [ ] At 1440 × 900 and 375 × 812, a nav click on Work, Projects, Music and Résumé lands that section's top within 2px of the header's bottom edge [e2e:wayfinding sections land under the header]
- [ ] There is no vertical scroll snap on the root at any size. Five 100px wheel notches from the top of Work pane 1 move the page at least 400px [e2e:work wheel is never trapped]
- [ ] Clicking the crumb trigger on /projects/billable/ at y = 2000, and Shift+Tab from content into the header, leave `scrollY` unchanged [e2e:wayfinding header never scrolls the page]
- [ ] Pressing Enter on "Scroll projects forward" until the end, and stepping the home stepper to its end, keeps `document.activeElement` on a control, never `<body>` [e2e:wayfinding focus survives end of list]
- [ ] Phone menu: tabbing past the last item closes the menu, and Escape closes it and focuses the toggle [e2e:wayfinding phone menu closes on focus out]
- [ ] The header's computed background is opaque and it has no backdrop-filter [e2e:craft header is solid]
- [ ] After opening the 6th project card and going Back, the rail's `scrollLeft` is restored within 4px [e2e:projects rail keeps its place]
- [ ] The Work pane fit tests still pass [e2e:demo-fit]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off, including the snap removal after trying it with a mouse and a trackpad [owner]

## Out of scope

- The Music layout (WO-022). The phone home length, hero, contact and résumé (WO-024).

## Notes

- Run gates with `PW_PORT=4394 npm run gates -- --quick`, and the full gates before handing back.
- Audit repro scripts: `factory/out/audit/` (`jump2.mjs`, `hdr2.mjs`, `menu.mjs`, `misc.mjs`,
  `usability/snap*.mjs`, `verify.mjs`).
