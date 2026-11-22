# Portfolio Factory — Constitution

Every agent run in this repo is bound by these articles. They are appended to every builder
prompt by `factory/stations/run-wo.sh` and enforced, where possible, by hooks and CI gates.
If a work order conflicts with an article, the article wins and the agent stops and escalates.

## Article 1 — Four directions before the build

No design system is built until four distinct design directions (A–D) have been produced,
each at mobile (375px) and desktop (1440px), and the owner has recorded picks in
`factory/picks.yaml`.

## Article 2 — The owner decides at milestones

Work orders with `gate: human` are merged only after the owner signs off on them. Milestones: end of each phase,
every professional-work demo, the scheduler wireframe, music content, launch.

## Article 3 — Anonymity of clients

No client names, program names, logos, brand colours, trademarks, recognisable UI patterns,
or colleague names — anywhere: copy, code, comments, alt text, filenames, image metadata,
commit messages. Use invented, generic names (e.g. "a national airline", "Skyward Rewards").
Enforced by `anonymize.mjs` against a private banned-terms list. Passing the lint is necessary,
not sufficient: when in doubt, generalise.

## Article 4 — Accessibility is non-negotiable

WCAG 2.2 AA (which satisfies AODA). Semantic HTML first; every interaction is
keyboard-operable with a visible focus ring; text contrast ≥ 4.5:1 (3:1 for large text and UI);
targets ≥ 24×24px; `prefers-reduced-motion` respected; no information conveyed by colour alone;
embeds have titles and a non-JS fallback link. Gate: axe-core 0 serious/critical, Lighthouse a11y 100.

## Article 5 — Performance budgets are fixed

Mobile Lighthouse: Performance ≥ 95, Best Practices ≥ 95, SEO ≥ 95, LCP < 2.0s, CLS < 0.05,
TBT < 150ms. ≤ 100 KB gzipped JS on initial load of any route. Heavy demos (game, embeds)
load only on explicit user action. Budgets change only by owner decision recorded in
`factory/decisions.md`.

## Article 6 — Demos are mocks

Interactive demos use local fixtures only. No live APIs, no API keys, no backends, no
network calls beyond the site's own static assets (music embeds load only on click).

## Article 7 — Honesty

Describe only what exists. Features that are planned are labelled "planned" / "on the roadmap".
Stack claims must match the project's actual code (see the inventories in the plan).
Write authoritatively, never vaguely — but never overclaim.

## Article 8 — `private/` is never published

`private/` (stack study guides, banned terms, raw notes) is gitignored, never imported by
`src/`, and never copied into `dist/`.

## Article 9 — Agents ship only with the owner's confirmation

Agents may push to `main`, merge PRs and run a production deploy, but only after the owner
confirms that specific action. Each one triggers an approval prompt; one approval covers one
action, never later ones. Agents never force-push, rewrite history, change branch protection,
or commit `private/`. Enforced by `factory/hooks/portfolio_guard.py` (ask for the former,
block for the latter).

## Article 10 — Small, testable work orders

Every work order lists acceptance criteria that each name the gate or test that proves them,
and a `touches` list of paths. Agents stay inside `touches`; anything else is escalated.
After 3 failed gate loops, stop and escalate to the owner.

## Article 11 — No em dashes in site copy

The website's copy never uses the em dash (U+2014). Write the sentence another way: a comma,
colon, parentheses, a full stop, or `·` in titles and labels. This covers everything a visitor
can read or hear: content, component text, accessible names and page titles, including the
demos. Enforced by `factory/stations/copylint.mjs` over `src/` and the built `dist/`.
