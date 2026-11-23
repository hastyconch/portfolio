---
id: WO-020
title: Billable room: the game full width, with Goal and Controls in a tidy band underneath
phase: 7
gate: human
agent: builder
depends_on: [WO-017]
touches:
  - src/demos/billable/BillableMini.tsx
  - src/demos/billable/billable.css
  - tests/e2e/demo-billable.spec.ts
---

## Goal

The owner says:

> "One thing about Billable is the controls within the box, the way that the controls are
> represented. The line breaks look very messy. Drop through a desk takes up 3 lines. I don't
> think that that's necessary. There's a lot of empty space between the game and then the problem
> statement. I think that that's not very visually appealing."

At 1440 × 900 today the Goal / Controls panel is a narrow 20rem column beside the game:

- Its labels wrap ("Drop through a desk" takes three lines).
- The panel is far taller than the game, so a tall empty area opens under the game before
  "Problem".

## Design

- **The game takes the full width of the case study column** (about 900px at 1440). The HUD
  (Billable Hours, Wellbeing) sits above it as today.
- **Goal and Controls move into one band under the game**, aligned to the game's edges:
  - **≥ 60rem:** Goal on the left (about a third, the goal paragraph) and Controls on the right.
  - **Controls** is a two-column grid of rows, so seven rows make about four lines. Each row is
    action then keys. Action labels never wrap (`white-space: nowrap`): "Drop through a desk"
    is one line.
  - Keys are `<kbd>` chips. Parenthetical notes ("hold to jump higher", "laptop swing",
    "returns focus to the page") are a quieter, smaller second tone. Shorten them only if the
    meaning stays.
  - "Touch" shows only on coarse pointers or narrow screens, where the on-screen pad exists.
- **Narrow screens:** the band stacks: Goal, then Controls in one column, labels still on one
  line where they fit. The on-screen pad stays as is.
- **The section ends at the band.** No empty run under the game; the space to "Problem" matches
  the gap between other case study sections.
- **Keep** the `<dl>` semantics, the `aria-describedby` links to the goal and controls ids, the
  focus handling, and the loading and paused overlays.

## Constraints

- Constitution Art. 12: tokens only (the demo kit tokens where the file already uses them),
  state parity, no new effects. Art. 11: no em dashes.
- Don't touch `src/system/CaseStudyLayout.astro`. WO-019 owns it in parallel. Style the band
  from `billable.css`; the existing `.cs-play :global(.bm-h)` rule there may stay.
- Lighthouse on `/projects/billable/`: LCP < 2s, CLS < 0.05. The game canvas keeps a reserved
  aspect ratio, so widening it must not shift the layout.

## Acceptance criteria

- [ ] At 1440 × 900 every Controls action label renders on one line (each `dt` is one line box tall) [e2e:demo-billable controls labels do not wrap]
- [ ] At 1440 × 900 the Goal / Controls band starts below the game, the game is at least 800px wide, and the band's bottom is within 96px of the section's bottom [e2e:demo-billable layout band under the game]
- [ ] The existing Billable play, pause and keyboard tests still pass [e2e:demo-billable]
- [ ] 375 × 812: no horizontal overflow; the pad and band are usable [e2e:gates]
- [ ] axe clean, light and dark; Lighthouse budgets on the Billable page [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- The header, ToC and case study navigation (WO-019).
- The game itself.

## Notes

- Run gates with `PW_PORT=4392 npm run gates -- --quick`, and the full gates before handing back.
