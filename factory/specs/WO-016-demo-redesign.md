---
id: WO-016
title: Redesign the work demos so they look like real, designed products
phase: 6
gate: human
agent: builder
depends_on: [WO-014]
touches:
  - src/demos/**
  - src/pages/demos/**
  - tests/e2e/demo-*.spec.ts
---

## Goal

The owner finds the prototypes "very bland … no intricate design". For example, the airline
home screen "looks kind of empty", and its Status tab "doesn't really show anything, it's just a
bulleted list". Redesign **every** demo so it looks like a polished, real product built by a
strong design team. Apply the ui-craft skill (`~/.claude/skills/ui-craft/`).

Each demo keeps its own invented brand, its mock data and its existing behaviour and tests.

- **Airline (Skyward Rewards), phone:**
  - _Home:_ a real loyalty home. Include a membership card with tier styling, a points balance
    with an animated count only on first view (static under reduced motion), progress to the next
    tier as a visual meter, upcoming trip or offer cards, and quick actions.
  - _Status:_ a tier ladder showing current and next tier with benefits shown visually,
    qualifying-points progress, and the perks unlocked at each tier (icons drawn as inline SVG).
    Not a bulleted list.
  - _Redeem:_ destination cards with imagery made from CSS/SVG (no stock photos), a
    points-vs-cash price and a satisfying booking confirmation.
- **Grocer (Pantry Lane), phone:**
  - The same level of craft: an offer cards carousel, a points ring, list items with
    category colours, a recipe card with a cooking-time meta row, and a checkout receipt.
  - Keep the full flow: load offers → list → recipe adds → checkout → reward.
- **Nurse scheduler, desktop:**
  - Must fit about 1200×560 (laptop, one pane) without the page scrolling. Compress row height
    and cell size, and turn the candidate panel into a tighter column or a popover anchored to
    the open shift.
  - Keep the rules engine, the guided fill and keyboard navigation of the grid.
- **TPM pipeline, diagram:**
  - Compress to fit about 1200×520. Make the step content denser and more designed: transcript
    with speaker avatars, extraction chips, a RAG status table, the nudge as a chat message, and
    the board as a mini kanban.
  - Keep the action-driven flow and the citations.
- **Billable mini-room:** visuals unchanged. Only make sure the poster and controls look
  intentional next to the redesigned demos.

## Constraints

- **Accessibility:** WCAG 2.2 AA; keyboard operable; `aria-live` announcements kept; state
  parity (hover, focus-visible, active); `prefers-reduced-motion` respected.
- **Assets:** CSS and inline SVG only, no new dependencies. Each demo's own JS stays under
  about 15 KB gzipped (React runtime is shared).
- **Content:** no real brand names, logos or colours; invented data only. No em dashes.
- **Craft:** `.craftrc.demos.json` budgets hold; behaviour checks stay at 0.

## Acceptance criteria

- [ ] All existing demo e2e tests pass (update only for renamed text) [e2e:route /demos/grocer/ renders without console errors or horizontal overflow]
- [ ] Scheduler fits 1200×560 and pipeline fits 1200×520 with no scrollbar in their frame at 1440×900 [e2e:demos fit their pane]
- [ ] axe clean in light and dark on every demo harness [axe]
- [ ] `npm run craft` (both configs) passes [check]
- [ ] Owner sign-off [owner]

## Out of scope

- The Work section layout (WO-015), projects (WO-017), music (WO-018).

## Notes

- Run gates with `PW_PORT=4382 npm run gates -- --quick`. Screenshot every demo state at 375
  and 1440 before and after, into `factory/out/demos/`.
