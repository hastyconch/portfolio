---
id: WO-037
title: Scheduler and pipeline demos: the same bar as the airline and grocer redesigns
phase: 12
gate: human
agent: builder
depends_on: [WO-031]
touches:
  - src/demos/scheduler/**
  - src/demos/pipeline/**
  - tests/e2e/demo-scheduler.spec.ts
  - tests/e2e/demo-pipeline.spec.ts
  - tests/e2e/demo-fit.spec.ts (the scheduler and pipeline boxes only, and only if a size changes on purpose)
---

## Goal

The owner, after Phase 11: "I still don't like the way that the prototypes look. I think that they look very corny and not very sophisticated." WO-035 and WO-036 redesign the airline and grocer demos. These two are the other demos in Work: the nurse scheduler (healthcare workforce management) and the AI program-management pipeline. They must reach the same bar, so the four read as work from one careful designer, not two redesigned and two left behind.

## Design

1. Start with `factory/out/audit5/research.md`: section 1 (anti-template), section 4 (scheduler), section 5 (pipeline), and directions E ("Clinical clarity") and B ("Instrument") in section 6.
2. Screenshot both demos on home at 1440 and on their `/demos/*` pages, light and dark, and list what reads as template.
3. Then fix those, and write each direction at the top of its main component in two or three lines.

- **Scheduler, direction E.**
  - A calm, dense grid grouped by unit or role.
  - Coverage against required staff per shift, written as text plus a dot ("Under by 1 RN"), never colour alone.
  - Open shifts easy to see and claim, with one primary action per row.
  - Hairlines, not shadows. One accent.
- **Pipeline, direction B or a light equivalent.**
  - An overview first, then detail. Rows follow the data's flow: transcript, extracted items, outputs.
  - Sentence-case titles, tabular numbers.
  - Semantic red, amber and green only where a threshold exists.
  - The citation from item to transcript line stays obvious.
- **Both.**
  - Line icons at one stroke width; the demo kit's type scale; one hero number per view at most.
  - No pastel icon tiles, no equal-card grids for items of the same kind, no gradients.
- **Same behaviour.** Keep every current interaction:
  - the scheduler's keyboard grid, guided fill and the cover finder;
  - the pipeline's keyboard stepping, its citations, and its opt-in autoplay that plays once and never runs under reduced motion.
  - Keep WO-031's focus rings and the demo-fit sizes.

## Constraints

- Constitution Art. 12: the demo kit's scales, each demo's own colour tokens, state parity and the motion vocabulary. Art. 11: no em dashes.
- Script budget ≤ 100KB in total; no new dependencies. Collapsed demos must not hydrate.
- Don't edit `src/demos/kit.css`; report any kit change you need.
- WO-034, WO-035, WO-036, WO-038 and WO-039 run in parallel. Stay out of their files.

## Acceptance criteria

- [ ] The scheduler's coverage status is shown as text plus a non-colour cue in every state [e2e:demo-scheduler coverage reads without colour]
- [ ] Every current scheduler and pipeline test passes, rewritten only where selectors changed [e2e:demo-scheduler scheduler grid is keyboard operable] [e2e:demo-pipeline pipeline demo steps by keyboard]
- [ ] None of research section 1's anti-template patterns remain in either demo [review]
- [ ] The demo-fit tests pass [e2e:demo-fit]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] A design-critic pass on both demos, at home 1440 and on their pages, light and dark, finds nothing "template" above minor [review]
- [ ] Owner sign-off [owner]

## Out of scope

- The Work section around the demos (WO-034), and the airline and grocer demos.

## Notes

- Run gates with `PW_PORT=4417 npm run gates -- --quick`, and the full gates before handing back.
- Use the `ui-craft` skill and the `design-critic` agent. Save before and after screenshots to `factory/out/p12/scheduler/` and `factory/out/p12/pipeline/`.
