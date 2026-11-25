---
id: WO-043
title: Résumé on phones: a third shorter, with bullets at a readable width
phase: 13
gate: human
agent: builder
depends_on: [WO-038]
touches:
  - src/system/Resume.astro
  - public/resume.pdf (only if the print view changes)
  - factory/stations/resume-pdf.hash (only if the print view changes)
  - tests/e2e/polish.spec.ts (résumé tests only)
---

## Goal

The mobile audit of Phase 12 (`/Users/nakuliyer/portfolio/factory/out/audit6/mobile-report.md`, finding 11; screenshots `/Users/nakuliyer/portfolio/factory/out/audit6/shots/resume-*.png`): the résumé is well built but very long on a phone.

- It is 2,992px at 375 (about 3.7 screens) and 3,364px at 320.
- Bullets are as narrow as 160px at 375 and 132px at 320, because the timeline indent and the rail take about 40px.
- Capabilities sit in two 132 to 160px columns, where a wrapped item looks like two items.
- The summary runs 9 lines at 320.

## Design

Under 760px only; ≥ 760px stays exactly as it is.

- **Fewer bullets first.** Each role shows its first 3 bullets; the rest sit behind "Show N more" (a `<details>` or a button with `aria-expanded`, no new script if `<details>` works). All bullets show in print and in the PDF.
- **Width for the text.** Cut the timeline indent to about 24px so bullets get at least 260px at 375 and 220px at 320.
- **Capabilities.** One column per group, items as an inline run separated by a middot or commas, so a wrapped item never looks like two.
- **Summary.** A 17px summary on phones (from the type tokens), so it is about 6 lines at 320.
- **Title.** Consider moving the "Résumé" title into the tinted panel on phones to save the gap above it; keep the landing at the same y as the other sections (WO-034's rule) and the `aria-labelledby` link.

## Constraints

- Keep `resume.json` and `profile.json` as they are, every placeholder visible, and no invented content.
- Print stays two Letter pages or fewer with all bullets; if the print view changes, regenerate the PDF with `npm run resume:pdf` after the build so the hash gate passes.
- Constitution Art. 11 and 12. No new script beyond `<details>` if you can.

## Acceptance criteria

- [ ] At 375 × 812 the résumé section is ≤ 2,100px tall with the extra bullets collapsed [e2e:polish résumé is short on phones]
- [ ] Every bullet is ≥ 260px wide at 375 and ≥ 220px at 320 [e2e:polish résumé bullets are readable on phones]
- [ ] "Show N more" reveals the rest, with the right state announced, and print shows every bullet [e2e:polish résumé more bullets]
- [ ] Titles still land at Work's landing ± 2px at 375 and 1440 [e2e:polish résumé lands like the other sections]
- [ ] At 1440 the résumé is unchanged (before and after screenshots) [review]
- [ ] axe clean, light and dark; Lighthouse budgets; the `resume pdf` gate passes [lighthouse]

## Out of scope

- The résumé's content, and anything ≥ 760px.

## Notes

- Gates: `PW_PORT=4423 npm run gates -- --quick`, the full gates before handing back. Screenshots to `/Users/nakuliyer/portfolio/factory/out/p13/resume/`.
