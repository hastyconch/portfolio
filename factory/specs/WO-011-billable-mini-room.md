---
id: WO-011
title: Billable. mini-room (playable in the browser)
phase: 3
gate: human
agent: builder
depends_on: [WO-007]
touches:
  - src/demos/billable/**
  - src/pages/demos/billable.astro
  - tests/e2e/demo-billable.spec.ts
  - package.json
  - package-lock.json
---

## Goal

A single playable room from the owner's game **Billable.** for its case study
(`src/content/projects/billable.md`). The player can:

- move and jump,
- collect **Billable Hours**,
- touch a **Leaked Email**, which opens a dialogue box,
- defeat the **Red Stapler**, which ends with a "Room cleared" state and a Replay option.

**Source:** the owner's own game at `~/corporate-video-game` (read-only; never modify it).
Vendor only what the room needs into `src/demos/billable/`:

- `src/art/{raster,compile,palette}.ts` and the sprites the room uses,
- a minimal scene,
- the dialogue box,
- the level format and sandbox code from `src/levels/{format,sandbox}.ts`.

Keep the game's procedural art and its game-feel mechanics (coyote time, jump buffer).

**Loading:** Phaser 3.90 is large. The page must load **no Phaser code** until the visitor
clicks **Play**. The poster before that is a static image (or CSS) plus a Play button. After
the click, dynamically `import()` Phaser and the scene, so Vite splits them into their own chunk.

## Acceptance criteria

- [ ] `src/demos/billable/BillableMini.tsx` (default export) renders a poster + Play button; Phaser loads only after Play [e2e:billable mini loads no game code before Play]
- [ ] Harness page `/demos/billable/` (`<Base noindex>`) [e2e:route /demos/billable/ renders without console errors or horizontal overflow]
- [ ] Initial page JS stays ≤ 100 KB (Phaser excluded until Play) [lighthouse]
- [ ] Controls work by keyboard (arrows/WASD, Space/Z jump, X attack, Esc pauses) and by on-screen touch buttons at 375px; controls are listed in text beside the canvas [review]
- [ ] Canvas has an accessible name and a text description of the goal; focus moves into the game on Play and Esc returns it to the page [review]
- [ ] Under reduced motion: no screen shake or flashing; the game pauses when scrolled out of view [review]
- [ ] Zero serious/critical axe violations on the harness page, light and dark [axe]
- [ ] Vendored code contains no real company or person names [anonymize]

## Out of scope

- Other stages, classes, music, saves. Edits outside `touches`.

## Notes

- Add `phaser@3.90.0` as a dependency (only `package.json` / `package-lock.json` change there).
- Run gates with `PW_PORT=4343 npm run gates -- --quick`.
- Run `npm ci` first if `node_modules` is missing.
