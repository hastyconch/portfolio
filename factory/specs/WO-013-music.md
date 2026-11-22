---
id: WO-013
title: Music — story, song pages and a reusable lyrics annotator
phase: 4
gate: human
agent: builder
depends_on: [WO-007]
touches:
  - src/system/Music.astro
  - src/system/Lyrics.astro
  - src/system/SongArt.astro
  - src/system/Players.astro
  - src/lib/music.ts
  - src/pages/music/**
  - src/pages/index.astro
  - tests/e2e/music.spec.ts
---

## Goal

Turn the Music section into Phase 4's music showcase. All copy comes from content: the story in
`src/content/music.json` and the songs in `src/content/songs/*.md`.

The home page's **Music** section:

- opens with the music story, rendered from `music.story` paragraphs.
- names the collaborator only when `music.collaborator.named` is true; otherwise it says "a friend".
- fixes the duplicated "Since" fact.
- keeps the song tabs, and links each song to its own page.

Each song gets a page at `/music/<id>/` with:

- art: `art` image when present, otherwise the `artColors` gradient sleeve,
- title, year and credits,
- the "About this song" meaning,
- click-to-load Spotify/YouTube players, with no third-party requests before the click,
- the full lyrics annotator,
- previous and next song links.

Extract the annotator into `src/system/Lyrics.astro` so the home section and the song pages share
it. Lines with a `note` are buttons: a side panel on desktop and an inline sheet on mobile, with
focus moving to the note and Esc / Close returning it. Extract the art or gradient sleeve into
`SongArt.astro`.

## Acceptance criteria

- [ ] Story paragraphs render from `music.json`; the collaborator's name appears only when `named` is true [e2e:music story renders from content]
- [ ] `/music/<id>/` exists for every song, linked from the home Music section [links]
- [ ] Each song page renders without console errors or horizontal overflow at 375 and 1440 [e2e:route /music/song-01/ renders without console errors or horizontal overflow]
- [ ] Annotated lines open their note by keyboard; Esc returns focus to the line [e2e:music annotator is keyboard operable]
- [ ] No request to Spotify/YouTube domains before a player button is pressed [e2e:music players load only on click]
- [ ] Zero serious/critical axe violations on the home page and every song page, light and dark [axe]
- [ ] Lighthouse budgets met on every song page [lighthouse]
- [ ] Placeholder songs and story keep the visible placeholder marker [review]

## Out of scope

- Real lyrics, links and art (owner content); content model changes (already in `src/content.config.ts`).

## Notes

- Design system: `src/system/` (Liner Notes); the current annotator lives in `src/system/Music.astro`.
- Run gates with `PW_PORT=4361 npm run gates -- --quick`. Run `npm ci` first if `node_modules` is missing.
