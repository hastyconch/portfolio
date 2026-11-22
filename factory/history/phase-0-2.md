# Phases 0–2: the factory, four directions, one design system

_2026-11-21 → 2026-11-22. Owner: Nakul Iyer (product owner). Builders: Claude Code agents._

## Phase 0 — the factory before the site

The repo started empty. Before any page existed, the factory did:

- **A constitution** (`factory/constitution.md`) with 10 articles. Highlights:
  - Four design directions before the real build.
  - The owner signs off at every milestone.
  - Client anonymity, WCAG 2.2 AA, and fixed performance budgets.
  - Demos use mock data only, and planned features are labelled as planned.
  - Agents push, merge or deploy only after the owner confirms each action.
- **Work orders** (`factory/specs/WO-###`): every acceptance criterion names the check that proves it. A spec linter rejects any that don't.
- **Gates** (`npm run gates`, mirrored in GitHub Actions):
  - Types, ESLint and Prettier.
  - Build, plus an anonymity scan (banned terms and image metadata).
  - Internal and external link checks, and gitleaks.
  - Playwright at 375×812 and 1440×900:
    - axe-core in light and dark mode
    - keyboard skip link
    - reduced motion
    - no horizontal overflow
  - Lighthouse budgets on every page: performance ≥ 0.95, accessibility = 1, LCP < 2s, CLS < 0.05, TBT < 150ms, JavaScript ≤ 100 KB.
- **Guard hooks:** `portfolio_guard.py` asks the owner before any push to `main`, merge or production deploy. It blocks force-pushes, history rewrites and branch-protection changes. An anonymity check runs after every file write.
- **Hosting:** Cloudflare Pages. `main` is production and every branch gets a preview URL.

## Phase 1 — four directions, one content model

**WO-002** built the shared pieces:

- A typed content model: profile, work, projects, songs and résumé, as Zod content collections.
- The first interactive demo: an invented airline loyalty app.
- A **slot contract** (`Nav`, `Hero`, `Work`, `DemoFrame`, `ProjectCard`, `CaseStudyLayout`, `Music`, `Resume`, `Footer`). Every direction had to render the same content through the same slots, so the owner could mix and match.

Four builder agents then ran **in parallel**, each in its own git worktree, port and branch:

| WO     | Direction        | Brief in one line                                                                      |
| ------ | ---------------- | -------------------------------------------------------------------------------------- |
| WO-003 | A — Editorial    | Long-scroll magazine; Fraunces serif display; demos as full-bleed "Fig." spreads       |
| WO-004 | B — Desktop OS   | Windows, dock and app icons on desktop; a phone home screen with app sheets on mobile  |
| WO-005 | C — Product Spec | PM-native: tickets with status, PRD-style case studies, career roadmap                 |
| WO-006 | D — Liner Notes  | A record sleeve: Side A work, Side B projects, Bonus tracks music; Genius-style lyrics |

**Integration:** a `/lab` gallery showed any slot from all four directions side by side, at phone or desktop width. A pick sheet exported the owner's choices as YAML.

The gates caught real problems during integration:

| Problem                                                                           | Fix                                                                              |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Builders' worktrees were picked up by the type checker, linter and anonymity scan | Added the worktrees folder to every ignore list                                  |
| Lighthouse only sampled top-level pages                                           | Switched to an explicit list of every built page                                 |
| Direction C shifted layout (CLS 0.061) when web fonts swapped in                  | Preloaded each direction's main fonts                                            |
| In CI, `/lab` blocked the main thread (TBT 296ms) by loading 4 iframes at once    | Lazy-loaded the iframes as they scroll into view                                 |
| The first headline draft used a pronoun for the owner                             | Rewrote it in the first person ("I lead products with AI — and build them too.") |

## The owner's picks (2026-11-22)

From `factory/picks.yaml`:

- **D (Liner Notes)** for the overall look, hero and nav, demo frame, projects, case studies, music and résumé.
  - "The most creative… the pop from the records is amazing."
- **A (Editorial)** for the organisation of Work: a sector / company / role column beside each engagement.
- **Motion:** calm.
- **Noted for later:** the record metaphor (tracklist, credits) is "a little overbearing".

## Phase 2 — the system

**WO-007:**

- Moved D into `src/system/` and rebuilt Work with A's organisation in D's style. The live demo sits beside its engagement on desktop and right after the summary on phones.
- Replaced the looping record spin with a single turn on hover, and added a test that fails on any infinite animation.
- Made the pages indexable, so SEO is now asserted.
- Retired `/lab` and directions A–C. Their source is kept under the git tag `phase1-directions`, with screenshots in `src/assets/making-of/`.

**CI catch:** a cold GitHub runner scored 255ms of blocking time on the tiny 404 page, against 0ms locally. Its CPU benchmark was a sixth of normal. Lighthouse now asserts the **median of 3 runs** against the same budgets.
