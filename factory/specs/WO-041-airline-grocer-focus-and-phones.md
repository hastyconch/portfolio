---
id: WO-041
title: Airline and grocer demos: focus that follows the action, a sheet that behaves as a dialog, and controls that fit a thumb
phase: 13
gate: human
agent: builder
depends_on: [WO-035, WO-036]
touches:
  - src/demos/airline/AirlineDemo.tsx
  - src/demos/airline/airline.css (not the phone block at the end, which is WO-040's)
  - src/demos/grocer/GrocerDemo.tsx
  - src/demos/grocer/grocer.css (not the phone block at the end, which is WO-040's)
  - tests/e2e/demo-airline.spec.ts
  - tests/e2e/demo-grocer.spec.ts
---

## Goal

The mobile audit of Phase 12 (`/Users/nakuliyer/portfolio/factory/out/audit6/mobile-report.md`, findings 6, 7, 8, 10, 13, 16 and 21 for these two demos; detail in `/Users/nakuliyer/portfolio/factory/out/audit6/a11y.md` and `/Users/nakuliyer/portfolio/factory/out/audit6/usability.md`):

- **The airline booking sheet opens under the site header** when motion is on: its heading lands at y = 12 to 40 behind the 61px header.
- **The sheet says `aria-modal` but focus escapes it:** Shift+Tab from its heading reaches "Hide demo".
- **Focus is lost when an in-app button switches tabs:** Airline "Book reward" and "Tier Perks"; Grocer "See all 5", "Open list", and "Check out" when it empties the list (focus stays on a button scrolled out of view).
- **Airline Status cuts text at 320 under the WCAG text-spacing test:** "9,600 to go" becomes "9,600 to g", "Platinum 75k" becomes "Platinum …".
- **Targets under 44px:** Airline Book 32px; Grocer Load 32px and "Load all" 36px.
- **Wrapping at 320:** Airline "Gold 50k" and "Platinum 75k" run together and "75,000 SQM" wraps; Grocer product names get about 95px beside a 92px Load button, and "+10 pts" wraps.
- **Small a11y items:** Airline tabs lack Home and End keys; unselected tabs point `aria-controls` at panels that don't exist; Grocer's "Loaded" state isn't in the button's name.

## Design

- **The sheet is a real dialog.** Either trap focus inside it (Tab and Shift+Tab cycle, Escape closes and returns focus to the control that opened it), or make it non-modal and drop `aria-modal`. Prefer the trap. After the slide-in, focus its heading with `preventScroll` and bring it into view below the header (a header-sized `scroll-margin-top`, or scroll the app, never the page more than needed).
- **Focus follows the action.** When a button switches tab, focus the newly selected tab (or the panel's heading, with `tabIndex=-1`), without scrolling the page more than needed. After Grocer checkout, focus the receipt.
- **Thumb targets.** On coarse pointers, every control in both apps is at least 44px tall (or has a 44px hit area through padding or a pseudo-element without changing the look on desktop).
- **Text that wraps instead of cuts.** The tier row and the tier list wrap; no ellipsis on numbers. At 320 with the text-spacing test (line-height 1.5, letter 0.12em, word 0.16em, paragraph 2em), nothing in Status or Redeem is clipped. Grocer offer rows give the name the width and put Load under or beside it without the name dropping under about 140px.
- **Tabs.** Home and End move to the first and last tab. `aria-controls` only on the selected tab, or render every panel. Grocer's Load button's name includes its state ("Loaded").

## Constraints

- Keep the Phase 12 look (WO-035 "wallet pass", WO-036 "retail ledger"); this is behaviour and fit, not a redesign.
- WO-040 adds a phone block at the end of each CSS file (no inner scroll, sticky tab bar). Don't add rules about the app's height, the panel's overflow or the tab bar's position; leave those to WO-040. If you need one, say so in your report.
- Constitution Art. 11 and 12. No new dependencies.

## Acceptance criteria

- [ ] The airline booking sheet keeps focus inside it, closes on Escape and returns focus to the opener [e2e:airline sheet traps focus]
- [ ] With motion on at 375 × 812, the sheet's heading is fully below the site header after it opens [e2e:airline sheet opens below the header]
- [ ] After "Book reward", "Tier Perks", "See all 5", "Open list" and "Check out", focus is on the new tab, panel or receipt and visible [e2e:airline focus follows tab switches] [e2e:grocer focus follows tab switches]
- [ ] At 320 with text spacing applied, no text in Airline Status or Redeem is clipped or ellipsed [e2e:airline status wraps under text spacing]
- [ ] On a coarse pointer at 375, every button and tab in both apps has a hit area ≥ 44px tall [e2e:airline targets fit a thumb] [e2e:grocer targets fit a thumb]
- [ ] Airline tabs support Home and End; no `aria-controls` points at a missing id in either app; "Loaded" is in the button's name [e2e:airline tabs keys and controls] [e2e:grocer loaded state is named]
- [ ] Design-critic pass at 375 and 320, light and dark: nothing above minor [review]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]

## Out of scope

- One-tap booking and the grocer reward's detour through Recipes (pre-existing, noted in the report).
- The phone layout of the app frame (WO-040). Dark versions of these apps (owner decision).

## Notes

- Gates: `PW_PORT=4421 npm run gates -- --quick`, the full gates before handing back. Screenshots to `/Users/nakuliyer/portfolio/factory/out/p13/airline-grocer/`.
