# Portfolio

Personal portfolio: product leadership, AI-enabled building, personal projects and music.
Astro + React islands, a static site on Cloudflare Pages: <https://nakuliyer.pages.dev>.

This repo is built by a **software factory**: small work orders flow through scripted stations
and automated gates, and the owner signs off at milestones.

```
work order ─▶ spec lint ─▶ builder agent ─▶ gates ─▶ fresh reviewer ─▶ PR + preview ─▶ owner (milestones) ─▶ main ─▶ deploy
```

## Layout

| Path                      | What                                                                         |
| ------------------------- | ---------------------------------------------------------------------------- |
| `factory/constitution.md` | Rules every agent run is bound by                                            |
| `factory/specs/WO-*.md`   | Work orders (copy `_TEMPLATE.md`)                                            |
| `factory/stations/`       | `run-wo.sh`, `gates.sh`, `anonymize.mjs`, `speclint.mjs`, `linkcheck.mjs`    |
| `factory/hooks/`          | `portfolio_guard.py` — asks the owner before deploys, pushes to main, merges |
| `factory/decisions.md`    | Owner decision log                                                           |
| `.claude/agents/`         | builder, reviewer, a11y-auditor, design-critic                               |
| `src/`                    | the site                                                                     |
| `tests/e2e/`              | Playwright gates: every built route at 375 and 1440, light and dark          |
| `private/` (gitignored)   | banned-terms list, stack study guides — never published                      |

## Commands

```bash
npm run dev                          # local dev server
npm run gates                        # every gate (add -- --quick to skip Lighthouse)
factory/stations/run-wo.sh WO-001    # run a work order end to end, open a PR
```

## Gates

Types (`astro check`, `tsc`), ESLint, Prettier, spec lint, build, anonymization (banned terms +
image metadata), internal and external links, gitleaks, Playwright at 375×812 and 1440×900 with
axe-core (WCAG 2.2 AA, light and dark), keyboard and reduced-motion checks, full-page
screenshots, and mobile Lighthouse budgets (Perf ≥ 95, A11y 100, LCP < 2 s, CLS < 0.05,
≤ 100 KB JS).

## Setup notes

- `private/banned-terms.txt` (one term per line, gitignored) holds the client names the
  anonymizer blocks on every write. CI can also check them if a `BANNED_TERMS` repo secret is
  added (optional; without it CI checks image metadata only). Never commit the list.
- Deploys: the Cloudflare Pages project `nakuliyer` is connected to this repo; `main` deploys production and
  every branch gets a preview URL. Agents push, merge or deploy only after the owner confirms.
