---
id: WO-030
title: Music and résumé polish: a title that leads, honest player copy, readable lyrics, a clearer download
phase: 10
gate: human
agent: builder
depends_on: [WO-026]
touches:
  - src/system/Music.astro
  - src/system/Players.astro
  - src/system/Lyrics.astro
  - src/pages/music/[id].astro
  - src/system/Resume.astro
  - public/resume.pdf (generated)
  - factory/stations/resume-pdf.hash (generated)
  - tests/e2e/music.spec.ts
  - tests/e2e/gates.spec.ts (the "resume pdf" test only)
---

## Goal

These come from the third round of audits on the live site, after Phase 9 (`factory/out/audit3/`).

1. **P2: the Music lead still outweighs the "Music" title.**
   - At 1440 the lead is 24px across about 860px, over two lines. On phones it is 20px over four lines.
   - The title is 36px on desktop and 28px on phones.
2. **P3: "Read the full lyrics" competes with the song title.** The call-out is 20px display bold, the same size and weight as the song title.
3. **P3: the lyrics link's accessible name has a stray space.**
   - It reads "Read the full lyrics : Roadhouse".
   - The visually-hidden span sits right after the text, but `.visually-hidden` is `position: absolute`, so Chromium treats it as a block and adds a space (Music.astro:141-143). This is the same bug WO-026 fixed on the Spotify button.
4. **P3: the song page's YouTube row contradicts itself.** "Link coming. Player loads on click." appears on a control that does nothing.
5. **P3: on phones, wrapped lyric lines look like new lines.**
6. **P3: the song page pager labels sit 4px inside their rule.**
   - "Previous track" starts at x = 144 against a rule starting at 140.
   - `.sg-pg` has `padding: var(--space-5) var(--space-1)`.
7. **Minor (accessibility): with no JS, the Music panels keep `role=tabpanel`** while the tablist is `display: none`, so they are tab panels with no tabs (Music.astro:117).
8. **Advisory: "Download PDF" is vague out of context.** It sits beside "Print résumé". Separately, the PDF's tag tree has no H1: "Résumé" is tagged H2, and the name is not a heading.

## Design

- **The title leads.**
  - The Music lead (`.mu-lead` or the story's first line) drops to `--text-lg` at ≥ 900px and `--text-md` on phones. Cap it at the measure (about 60ch).
  - It must read as a dek under the title, not compete with it.
- **The call-out is a link, not a title.** "Read the full lyrics" goes to `--text-md` at weight 600, keeping the → and the hover / focus-visible / active states.
- **Clean names.**
  - Every link or button that appends a visually-hidden ": {title}" must produce a name with no space before the colon.
  - Use the same approach WO-026 took in Players: `aria-label`, or an inline hidden span that isn't positioned.
  - Check Music, Players and the song page.
- **Honest player copy.**
  - When a service has no URL, the row says only the placeholder marker: "Link coming", or the existing Placeholder. Drop "Player loads on click".
  - Keep the song page showing every service.
  - **Owner copy:** list the before/after text in your report.
- **Readable lyrics.** `.ly-line` and `.ly-hl` get a hanging indent (`padding-left: 1em; text-indent: -1em`), so a wrapped line reads as a continuation. Check it in light and dark at 375.
- **Pager alignment.** `.sg-pg` labels align with their rule: zero inline padding, with the hover background given room by a negative margin, as the footer does.
- **No-JS panels.** The server renders the panels as plain regions or articles. The script adds `role="tablist"`, `tab` and `tabpanel` (and the `aria-*` links) when it runs. Keep the Phase 9 no-JS behaviour, where every panel shows.
- **A clearer download.**
  - The link reads "Download résumé (PDF)", matching "Print résumé". It keeps `download="Nakul-Iyer-Resume.pdf"` and its primary styling. **Owner copy:** flag it in your report.
  - In the print view, the name becomes the H1 and "Résumé" an H2 under it, so the PDF's tag tree starts with H1. The screen view's heading levels don't change; do this with a print-only element or print-only markup.
  - Regenerate with `npm run resume:pdf`, and confirm `npm run resume:check` passes.
  - Keep it at 2 pages, tagged, with `/Title` and `/Lang`, and keep the "Draft: some details to come" line while the résumé is a placeholder.
- **Song page header (WO-029 hook).** WO-029 gives the song page header the dark band treatment. If it reports needing a prop or a class from `src/pages/music/[id].astro`, I'll add that one line at integration. Don't change the header yourself.

## Constraints

- Constitution Art. 12: tokens only, state parity, motion vocabulary. Art. 11: no em dashes.
- Keep the placeholder markers.
- CLS < 0.05 and LCP < 2s on home and every song page. Tab switches must not shift the page above the panel.
- WO-028 (Hero, Work, demos) and WO-029 (Nav, Base, Projects, ProjectCard, CaseStudyLayout, billable.astro) run in parallel. Stay out of their files. In `gates.spec.ts`, change only the "resume pdf" test.

## Acceptance criteria

- [ ] The Music lead's computed font size is less than the section title's, and is at most `--text-lg` at 1440 and `--text-md` at 375 [e2e:music heading leads]
- [ ] "Read the full lyrics" is smaller than the song title [e2e:music call-out is a link]
- [ ] No accessible name in Music, Players or the song page contains " :" [e2e:music names have no stray space]
- [ ] On /music/roadhouse/, no player row contains "loads on click" while it has no URL [e2e:music players]
- [ ] With JS disabled, no element in Music has `role=tabpanel` or `role=tab`, and every panel shows. With JS, the tablist keyboard tests pass [e2e:music]
- [ ] On a song page at 1440, the "Previous track" text's left edge is within 1px of its rule's left edge [e2e:music pager aligns]
- [ ] The résumé download link reads "Download résumé (PDF)". The PDF is 2 pages, tagged, and its first heading tag is H1. `npm run resume:check` passes [e2e:gates resume pdf]
- [ ] axe clean, light and dark; Lighthouse budgets on home and a song page [lighthouse]
- [ ] Owner sign-off, including the two copy changes [owner]

## Out of scope

- New song content, stories or lyrics. The song page header (WO-029).
- The hero (WO-028).

## Notes

- Run gates with `PW_PORT=4403 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence: `factory/out/audit3/` (`crit/`, `a11y/names.mjs`, `a11y/pdfcheck.py`, `verify2.mjs`).
