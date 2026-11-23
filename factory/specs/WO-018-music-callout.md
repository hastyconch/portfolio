---
id: WO-018
title: Music — a lyrics call-out instead of opening lines; fix the vinyl flash
phase: 6
gate: human
agent: builder
depends_on: [WO-014]
touches:
  - src/system/Music.astro
  - src/system/SongArt.astro
  - src/system/Lyrics.astro
  - src/pages/music/**
  - tests/e2e/music.spec.ts
---

## Goal

- **Replace "Opening lines"** on the home page with a designed call-out that sends visitors to
  the lyrics and stories: for example a card with the song title, "Read the lyrics and the
  stories behind the lines", and a clear link to `/music/<id>/`. Keep it in the Music section's
  record style.
- **Fix the vinyl flash.** The owner says: "when I'm clicking into them, sometimes it shows the
  old vinyl and then flashes the new vinyl on top". Reproduce it on the home page (switching
  song tabs) and on song pages (navigating between songs, back/forward). Find the cause. Likely
  suspects:
  - lazy-loaded art appearing after the slide animation starts;
  - the previous panel's art still visible during the switch;
  - `@property` tint cross-fades lagging behind;
  - bfcache restoring an old frame.

  Fix it so a song's cover and vinyl appear together, once. Keep the slide-out animation the
  owner likes, off under reduced motion.

## Acceptance criteria

- [ ] Home Music shows no lyric lines; each song has one call-out link to its page [e2e:music home shows a lyrics call-out]
- [ ] Switching tabs never shows another song's art or vinyl, even for one frame (check animation and image load order with a Playwright trace or frame screenshots) [e2e:music tab switch shows only the selected song art]
- [ ] Annotator keyboard tests on song pages still pass [e2e:music annotator is keyboard operable]
- [ ] axe clean, light and dark; Lighthouse LCP < 2s on song pages [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- Song content and other sections.

## Notes

- Run gates with `PW_PORT=4384 npm run gates -- --quick`.
