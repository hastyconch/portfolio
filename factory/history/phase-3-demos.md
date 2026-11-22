# Phase 3: interactive demos

_2026-11-22. Work orders WO-008 to WO-012._

## How it ran

- **WO-008 (making-of):** preserved the Phase 1 directions and added "This portfolio" as a project.
- **Scheduler wireframe:** the plan required a wireframe before building. I showed the owner two clickable concepts:
  - **A:** a week grid with a live rule checker.
  - **B:** a guided "fill the open shift" task, with ranked and explained candidates.

  The owner chose to **combine** them: B runs inside A's grid.

- **Four builder agents ran in parallel**, each in its own git worktree, with its own test-server port:

| WO     | Demo                 | Own JS (gzipped) | Notes                                                                                                                             |
| ------ | -------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| WO-009 | Grocer loyalty phone | 2.5 KB           | Invented "Pantry Lane": offers you can load, a shopping list, a recipe that adds to the list                                      |
| WO-010 | TPM AI pipeline      | 3.0 KB           | Stand-up transcript → extraction → exec RAG status → nudge → PM tool → "Delivered on time"; autoplay off under reduced motion     |
| WO-011 | Billable. mini-room  | 3.3 KB + 326 KB  | One room vendored from the real game. Phaser (326 KB) loads only after Play, so the page stays under its 100 KB JavaScript budget |
| WO-012 | Nurse scheduler      | 4.1 KB           | Grid with roving focus and live rules (12h rest, 3-night max, overtime, leave); guided fill with plain-language reasons           |

## Integration

- **Phone tints:** the phone frame now takes each demo's own status-bar colour.
- **Wide demos:** desktop and diagram demos run full width under the engagement summary, and size to their content.
- **Billable:** the mini-room got its own "Play a room" section on its case study.
- **Heading levels:** demo headings were moved down a level to nest under their engagement or section.

## What the factory surfaced

- **Wrong base branch:** the builders' worktrees started from `main`, not the `phase3` branch.
  - Three fast-forwarded themselves.
  - One was denied the fast-forward. It built on `main` and handed back a commit to cherry-pick, which applied cleanly.
- **Port collision:** one builder's first test run hit another builder's preview server on a shared port. These runs now use a unique port for each builder.
- **Accessibility fixes caught by axe before integration:**
  - A Jump button with 3.9:1 contrast.
  - A fade-in caught mid-transition.
  - Coverage cells whose accessible name didn't match their visible text.
