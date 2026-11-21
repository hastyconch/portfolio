---
id: WO-000
title: Short imperative title
phase: 0
gate: auto # auto | human
agent: builder # builder | design-critic | a11y-auditor
depends_on: []
touches:
  - src/example/**
---

## Goal

One paragraph: what this delivers and why.

## Acceptance criteria

Each line names how it is proven, in brackets: [e2e:<test name>] [axe] [lighthouse] [check]
[anonymize] [links] [review] (fresh-context reviewer) or [owner] (human gate).

- [ ] AC1 — … [e2e:example renders at 375 and 1440]
- [ ] AC2 — … [axe]

## Out of scope

- …

## Notes

Inputs, references, open questions.
