# Design system: Liner Notes

Built in Phase 2 (WO-007) from the owner's Phase 1 picks in `factory/picks.yaml`, and given a
craft pass in WO-014 (constitution art. 12, the `ui-craft` skill). Motion level: calm (one-shot
entrances, no looping animation).

- **Tokens:** type, space, radius, elevation and motion in `tokens.css`; colour in `liner.css`.
  Components use the tokens; the few literals left (cover-art type sized in `cqi`) say why.
- **One eyebrow:** the `.label` utility.
- **Record theme:** only on the hero cover and in Music (`Music`, `Lyrics`, `SongArt`,
  `Players`, `pages/music/[id].astro`). Everywhere else uses plain language.
- **States:** every interactive element has hover, `:focus-visible` and `:active` styles;
  transitions name their properties.

| Component                 | What                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| `Shell`                   | Base layout, fonts, `tokens.css`, `liner.css`, Nav and Footer         |
| `Nav`                     | Sticky header: name, section links, reading progress; menu on phones  |
| `Hero`                    | Album-cover intro (the one display moment) and what I do              |
| `SideHead`                | Section header: title, optional lead and actions, in two shapes       |
| `Work`                    | Engagements with a sector / company / role column, demo inline        |
| `DemoFrame`               | Phone, desktop window or diagram chrome; `coming` state               |
| `Projects`, `ProjectCard` | Cover-art cards in a rail (a list on phones)                          |
| `CaseStudyLayout`         | `/projects/<slug>/` pages                                             |
| `Music`                   | Songs and the lyrics annotator; the section tint cross-fades per song |
| `Resume`                  | HTML résumé with print styles                                         |
| `Footer`                  | Contact (`#contact`)                                                  |

All copy comes from `getSiteContent()` (`src/lib/content.ts`). Placeholder content shows the
`Placeholder` marker; `planned` items are labelled "Planned".
