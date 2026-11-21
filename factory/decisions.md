# Decision log

Owner decisions that change the constitution, budgets or scope. Newest first.

| Date       | Decision                                                                                                                                                                                                 | By      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2026-11-21 | Art. 9 relaxed: agents may push to main, merge and deploy production after the owner confirms each action (guard returns "ask"). Force pushes, history rewrites, branch-protection changes stay blocked. | owner   |
| 2026-11-21 | No `BANNED_TERMS` CI secret. Client-name checks run locally (write hook + `private/banned-terms.txt`); CI checks image metadata only. The secret can be added later with no code change.                 | owner   |
| 2026-11-21 | Deploys: Cloudflare Workers Builds on the `portfolio` Worker — `main` → production, other branches → preview URLs. Reuses the account's existing build token.                                            | owner   |
| 2026-11-21 | `eslint-plugin-jsx-a11y` omitted (no ESLint 10 support yet); a11y is gated at runtime by axe-core + Lighthouse 100.                                                                                      | factory |
| 2026-11-21 | Scope: mini games hub dropped. Felt & Tiles described as-is (no multiplayer). Extras: Box Scores, TCG Companion.                                                                                         | owner   |
| 2026-11-21 | Method: software factory. Framework: Astro + React islands. Hosting: Cloudflare Workers static assets. Music: Spotify/YouTube embeds (click-to-load). Domain: later.                                     | owner   |
