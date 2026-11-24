---
id: WO-035
title: Airline demo redesign: a member app that looks like a shipping product, not a template
phase: 12
gate: human
agent: builder
depends_on: [WO-031]
touches:
  - src/demos/airline/**
  - tests/e2e/demo-airline.spec.ts
  - tests/e2e/demo-fit.spec.ts (the airline boxes only, and only if a size changes on purpose)
---

## Goal

The owner, after Phase 11: the prototypes "look very corny and not very sophisticated… very AI slop, boring." They asked for a complete redesign, with autonomy, after searching industry examples, while staying brand-agnostic.

What they saw in the airline demo ("Skyward"), checked (`factory/out/audit5/airline-*.png`, `home-airline-1280.png`):

- **Home.**
  - The three quick actions are pastel icon circles on equal tiles. In the home Work pane at 1280 × 800, "Member card" wraps to two lines (96px tall beside 77px), so the three labels look inconsistent.
  - The gold card is a gradient with decorative swooshes.
- **Status.**
  - The tier ladder's gold connector line runs out of the star circle and over the Gold tile, and the dotted line to Platinum does the same.
  - The perks are pastel icon tiles with labels that wrap to three lines ("2 free checked bags").
- **Redeem.** The owner wants a full redesign. Today it is illustrated postcards (flat houses, flat mountains) over equal cards with an orange "Book" button each.

## Design

Start with `factory/out/audit5/research.md`: the anti-template list in section 1, the airline findings in section 2, and directions A and B in section 6. You choose the direction; write it down at the top of `AirlineDemo.tsx` in two or three lines. A good default is **A, the "Wallet pass" look, for the whole app, with B's precise tier track on Status.** Whatever you choose, follow these principles:

- **Chrome recedes; content leads.**
  - One neutral base and one brand accent. Colour appears only where it means something: tier, the balance, a confirmed state.
  - No pastel icon circles, no gradient swooshes, no shadow plus border plus tint on the same surface.
  - Grouped lists for items of the same kind, instead of rows of identical cards.
- **A real type scale** from the demo kit (`src/demos/kit.css`: 12, 13, 14, 15, 17, 22, 30 and 38).
  - Tabular figures for every number.
  - One hero number per screen.
  - Every number labelled.
- **Line icons**, one stroke width (about 1.5px at 20px), sized to the text.
- **Home.**
  - **The member card** is a flat pass: wordmark top left, tier top right, the balance as the main field, name and number as secondary fields. No decorative art.
  - **Tier progress** is labelled: "9,600 to Platinum by Dec 31".
  - **The actions** never wrap and are the same height at every pane size: 1440, 1366, 1280, `/demos/airline/`, and 375. For example, a compact row of text-and-icon buttons with short labels, or a grouped list.
  - **Next trip** reads like a boarding pass, not a card of tiny text.
- **Status.**
  - **The progress** is one straight segmented track with ticks at the tier thresholds and a labelled readout.
  - **The tiers** are a clean list: the current tier highlighted, higher tiers dimmed, perks as plain rows with a check or a line icon. Nothing overflows or crosses another element: no connector lines that leave their rail.
  - Perk labels are one line where possible and two at most, never three.
- **Redeem** is a full redesign, led by the balance: "48,250 pts. Where it gets you."
  - **Destinations are a type-led list:** city and route, the points price right-aligned, the cash taxes smaller under it, and "or $612 cash" as a comparison.
  - **At most one featured destination** may carry art. No stock photos: the repo is public and there are no licences. Use your own restrained CSS or SVG art, or none.
  - **Filters:** a quiet segmented control or chips (for example "Within reach / All") only if it helps.
  - **The booking sheet** keeps its flow (choose, confirm, done) and its keyboard behaviour, restyled to match.
- **Same behaviour.**
  - Keep the mock data (names, numbers, tiers) unless a number needs fixing for consistency. Keep the three tabs and the booking sheet.
  - Keep WO-031's focus rings: the demo's own ring at ≥ 3:1, inset on the panel, never clipped.
  - Keep dark mode if the demo has it. Light and dark both meet contrast.
- **Fit.** The demo fills the same phone frame on home and on `/demos/airline/`. `demo-fit.spec.ts` boxes stay as they are unless a size changes on purpose, with a note.

## Constraints

- Constitution Art. 12: the demo kit's scales, the demo's own colour tokens, state parity (hover, focus-visible, active, disabled) and the motion vocabulary. Art. 11: no em dashes.
- Script budget ≤ 100KB in total; don't add dependencies. Collapsed demos must not hydrate.
- `src/demos/kit.css` is shared with the other demo orders. Don't edit it: override inside `airline.css`. If the kit really needs a change, report the exact lines instead.
- WO-034 (system components, Work.astro), WO-036 (grocer), WO-037 (scheduler, pipeline), WO-038 (résumé) and WO-039 (projects) run in parallel. Stay out of their files.

## Acceptance criteria

- [ ] On home at 1440 × 900, 1366 × 768 and 1280 × 800, on `/demos/airline/`, and at 375, the Home screen's actions all have the same height and none of their labels wraps [e2e:demo-airline actions stay on one line]
- [ ] On Status, no element overflows its row or card: every tier rail, line and badge is inside its container's box, and no perk label runs over two lines [e2e:demo-airline status has no overflow]
- [ ] Redeem lists destinations with the points price right-aligned and the cash comparison, led by the balance. The booking sheet opens, confirms and closes by keyboard as before [e2e:demo-airline airline demo: tabs, booking sheet and focus by keyboard]
- [ ] None of the anti-template patterns from research section 1 remain: pastel icon circles, gradient swooshes on the card, shadow plus border plus tint together, emoji-style illustration [review]
- [ ] WO-031's ring tests still pass on home and `/demos/airline/` [e2e:demo-airline panel ring is inset]
- [ ] The demo-fit tests pass [e2e:demo-fit]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] A design-critic pass on all three tabs, at home 1440 and 375, light and dark, finds nothing "template" or "corny" above minor [review]
- [ ] Owner sign-off on the redesign [owner]

## Out of scope

- The Work section around the demo (WO-034), and the other demos.

## Notes

- Run gates with `PW_PORT=4415 npm run gates -- --quick`, and the full gates before handing back.
- Use the `ui-craft` skill and the `design-critic` agent. Save before and after screenshots of each tab to `factory/out/p12/airline/`.
- Screenshot script to start from: `factory/out/audit5/demos.mjs` and `pane.mjs` (set `U=http://localhost:<port>`).
