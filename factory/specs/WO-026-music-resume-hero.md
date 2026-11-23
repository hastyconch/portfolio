---
id: WO-026
title: Music, players and the résumé: one cover per screen, one Spotify control, a résumé that prints to two pages
phase: 9
gate: human
agent: builder
depends_on: [WO-022, WO-024]
touches:
  - src/system/Music.astro
  - src/system/Players.astro
  - src/pages/music/[id].astro
  - src/system/Hero.astro
  - src/system/Resume.astro
  - factory/stations/resume-pdf.mjs
  - factory/stations/resume-pdf.hash (generated)
  - public/resume.pdf (generated)
  - tests/e2e/music.spec.ts
  - tests/e2e/gates.spec.ts
---

## Goal

These come from the second round of audits on the live site, after Phase 8.

- **P2: on a phone, Music shows the selected song's cover twice in about 150px.** It appears once in the strip and again as the large sleeve.
- **P2: Music's first story sentence is bold and heavier than the "Music" title.** The section headers should follow one pattern: Work's, with the title in the left column and the intro in the content column.
- **P2: "Play on Spotify" and an "Open on Spotify" text link sit stacked.** They are two controls for the same place.
  - Also cosmetic: the play button's name has a stray space, "Play on Spotify : Roadhouse" (Players.astro:37-38).
- **P2: "Email to come" sits in the hero's link row between two working links.** It reads as broken. The footer already says it.
- **P2: the résumé's actions.**
  - At 375 the Placeholder chip and "Download PDF" share a row, and "Print" is orphaned on the next.
  - At 1440, Download and Print carry equal weight.
  - The file saves as "resume.pdf".
  - The PDF runs to 3 pages, and page 1 holds only one role under a large "Résumé" title.
- **Moderate: the PDF has no structure tags and no language, and its title is the site title** (SC 1.3.1, 3.1.1).
- **Moderate: loading `/#song-<id>` selects the song but leaves the focus start point at the top** (SC 2.4.3). The first Tab jumps back to the page top.
- **Minor: the tablist doesn't match its layout.**
  - It is vertical at ≥ 900px with no `aria-orientation`.
  - On phones, a focused tab can be about 21px outside the strip, which clips its ring.
  - With text spacing at 320px, the 2-line clamp cuts "Don't Ask Me to Stay".
  - Without JS, only the first song's panel is reachable.

## Design

- **One cover on phones.** Below the strip breakpoint (900px), the panel does not repeat the selected cover at full size. Either drop the large sleeve on phones, or shrink it to a small sleeve beside the title (about 120px, with the record still peeking). Keep the full sleeve on laptops.
- **Header weight.** The story's first line uses the body weight at `--text-lg` (phones) or `--text-xl` (laptops). It doesn't need to be bold: "Music" must win. Keep the title-left, intro-right layout, which matches Work.
- **One Spotify control.**
  - Fold "Open on Spotify" into the player row as a small trailing link with an accessible name ("Open {title} on Spotify"), or drop it. The click-to-load button stays the primary control.
  - Fix the stray space in the name: "Play on Spotify: {title}".
  - On the song page, keep the "link coming" state for missing services. It is a placeholder marker the owner wants.
- **Hero links.**
  - Show only working links in the hero row: Résumé, See the work, and Email or LinkedIn once they are real.
  - A placeholder contact appears in the footer only.
- **Résumé.**
  - The actions get their own row under the heading.
  - "Download PDF" is the primary button; "Print" is a quieter text button.
  - The Placeholder chip sits on its own line or beside the heading, not between the buttons.
  - `download="Nakul-Iyer-Resume.pdf"`.
  - The print CSS fits the résumé on 2 Letter pages at the current content, without shrinking text below 9pt: a smaller print "Résumé" title, tighter section spacing, and `break-inside` kept.
  - Regenerate the PDF.
- **PDF accessibility.**
  - `page.pdf({ tagged: true, outline: true })`.
  - Before printing, set `document.title` to "Nakul Iyer, Résumé". There is no em dash, per Art. 11.
  - Check whether `/Lang` is written. If Chromium doesn't write it from `<html lang>`, note that in the hand-back; don't add a PDF library.
- **Song deep links.**
  - Loading `/#song-<id>` moves the focus start point into Music. Focus the selected tab with `preventScroll`, or give the section `tabindex=-1` and focus it after the scroll.
  - The next Tab continues inside Music.
- **Tablist.**
  - Set `aria-orientation` (vertical at ≥ 900px, horizontal below) from `matchMedia`, and update it when the media query changes.
  - Selecting a tab scrolls it into view in the strip (`scrollIntoView({ inline: 'nearest', block: 'nearest' })`). The strip's `scroll-padding-inline` covers the focus ring and its offset.
  - Replace the hard 2-line clamp with wrapping that survives text spacing: 3 lines, or no clamp.
- **No JS.** Render every panel visible in the HTML, and let the script hide the unselected ones. Without JS, all songs are reachable, stacked.

## Constraints

- Constitution Art. 12: tokens only, state parity. Art. 11: no em dashes.
- Section header pattern: WO-027 aligns Projects to Work's pattern. Don't touch SideHead.astro, Projects.astro or Nav.astro.
- WO-025 owns DemoFrame, Work and the demos. WO-027 owns Nav, ProjectCard, Projects, SideHead, Footer, CaseStudyLayout, 404 and liner.css.
- CLS < 0.05; with JS, hiding the unselected panels must not shift the layout (hide them in CSS before first paint, e.g. under `@media (scripting: enabled)` as WO-024's phone demos do, keyed on the selected tab, then hand over to `hidden` once the script runs).

## Acceptance criteria

- [ ] At 375 × 812, after a jump to `#music`, the selected song's art appears at full size at most once [e2e:music phone shows one cover]
- [ ] The Music story's first line has a lower font weight than the Music title [e2e:music heading matches sections]
- [ ] Each home panel has one link or button per service, and the play button is named "Play on Spotify: {title}" [e2e:music players]
- [ ] The hero has no placeholder contact item [e2e:gates contact links are honest]
- [ ] The résumé's Download link has `download="Nakul-Iyer-Resume.pdf"`. The PDF is 2 pages, tagged, and titled "Nakul Iyer, Résumé" [e2e:gates resume pdf]
- [ ] After loading `/#song-misfits`, the first Tab focuses an element inside `#music` [e2e:music remembers the song]
- [ ] The tablist's `aria-orientation` matches its layout at 375 and 1440. At 375, the focused tab is fully inside the strip after ArrowRight ×3 [e2e:music tablist orientation and strip focus]
- [ ] Without JS, every song panel is visible [e2e:music no-js shows every song]
- [ ] axe clean, light and dark; Lighthouse budgets on home and a song page [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- The real email, LinkedIn URL and any consulting offer (owner content).
- The song page's "link coming" player state (kept as a placeholder marker).
- Demos, Work, Nav, cards and footer (WO-025, WO-027).

## Notes

- Run gates with `PW_PORT=4397 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence (gitignored, main checkout): `factory/out/audit2/crit/`, `factory/out/audit2/a11y/music.mjs`, `pl.mjs`.
