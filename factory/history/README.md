# Making-of record

Source material for the "This portfolio" case study (`src/content/projects/portfolio.md`).
Keep it factual. Each phase gets its own file when it closes.

| Where the history lives        | What                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `factory/history/*.md`         | Narrative per phase: what was built, what the owner chose, what broke and how it was fixed                                      |
| Git tag `phase1-directions`    | Full source of the four Phase 1 directions and the `/lab` gallery as the owner reviewed them (`git checkout phase1-directions`) |
| `main` history (merge commits) | Every work order lands as its own merge, so each direction's build is a separate, readable commit                               |
| `src/assets/making-of/`        | Screenshots of the four directions (desktop 1440 and phone 375, dark) and the `/lab` comparison view                            |
| `factory/picks.yaml`           | The owner's slot-by-slot picks and notes                                                                                        |
| `factory/decisions.md`         | Every owner/factory decision, dated                                                                                             |
| `factory/specs/`               | The work orders themselves, including the four direction briefs (WO-003 to WO-006)                                              |
