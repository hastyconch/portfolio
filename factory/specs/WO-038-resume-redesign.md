---
id: WO-038
title: Résumé redesign: a designed page with colour and a clear rhythm, landing like every other section
phase: 12
gate: human
agent: builder
depends_on: [WO-030]
touches:
  - src/system/Resume.astro
  - public/resume.pdf
  - factory/stations/resume-pdf.hash
  - tests/e2e/polish.spec.ts (new résumé tests only)
  - tests/e2e/gates.spec.ts (résumé tests only)
---

## Goal

The owner, after Phase 11: the HTML résumé "looks really bland, like really, really bland, and the spacing is really bad. Make it well designed, like add some color. Just figure out a way to make it visually appealing instead of a super bland resume."

What's there now (`factory/out/audit5/resume-1440.png`):

- **Above the content:** a 36px "Résumé" title, a placeholder chip and the two actions, then the summary.
- **Below:** an Experience column of rows (date, employer, role, dash bullets) beside Capabilities and Education. Everything is ink on cream, divided by hairlines.
- **Spacing:** the section's top padding is 120px, the biggest of any section, so a header click lands its title at y = 180 where Work lands at 108. The space inside it has no rhythm: the summary sits close under the actions, there are long empty runs down the right column, and the bullets are evenly grey.

## Design

You have room to redesign. Look at well-designed résumés and CV pages for direction: designer and product résumés on Read.cv-style profiles, and editorial CV layouts. Keep it the owner's site:

- the Liner Notes palette and fonts;
- the accent used as an accent;
- one strong idea, not decoration.

- **Colour with a job.** For example:
  - a coloured band or panel for the header (the name, the summary, the actions, the key facts);
  - the employer or the dates in the accent;
  - a timeline rail in colour;
  - capability groups as tinted panels with their own label colour.

  Use the site's colour tokens, or add a few named résumé tokens in this file that derive from them, with contrast ≥ 4.5:1 for text and ≥ 3:1 for UI, in light and dark.

- **Hierarchy.** Make clear steps from the section title to the employer and role to the bullets. The current role reads first. Bullets get a real marker and comfortable leading at `--measure`.
- **Rhythm.** Use the shared spacing tokens. The gaps from title to content, between entries, and between groups are consistent, with no dead columns. On ≥ 1000px, balance the side column so it doesn't end halfway down a long empty run: for example, a sticky side column, or Capabilities and Education moved into a header strip.
- **Landing.** WO-034 makes every section land its title at the same place, with a shared rule in liner.css. The target at 1440 × 900 is the title's top at y = 108 after the header's "Résumé" link, the same as Work. Meet it from this file: your section's top padding or `scroll-margin-top`. If WO-034's token is visible in your base, use it; otherwise use the number and leave a comment for the integrator.
- **Content.** Keep `resume.json` and `profile.json` as they are, and keep every placeholder marker visible (owner decision). Don't invent roles, dates, schools or contact details.
- **Print and PDF still work.** The print view stays plain enough to print: colour may carry over as ink-friendly accents. It stays two Letter pages or fewer, and the name stays the level-1 heading in print (WO-030). Regenerate `public/resume.pdf` with `npm run resume:pdf` after the build, so the `resume pdf` gate's hash matches.

## Constraints

- Constitution Art. 12: tokens only, state parity, motion vocabulary. Art. 11: no em dashes.
- **Keep:**
  - the `#resume` id and the heading's `aria-labelledby` link;
  - "Download résumé (PDF)" as the primary action (ink fill, per the WO-031 button rule) and Print as the quieter one;
  - the file name `Nakul-Iyer-Resume.pdf`.
- LCP < 2000ms; no new script.
- WO-034 (liner.css, tokens.css, the other sections), WO-035 to WO-037 (demos) and WO-039 (projects) run in parallel. Stay out of their files. Only `Resume.astro` and the PDF files are yours.

## Acceptance criteria

- [ ] At 1440 × 900 after the header's "Résumé" link, the title's top is at 108 ± 2px. At 375 × 812 it matches Work's landing ± 2px [e2e:polish résumé lands like the other sections]
- [ ] The résumé uses at least two colour roles besides ink on cream (for example a tinted panel and an accent), all text ≥ 4.5:1 in light and dark [e2e:polish résumé has colour with contrast]
- [ ] At 1440, neither column ends more than 240px above the other at the end of the section [e2e:polish résumé columns balance]
- [ ] Every placeholder marker in the résumé is still rendered [e2e:gates résumé keeps its placeholders]
- [ ] The print view is two Letter pages or fewer, and the `resume pdf` gate passes [check]
- [ ] A design-critic pass on 375 and 1440, light and dark, reports no "bland" or spacing findings above minor [review]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off on the design [owner]

## Out of scope

- The résumé's content (owner content), and the other sections' spacing (WO-034).

## Notes

- Run gates with `PW_PORT=4418 npm run gates -- --quick`, and the full gates before handing back.
- Use the `ui-craft` skill and the `design-critic` agent for the critique loop. Save before and after screenshots to `factory/out/p12/resume/`.
