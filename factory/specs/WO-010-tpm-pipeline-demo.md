---
id: WO-010
title: Real-estate TPM AI pipeline demo
phase: 3
gate: human
agent: builder
depends_on: [WO-007]
touches:
  - src/demos/pipeline/**
  - src/pages/demos/pipeline.astro
  - tests/e2e/demo-pipeline.spec.ts
---

## Goal

An interactive diagram for the real-estate software TPM engagement
(`src/content/work/07-real-estate-tpm.md`). It shows how AI kept a large delivery program on
time, step by step:

1. **Meeting transcript in:** a short, invented stand-up transcript.
2. **AI extracts:** decisions, risks and action items.
3. **Exec status update:** a generated RAG (red/amber/green) summary.
4. **Nudge engine:** flags overdue developer follow-ups and drafts a polite nudge.
5. **PM tool updated:** ticket statuses change on a mock board.

The visitor steps through with **Next / Back**, or plays it through automatically. Autoplay is
off under reduced motion. The final state reads **"Delivered on time"**. Everything is mocked:
invented people, project and tickets, and no real tool brand names (say "PM tool", not a
product name).

## Acceptance criteria

- [ ] `src/demos/pipeline/PipelineDemo.tsx` (default export) + `pipeline.css`, responsive from 320px to 900px wide using container queries [review]
- [ ] Harness page `/demos/pipeline/` (`<Base noindex>`) shows it at full width and inside a 360px column [e2e:route /demos/pipeline/ renders without console errors or horizontal overflow]
- [ ] Stepper is keyboard operable; the current step is announced via `aria-live`; autoplay can be paused (WCAG 2.2.2) [e2e:pipeline demo steps by keyboard]
- [ ] No autoplay and no animation under reduced motion [e2e:reduced motion: no running animations longer than 0.01s]
- [ ] Zero serious/critical axe violations in light and dark [axe]
- [ ] Mock data only; no real company, person or product names [anonymize]

## Out of scope

- Placing the demo on the home page (integration does that), and edits outside `touches`.

## Notes

- Run gates with `PW_PORT=4342 npm run gates -- --quick`.
- Run `npm ci` first if `node_modules` is missing.
