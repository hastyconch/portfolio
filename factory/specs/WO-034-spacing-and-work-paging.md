---
id: WO-034
title: Spacing and Work paging: every section lands at the same place, one measured spacing system, Work panes that lock in on a small scroll
phase: 12
gate: human
agent: builder
depends_on: [WO-032, WO-033]
touches:
  - src/system/liner.css
  - src/system/tokens.css
  - src/system/Hero.astro (spacing only)
  - src/system/Work.astro (spacing and paging only; not the demos)
  - src/system/Projects.astro
  - src/system/ProjectCard.astro (spacing only)
  - src/system/Music.astro (spacing only)
  - src/system/SideHead.astro
  - src/system/Footer.astro
  - src/system/CaseStudyLayout.astro (spacing only)
  - src/system/Nav.astro (only if the paging needs the stepper to agree)
  - src/pages/music/[id].astro (spacing only)
  - src/pages/404.astro (spacing only)
  - src/system/work-paging.ts (new, if the paging needs script)
  - tests/e2e/work.spec.ts
  - tests/e2e/polish.spec.ts (new tests only)
  - tests/e2e/wayfinding.spec.ts (landing tests only)
  - factory/decisions.md
---

## Goal

The owner's notes after Phase 11, checked on the live site (`factory/out/audit5/land.mjs`).

1. **Sections land at different heights.**
   - After a header link click at 1440 × 900, the section titles land at:
     - Work: y = 108;
     - Projects: y = 163;
     - Music: y = 125;
     - Résumé: y = 180, the "big gap" the owner saw.
   - Each section's top padding differs: 48, 32, 64 and 120px.
   - At 1280 × 800 the landings are 108, 113, 125 and 172.
   - The owner wants the gap identical for every section.
2. **The spacing in general "is really bad".** The owner asked for a full audit of the spacing: "like everything".
3. **Work used to lock in.** In WO-015, scrolling through Work locked onto the next engagement: a little scroll moved from Airline to Grocer. WO-023 removed that because root `scroll-snap-type: y proximity` trapped the wheel: 1 to 15 notches from a pane's top snapped back. The owner wants the lock-in back, fixed, and "very intuitive".

## Design

- **One landing.**
  - Every home section reached from the header (Work, Projects, Music, Résumé) puts its title's top at the same distance under the 60px header, at every width ≥ 760px.
  - On phones, the four landings are also equal to each other.
  - Use Work's current landing (title top at y = 108 at 1440) unless the audit gives a reason to change it.
  - Do it with one shared rule in liner.css (a section top token, or a `scroll-margin-top` derived from the padding), not with per-section magic numbers.
  - WO-038 redesigns Résumé in parallel and will apply the same shared rule. Résumé's own top padding is WO-038's. Make your landing test cover Work, Projects and Music, and expose the rule (token name, how a section opts in) in this order's report so WO-038 can follow it. The integrator checks all four together.
- **A measured spacing audit.**
  1. Measure before changing anything, on `/`, a case study (`/projects/billable/`, `/projects/travel-planner/`), a song page, and the 404. Use 375, 768, 1280 and 1440, light mode.
     - **Section rhythm:** padding above and below each section; the gaps from title to lead and from lead to content.
     - **Within sections:** item to item, heading to body, card gaps, rail padding.
     - **Layout:** the page gutters and container widths.
     - **Footer and header:** the footer's spacing, and the header-to-content gap on subpages.
     - **Literals:** list every spacing value that isn't a `--space-*` token.
  2. Write the findings and the fix for each to `factory/out/audit5/spacing.md`.
  3. Then make the system: a small set of named rhythm tokens (section padding, title-to-lead, lead-to-content, stack gap) that every section uses.
  - The rest of the page should read as one rhythm. Bands (Music, footer) may keep more air, but by a token, not an ad hoc number.
  - Résumé's internal spacing is WO-038's. The demos' internal spacing is WO-035 to WO-037's.
