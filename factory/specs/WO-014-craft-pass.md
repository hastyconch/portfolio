---
id: WO-014
title: Craft pass — tokens, plain language, states and motion (ui-craft)
phase: 5
gate: human
agent: builder
depends_on: [WO-007, WO-013]
touches:
  - src/system/**
  - src/pages/**
  - src/content/profile.json
  - src/content/resume.json
  - tests/e2e/**
---

## Goal

Feedback said the site "looks like AI slop". Apply the `ui-craft` skill
(`~/.claude/skills/ui-craft`, see `SKILL.md`, `references/*` and `tokens/craft.css`) to the whole
site, following constitution Article 12. Keep the colour tokens, Bricolage + DM Sans, the hero
album cover, the scroll progress bar, the Work layout and the demos. Make it look designed rather
than generated.

1. **Tokens.**
   - Create `src/system/tokens.css` from `tokens/craft.css`, tuned to this design: about 9 type steps
     (keep Bricolage's condensed width for the one display moment), `--space-*`, radius 4/8/12/full,
     three elevations, and the motion tokens. Import it in `Shell.astro`.
   - Replace every literal font-size, line-height, letter-spacing, radius, shadow, duration and easing
     in `src/system/**` and `src/pages/**` with tokens.
   - Add one `.label` utility and use it for every eyebrow (there are about 29 hand-rolled ones).
2. **Pull the metaphor back** (keep it on the hero cover and in `Music.astro`, `Lyrics.astro`,
   `SongArt.astro`, `Players.astro` and `pages/music/[id].astro`).
   - **`Nav.astro`:** plain links (Work, Projects, Music, Résumé, Contact), no "Now playing"
     readout, no side letters. Keep the progress bar and the small disc mark (one turn on hover).
   - **`SideHead.astro`:** replace it with a quieter section header without the vinyl badge or
     count line. Vary it per section so Work, Projects and Résumé don't repeat one giant title.
   - **`Hero.astro`:** keep the cover; drop "33⅓" and track-style counts. Rewrite the
     three-pillar "value props" block into something specific (see copy below).
   - **`ProjectCard.astro` / `Projects.astro`:** cover art without the peeking vinyl, plain copy
     ("Projects", not "Side B" or "sleeves").
   - **`CaseStudyLayout.astro`:** section names Problem, What it does, Roadmap, Stack, Engineering
     notes; plain pager copy; no vinyl.
   - **`Resume.astro`:** a plain heading, no ℗.
   - **`Footer.astro`:** "Get in touch", no ℗; remove the unverified "WCAG 2.2 AA" badge. The
     name barcode can stay.
   - **`pages/404.astro`:** plain copy.
   - **`Work.astro`:** "Side A" and "A1" numbering become plain (keep the layout).
3. **Remove the slop.**
   - Delete the `.mu-glow` blob and the footer glow, and the gradient wash on the case-study pager.
   - Keep grain only on the hero cover.
   - Make the Music colour change a real cross-fade: `@property`-registered colours, or a layered
     opacity fade.
   - Limit pills to tags and chips; buttons and links use the radius tokens.
   - Reserve the accent orange for links, focus and one highlight per view.
4. **Hierarchy.**
   - The hero h1 is the only display size. Section titles use 2xl and item titles xl.
   - Paragraphs are capped at about 68ch.
   - Remove counts that add nothing.
5. **States and motion.**
   - Every interactive element gets hover, `:focus-visible` and `:active` parity. Write hover and
     focus together with `:is(:hover, :focus-visible)`. Buttons press with `scale(var(--press-scale))`.
   - Transitions name their properties and use the motion tokens.
   - Add one CSS-only section reveal (`animation-timeline: view()`) as progressive enhancement,
     off under reduced motion.
6. **Copy** (`profile.json`, `resume.json`).
   - Make the hero pillars and the consulting phrasing concrete: specific nouns, no
     "rewire/lifecycle/safely and measurably".
   - Mark the changed entries `status: placeholder` so the owner reviews them.
   - No em dashes (Article 11).

## Acceptance criteria

- [ ] `npm run craft` passes the `.craftrc.json` budgets [check]
- [ ] No record vocabulary outside the hero cover and the music files ("Side A/B", "tracklist", "liner notes", "Now playing", "℗", "Thanks for listening", "bonus track" outside Music) [review]
- [ ] Every page passes axe (serious/critical) in light and dark at 375 and 1440, with no overflow [axe]
- [ ] Reduced motion: no running animations longer than 0.01s; no looping animations [e2e:reduced motion: no running animations longer than 0.01s]
- [ ] Lighthouse budgets met on every page [lighthouse]
- [ ] No em dashes [check]
- [ ] Before/after screenshots reviewed by the design-critic, using the ui-craft checklist [review]
- [ ] Owner signs off on the preview [owner]

## Out of scope

- The demos' internals (`src/demos/**`), the content model and new features.

## Notes

- Before screenshots: `factory/out/craft/before/` (production). Shoot after screenshots with
  `node factory/out/craft/shoot.mjs http://localhost:<port> factory/out/craft/after`.
- Baseline audit: 52 font sizes, 21 line-heights, 14 letter-spacings, 14 radii, 11 shadows,
  16 hovers with no focus twin, 5 presses with no active state, 11 pills, 3 big blurs.
- Run gates with `PW_PORT=4371 npm run gates -- --quick` while iterating, then once in full.
