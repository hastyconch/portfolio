---
id: WO-031
title: Focus and band tokens: demo focus rings that win, hairlines that match their band, one rule for primary buttons
phase: 11
gate: human
agent: builder
depends_on: [WO-029]
touches:
  - src/system/liner.css
  - src/system/tokens.css (comments only, if the button rule is written there)
  - src/demos/airline/airline.css (focus rings only)
  - src/demos/grocer/grocer.css (focus rings only)
  - src/demos/scheduler/** and src/demos/pipeline/** (focus ring CSS only, if the same problem shows)
  - tests/e2e/craft.spec.ts
  - tests/e2e/demo-airline.spec.ts
  - tests/e2e/demo-grocer.spec.ts
  - factory/decisions.md
---

## Goal

These come from the fourth round of audits on the live site, after Phase 10 (`factory/out/audit4/`).

1. **Serious (WCAG 1.4.11, 2.4.7): inside the demos on home, the site's focus ring overrides the demo's own ring.**
   - `body.ln :focus-visible` (liner.css:133-136, specificity 0,2,1) beats `.sky-app :focus-visible` (airline.css:854) and `.gro-app :focus-visible` (grocer.css:747), both 0,2,0.
   - In dark mode, "Book reward" gets a #ff9b66 ring on #f6f3fb: 1.89:1. Grocer's "Load offer" gets 2.07:1 on white. The demos' plum and teal rings never render on home; on `/demos/airline/` they do.
   - `.sky-panel:focus-visible { outline-offset: -3px }` (airline.css:858) also loses. The panel's ring sits outside it and is clipped by `.sky-app { overflow: hidden }`, so only a 3px line shows at the top. `.gro-panel` has the same geometry.
   - On phones the Airline panel is the first Tab stop after "Try the demo".
2. **P2: dark bands get the light theme's hairline.**
   - `--ln-hairline: 1px solid var(--ln-rule)` is declared on `:root` only (liner.css:41-47), so it resolves to the cream theme's #c9bba5. `.ln-dark` inherits that resolved value.
   - In light mode this colours the Spotify player borders, the song pager rules, the footer link rules and the 404 footer tan, where dark mode shows #3b342e.
   - WO-029 worked around this in Nav.astro by redefining `--ln-hairline` on the song header.
3. **P3: the primary button changes colour across the site.**
   - Ink fill: the 404 and Résumé.
   - Accent fill: Billable's "Play it" and the phone demo buttons.
   - The rule exists in practice (accent for "play" actions, ink for everything else) but isn't written down.

## Design

- **The demos' rings win.**
  - Lower the site rule's specificity to zero for the `body.ln` part, for example `:where(body.ln) :focus-visible { … }`, or move it into a cascade layer below the demos.
  - Every demo's own `:focus-visible` rule, and the inset `outline-offset` on `.sky-panel` and `.gro-panel`, then apply on home exactly as on `/demos/*`.
  - Check every focusable element in all four home demos (airline, grocer, pipeline, scheduler) and in Billable, in light and dark, at 1440 and 375. Each ring must be ≥ 3:1 against the surface next to it and must not be clipped by an `overflow: hidden` ancestor. Fix any demo whose own ring fails, inside that demo's CSS.
  - The site ring outside the demos is unchanged: colour, width, offset, and the skip link.
- **Hairlines follow their band.**
  - Declare `--ln-hairline` (and any other composite token that bakes in a colour token, such as rule shorthands) inside the same `:root, .ln-dark` scope that defines the colours, so it re-resolves per band.
  - Then remove the now-redundant `--ln-hairline` redefinition WO-029 added in Nav.astro, but only if it is purely the same value. Nav.astro is outside this order's touches, so if a change there is needed, report the one line instead of making it.
  - Check in light mode on: the song page (players, pager), the Music band on home, the footer, and the 404.
- **One rule for primary buttons.** Record it in `factory/decisions.md`: accent fill for actions that start something playable (Play, Try the demo), ink fill for every other primary action (Download, Go home). No visual change unless an existing button breaks the rule; list any you find.

## Constraints

- Constitution Art. 12: tokens only, state parity. Art. 11: no em dashes.
- Don't change any demo's behaviour or layout, only its focus CSS.
- WO-032 (Hero, Work) and WO-033 (Nav, Projects, Music, SideHead, ProjectCard, CaseStudyLayout, Billable page) run in parallel. Stay out of their files.

## Acceptance criteria

- [ ] On `/` in dark mode, the focus ring on Airline's "Book reward" and Grocer's "Load offer" is the demo's own ring colour, not the site accent, with ≥ 3:1 contrast against its surface [e2e:demo-airline focus ring is the demo's on home] [e2e:demo-grocer focus ring is the demo's on home]
- [ ] Focusing `.sky-panel` and `.gro-panel` on home draws an inset ring that is visible on all four sides (not clipped) [e2e:demo-airline panel ring is inset]
- [ ] Outside the demos, the site focus ring is unchanged [e2e:craft focus ring outside demos]
- [ ] In light mode, the hairlines on `.ln-dark` surfaces (song pager, players, footer) compute to the dark band's rule colour [e2e:craft hairlines follow their band]
- [ ] `factory/decisions.md` records the primary button rule [owner]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- The hero, Work and the phone demos (WO-032). Nav, section headers, cards, the case-study gallery and Billable's loading state (WO-033).

## Notes

- Run gates with `PW_PORT=4411 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence: `factory/out/audit4/` (`a11y/`, `hair.mjs`, `v3.mjs`).