- **Work panes lock in.** On laptops (≥ 760px wide and a fine pointer), with motion allowed:
  - **One gesture, one pane.** A single small wheel or trackpad gesture inside the Work demo panes moves to the next pane down, or the previous pane up. The new pane's top lands flush under the header, in an ease-out of at most about 450ms.
  - **Never back.** A gesture never snaps back to the pane it started in. This is the WO-023 bug and must not return.
  - **Inertia.** A trackpad's trailing inertia events, or a fast run of notches within one gesture, move exactly one pane, not several. A new gesture after the motion settles moves one more.
  - **Lock in from above.** Scrolling down from the hero into Work locks onto the first pane once its top is near the header, so the page doesn't stop with a pane half-shown.
  - **Leave from the ends.** Past the last demo pane, the page scrolls normally into the rest of Work and Projects. Up from the first pane returns to the hero normally.
  - **Inner scrollers first.** A wheel over a part of a demo that scrolls on its own (a scrolling screen, a table) scrolls that first. Paging happens only when it can't scroll further in that direction.
  - **Keyboard and the stepper.** PageDown, Space and the arrows keep the browser's own behaviour. The header stepper and jump list keep working, and agree with the paging on the current pane.
  - **Reduced motion.** The jump is instant.
  - **Phones and touch-only tablets** keep native scrolling.
  - Prefer CSS (`scroll-snap-type: y mandatory` only if it meets every point above in Chromium, Firefox and Safari, including the inertia and the ends). Otherwise use a small script module, loaded as a module, inside the script budget, with passive listeners wherever it doesn't call `preventDefault`. Note the choice and why in Work.astro's header.
- **Record it.** Add a decisions.md row: the lock-in returns at the owner's request (Phase 12 notes), reversing WO-023's removal, and how it avoids the trap.

## Constraints

- Constitution Art. 12: tokens only. Art. 11: no em dashes.
- **Keep:**
  - WO-032's fold targets: the Work title within the first viewport at 1366 × 768 and 1280 × 800, and the first engagement's kicker at 1440 × 900;
  - WO-023's anchor-landing tests;
  - the header at 60px;
  - `demo-fit.spec.ts`.
- LCP < 2000ms; script budget ≤ 100KB.
- WO-035 to WO-037 (demos), WO-038 (Resume.astro, resume.json, resume PDF) and WO-039 (projects content and assets) run in parallel. Stay out of their files. Don't touch `src/demos/**` or `Resume.astro`.

## Acceptance criteria

- [ ] At 1440 × 900 and 1280 × 800, after each header link click, the Work, Projects and Music titles' tops are within 2px of each other [e2e:wayfinding every section lands at the same place]
- [ ] At 375 × 812 the same three landings are within 2px of each other [e2e:wayfinding every section lands at the same place]
- [ ] `factory/out/audit5/spacing.md` lists the measured problems and the fix for each, and the named rhythm tokens are used by every home section, case studies, song pages and the 404 [review]
- [ ] At 1440 × 900, one 100px wheel notch in Work pane 1 lands pane 2's top flush under the header, and one notch up from pane 2 lands pane 1. Never the pane it started in [e2e:work panes lock in on one notch]
- [ ] Six notches 30ms apart move exactly one pane. A second gesture after it settles moves one more [e2e:work one gesture moves one pane]
- [ ] Below the last demo pane and above the first, wheel scrolling is native. Five notches from the last pane move the page at least 400px past it [e2e:work paging releases at the ends]
- [ ] Under reduced motion, a notch still moves one pane, instantly. At 375, and with a coarse pointer, there is no paging [e2e:work paging respects motion and touch]
- [ ] WO-032's fold tests and WO-023's landing tests still pass [e2e:gates hero shows the work above the fold]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off after trying the lock-in with a mouse and a trackpad [owner]

## Out of scope

- The demos' insides (WO-035 to WO-037), the résumé (WO-038), the potluck project (WO-039).
- New section content or copy.

## Notes

- Run gates with `PW_PORT=4414 npm run gates -- --quick`, and the full gates before handing back.
- Evidence: `factory/out/audit5/land.mjs` (run it with `U=http://localhost:<port>` against a preview build).
- Playwright's `page.mouse.wheel` sends real wheel events and works in CI's Linux Chromium. Don't use `Input.synthesizeScrollGesture` (Phase 11 found it differs between macOS and Linux).
