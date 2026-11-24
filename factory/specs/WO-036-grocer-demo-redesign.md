---
id: WO-036
title: Grocer demo redesign: a loyalty app with price-led offers and a clear clip, not a template
phase: 12
gate: human
agent: builder
depends_on: [WO-031]
touches:
  - src/demos/grocer/**
  - tests/e2e/demo-grocer.spec.ts
  - tests/e2e/demo-fit.spec.ts (the grocer boxes only, and only if a size changes on purpose)
---

## Goal

The owner, after Phase 11: the airline's problems apply to "the grocer loyalty and digital experience prototype" too. "It just looks very AI slop, boring… I just need a redesign there." The owner gave autonomy for a complete redesign, informed by industry examples and brand-agnostic.

What's there ("Pantry Lane", `factory/out/audit5/grocer-*.png`):

- **Home:** a ring percentage beside a points number, then "Picked for you" as equal rounded cards with a pastel image block, a pill badge and an outlined "Load" button.
- **Offers:** the same cards in a 2-column grid, with a long intro sentence above them.
- **Lists and Recipes:** more of the same card grammar.
- **Overall:** flat clip-art products (a cereal box, yogurt cups, berries) and the brand colour spread across badges, borders, buttons and links. These are the anti-template patterns in research section 1.

## Design

Start with `factory/out/audit5/research.md`: section 1, the grocery findings in section 3, and direction D ("Retail ledger") in section 6, with A's calm base as the frame. You choose; write the direction down at the top of `GrocerDemo.tsx` in two or three lines.

- **The offer is the price.**
  - Offers are dense rows, or a tight grid only where imagery earns it.
  - The discount or points bonus is the typographic hero ("+75 pts", "$2 off").
  - Then the product in body text, then the expiry, muted.
- **Clip in place.**
  - The Load (clip) action changes in place from outline to filled with a check, with state parity and a short, interruptible transition.
  - A running "loaded" total sits at the top of Offers, and the tab badge updates with it.
  - Keep the existing behaviour: load, then checkout earns points and unlocks the reward.
- **One highlight colour, used only for member prices, bonuses and the loaded state.** The brand colour sits in the header and the primary action, not everywhere.
- **Home leads with the member:**
  - the points balance as the one hero number;
  - progress to the next reward as a labelled bar ("350 pts to $10 off"), not a bare ring percentage;
  - then a short "picked for you" run;
  - then the list.
- **Product art:**
  - no emoji-style clip art in pastel boxes;
  - either restrained, consistent product silhouettes on a neutral tile in one style, or typography-led rows with no art;
  - no stock photos (public repo, no licences).
- **Lists:** a real checklist with quantities, aisle or category grouping, and an inline offer hint where an item has one.
- **Recipes:** fewer, bigger tiles, or a type-led list with time and points. Keep any existing recipe-to-list behaviour.
- **Same behaviour:**
  - the four tabs, the mock data, the carousel if it stays;
  - keyboard operation;
  - WO-031's focus rings: the demo's own ring at ≥ 3:1, inset on the panel and tab bar, never clipped. Fix the known Phase 11 follow-up: at 375 the second "Load offer" ring in the snapping carousel is clipped by 4px. Don't clip it, for example with `scroll-padding` or by dropping the carousel for a list.

## Constraints

- Constitution Art. 12: the demo kit's scales, the demo's own colour tokens, state parity and the motion vocabulary. Art. 11: no em dashes.
- Script budget ≤ 100KB in total; no new dependencies. Collapsed demos must not hydrate.
- Don't edit `src/demos/kit.css`: override in `grocer.css`, and report any kit change you need.
- WO-034, WO-035, WO-037, WO-038 and WO-039 run in parallel. Stay out of their files.

## Acceptance criteria

- [ ] Each offer shows its bonus or discount as the largest text in its row or tile. Loading one switches its button in place to a filled, checked "Loaded", and updates the loaded total and the tab badge [e2e:demo-grocer offers clip in place]
- [ ] Home shows the balance and a labelled progress bar to the next reward [e2e:demo-grocer home leads with the balance]
- [ ] Checkout still earns points and unlocks the reward [e2e:demo-grocer grocer checkout earns points and unlocks the reward]
- [ ] Keyboard operable as before, and at 375 no focus ring in the demo is clipped [e2e:demo-grocer grocer demo is keyboard operable]
- [ ] WO-031's ring tests still pass [e2e:demo-grocer panel and tab bar rings are inset]
- [ ] None of research section 1's anti-template patterns remain [review]
- [ ] The demo-fit tests pass [e2e:demo-fit]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] A design-critic pass on all four tabs, at home 1440 and 375, light and dark, finds nothing "template" or "boring" above minor [review]
- [ ] Owner sign-off on the redesign [owner]

## Out of scope

- The Work section around the demo (WO-034), and the other demos.

## Notes

- Run gates with `PW_PORT=4416 npm run gates -- --quick`, and the full gates before handing back.
- Use the `ui-craft` skill and the `design-critic` agent. Save before and after screenshots of each tab to `factory/out/p12/grocer/`.
