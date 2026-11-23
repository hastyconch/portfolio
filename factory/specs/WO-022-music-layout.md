---
id: WO-022
title: Music: a tracklist beside the selected song, a real heading, and a quieter panel
phase: 8
gate: human
agent: builder
depends_on: [WO-018, WO-021]
touches:
  - src/system/Music.astro
  - src/system/Players.astro
  - src/system/SongArt.astro
  - src/pages/music/[id].astro
  - tests/e2e/music.spec.ts
---

## Goal

The owner says:

> "Once you're on the music page, the top is cut off. Like there's space from the bottom of the
> projects piece. I feel like the music layout could be a little bit better."

The Phase 8 audits (UX/UI, usability, accessibility) measured this at 1440 × 900:

- **The heading.** The section's heading is a 12px label (`.mu-h2.label`), while Work, Projects and
  Résumé have 36px titles.
- **The tiles.**
  - Seven tiles sit in a 3-column grid, so song 07 is alone on its row.
  - The tiles read as cards, not as tabs.
  - Each cover carries a number badge.
- **The selected song is too far down.**
  - Its panel starts at y = 787, and below the fold at 1366 × 768.
  - On a phone the tiles take about 513px, so tapping song 5 or 6 changes a panel at y ≈ 1040 to 1090 that is not visible. The click seems to do nothing.
- **The panel stacks too many treatments:**
  - a label with a pill;
  - the title;
  - "Nakul" on a line of its own;
  - a release line;
  - a ruled About block;
  - a bordered "Liner notes" card with a second record beside the sleeve's record;
  - two player cards, one of them a dashed "YouTube · Link coming" box with the same weight as the working player.
- **Back loses the song.** From a song page, Back and the "All songs" link both return to song 1.

(The cream strip above the band after the nav click comes from `.ln-sec { scroll-margin-top }`
in liner.css. WO-023 owns that file and fixes it. This order owns the band's own top padding.)

## Design

- **Heading.** Music gets a section title at the same size and weight as the other sections'
  titles (`--text-2xl`, the display face), not a label. The story's first line stays as the dek.
  Cut the sentence that only describes the UI ("Below are the songs, with the lyrics and the
  stories behind the lines."), or keep only what isn't UI description.
- **Top padding.** Reduce the band's top padding so the title sits close under the header after a
  jump to `#music`. Use about `--space-7` to `--space-8`, not `--space-section`.
- **Laptops (≥ 900px): a tracklist beside the selected song.**
  - Lay out a stage of two columns: the selected song's panel on the left, `minmax(0, 1fr)`, and the tracklist on the right, about 20rem. Align them to the top.
  - The tracklist is one column of rows: number (tabular, its own column), a 40px cover, the title, and the year. Use a hairline between rows and no card borders.
  - The selected row has the highlight background and a 2px accent inset edge.
  - Remove the number badge that covers each cover.
  - The panel and the list both fit above the fold at 1440 × 900 after a jump to `#music`.
- **Phones (< 900px).** The tablist is a horizontal strip of covers with titles directly above the
  panel (`grid-auto-flow: column`, about 88px columns, `overflow-x: auto`, `scroll-snap-type: x proximity`).
  - It is about 130px tall, not 513.
  - After a tap, if the panel's top is below about 60% of the viewport, bring the panel into view with `scrollIntoView({ block: 'nearest' })`. Use smooth scrolling only when motion is allowed.
  - No horizontal page overflow.
- **A quieter panel.**
  - Merge the credits into the release line ("Nakul · Single · August 2020 · later on the Misfits EP"). Do the same on the song page.
  - The call-out becomes one primary link: "Read the full lyrics →", or the existing CTA wording, at `--text-lg`. Drop `.mu-call-disc` and the "Liner notes" label.
  - Its right edge aligns with the players row.
- **Players.**
  - In the home panel, show only the available players (`<Players song={s} onlyAvailable />`). The song page keeps showing every service and the "link coming" state.
  - Align `.pl-link` with the button's left edge.
  - Drop "Loads the … player" from the visible text and keep it in `aria-describedby`.
  - Each play button's accessible name includes the song title (visually hidden ": {title}").
- **Remember the song.**
  - Selecting a tab updates the URL with `history.replaceState` (`#song-<id>`, not a new history entry). On load, `#song-<id>` selects that tab and lands on the Music section.
  - The song page's "All songs" link points to `/#song-<id>`.
  - Back from a song page restores the song.
- **Keep:**
  - the tablist semantics (roving tabindex, arrows, Home/End, automatic activation);
  - the tint cross-fade (`--mu-tint`);
  - the "Appears on" section (listen only);
  - the placeholder markers;
  - the record metaphor, which belongs here (sleeve plus record).

## Constraints

- Constitution Art. 12: tokens only, state parity, no new effects. Art. 11: no em dashes.
- Don't touch `liner.css`, `Nav.astro` or other sections; WO-023 and WO-024 run in parallel.
- CLS < 0.05 and LCP < 2s on home and every song page. Tab switches must not shift the page above
  the panel.

## Acceptance criteria

- [ ] At 1440 × 900, after a jump to `#music`, the Music title, the whole tracklist and the top of the selected song's sleeve are in the viewport [e2e:music tracklist beside the panel]
- [ ] The Music title's computed font size equals the Work section title's [e2e:music heading matches sections]
- [ ] At 375 × 812, the tablist is one row, at most 160px tall. After tapping the 6th song, the panel's title is in the viewport [e2e:music phone strip shows the panel]
- [ ] Choosing a song sets `#song-<id>` without adding a history entry. Loading `/#song-<id>` selects it. Back from that song's page shows it selected [e2e:music remembers the song]
- [ ] The home panel shows no "link coming" player. Each play button's name includes the song title [e2e:music players]
- [ ] The existing music tests (tablist keyboard, players, call-out) still pass, updated where the structure changed [e2e:music]
- [ ] axe clean, light and dark; Lighthouse budgets on home and a song page [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- The anchor offset in liner.css (WO-023).
- New song content, stories or lyrics.

## Notes

- Run gates with `PW_PORT=4393 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence: `factory/out/audit/crit/`, `factory/out/audit/usability/` (gitignored).
