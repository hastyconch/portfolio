# Design system — Liner Notes

Built in Phase 2 (WO-007) from the owner's Phase 1 picks in `factory/picks.yaml`:
direction D (Liner Notes) for the look and most sections, with direction A's organisation
for Work. Motion level: calm (one-shot entrances, no looping animation).

| Component                 | What                                                                   |
| ------------------------- | ---------------------------------------------------------------------- |
| `Shell`                   | Base layout, fonts, tokens (`liner.css`), Nav and Footer               |
| `Nav`                     | Sticky "now playing" bar; menu on phones                               |
| `Hero`                    | Album-cover intro                                                      |
| `Work`                    | Side A: engagements with a sector / company / role column, demo inline |
| `DemoFrame`               | Phone, desktop window or diagram chrome; `coming` state                |
| `Projects`, `ProjectCard` | Side B: record-sleeve rail                                             |
| `CaseStudyLayout`         | `/projects/<slug>/` pages                                              |
| `Music`                   | Bonus tracks: songs and the lyrics annotator                           |
| `Resume`                  | HTML résumé with print styles                                          |
| `Footer`                  | Contact (`#contact`)                                                   |

All copy comes from `getSiteContent()` (`src/lib/content.ts`). Placeholder content shows the
`Placeholder` marker; `planned` items are labelled "On the roadmap".
