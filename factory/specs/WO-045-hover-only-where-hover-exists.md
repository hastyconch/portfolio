---
id: WO-045
title: Hover only where hover exists, so a tap never leaves a hover tint behind
phase: 14
gate: human
agent: builder
depends_on: [WO-040]
touches:
  - src/system/*.astro (hover rules only)
  - src/system/liner.css (hover rules only)
  - src/pages/404.astro (hover rules only)
  - src/pages/music/[id].astro (hover rules only)
  - src/demos/*/*.css (hover rules only)
  - tests/e2e/craft.spec.ts
  - factory/decisions.md
---

## Goal

The design critic in WO-040, and the PR #16 follow-ups: on a touch screen a tap leaves `:hover` on the tapped control, so its hover tint stays on until you tap somewhere else. 62 rules across 19 files applied hover styles everywhere. The owner asked for the fix after Phase 13, and decided that the airline and grocer demos stay light.

## Design

- Every rule with a `:hover` selector moves into an `@media (hover: hover)` copy of itself, right after the original, so the cascade order is unchanged.
- Selectors that combine hover and focus (`:is(:hover, :focus-visible)`, `:has(... :hover, ... :focus-visible)`) keep their focus part unguarded, so keyboard focus looks the same on every device.
- Done with a PostCSS codemod that rewrites only the rules it touches; nothing else in the files changes.

## Acceptance criteria

- [ ] No `:hover` rule in the built CSS (files and inline styles) is outside `@media (hover: hover)` [e2e:craft hover rules only apply where hover exists]
- [ ] Desktop hover and focus look and behave as before; the full gates pass, axe in light and dark [lighthouse]
- [ ] Owner check on a phone: no tint stays on after a tap [owner]

## Out of scope

- Dark versions of the airline and grocer demos: the owner decided they stay light (decisions.md, 2026-11-25).
