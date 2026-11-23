---
id: WO-019
title: Wayfinding: know which section you are in, move between siblings, and transitions that carry you
phase: 7
gate: human
agent: builder
depends_on: [WO-015, WO-017]
touches:
  - src/system/Nav.astro
  - src/system/Shell.astro
  - src/system/Work.astro
  - src/system/Projects.astro
  - src/system/ProjectCard.astro
  - src/system/CaseStudyLayout.astro (everything except the `#play` section and the `.cs-play` rules)
  - src/system/liner.css
  - src/content.config.ts (work: optional `short`)
  - src/content/work/*.md (add `short` only)
  - src/pages/index.astro
  - src/pages/projects/[slug].astro
  - tests/e2e/wayfinding.spec.ts (new)
  - tests/e2e/work.spec.ts
  - tests/e2e/projects.spec.ts
---

## Goal

The owner says:

> "Once I scroll past Work and I'm on the airline loyalty program, I want to see, maybe it's the
> way that the navigation is highlighted that shows that I'm within Work, or some sort of label
> on the page on the left hand side that says that I'm within Work. And while I'm within an
> experience such as Work, I want to be able to navigate to the other work things… and I want
> the transition to be visually appealing. Same with projects… In order to go to another project,
> I need to click All projects, watch it scroll all the way down, and then I need to click Felt &
> Tiles."

Today the header carries no sense of place. Each Work pane reads as a standalone page. The only
way between case studies is the pager at the very bottom, or the long trip back home.

## Design

### 1. The header says where you are: a breadcrumb on the left

- **The crumb.** It sits after the brand, on the header's left: `Nakul Iyer / Work`, and inside a
  Work pane `Nakul Iyer / Work / Grocer loyalty`.
  - The header keeps its 60px height. Work panes are sized against `--ln-header`, so the height
    must not change.
  - The section part links to its anchor. The item part is plain text with
    `aria-current="location"`.
- **Short names.** Add an optional `short` field to the work schema and set it on the four demo
  engagements: Airline loyalty, Grocer loyalty, Healthcare scheduling, AI program management. The
  crumb falls back to `title` when `short` is missing.
- **Home page.** The crumb follows the section in view: Work, Projects, Music, Résumé, Contact.
  The hero shows no crumb.
- **Case study pages.** The crumb is static: `Nakul Iyer / Projects / Billable.`.
- **When the crumb text changes,** it moves as one short vertical slide plus fade: 250ms,
  `--ease-out`, about 6px of travel. It is an instant swap under reduced motion.
- **Screen readers** don't hear every change. The crumb is not a live region; `aria-current`
  carries the state.

### 2. The nav link for the current section is marked

- On the home page, the nav link for the section in view takes the active style. Use the hover
  style's 2px underline in `--ln-accent` and full ink colour, so the current place is legible at a
  glance. It also gets `aria-current="true"`.
- On case study pages, "Projects" is marked. On song pages, "Music" is.
- The phone menu marks the same item.

### 3. Move between siblings without leaving

- **A stepper beside the item crumb:** `‹ 2 / 4 ›`, previous and next buttons with names like
  "Previous engagement: Airline loyalty".
- **A jump list.** The item crumb is the trigger for a small list of all siblings. Use a popover
  (`popover` attribute plus a button), or `<details>` if that is simpler and robust.
  - **In Work:** the four demo engagements, then "More client work".
  - **On case studies:** every project, each with its cover thumbnail (reuse the card art at
    40px) and format. The current one is marked.
  - Escape closes it, focus returns to the trigger, and arrow keys are optional.
- **In Work,** previous and next scroll the target pane into view. Use smooth scrolling where
  motion is allowed; the snap does the settling. Move focus to the pane's heading with
  `preventScroll` so keyboard users land in the right place.
- **On case studies,** previous and next go to the adjacent project in the projects order. The
  bottom pager stays.
- **Phones (< 760px):** keep the crumb (section, or section / project on case studies). Drop the
  stepper, but keep the jump list on case studies, because that is the complaint. The phone menu
  is unchanged apart from marking the current item.

### 4. Transitions that carry you

- **Cross-document view transitions in CSS only:** `@view-transition { navigation: auto; }`,
  inside `prefers-reduced-motion: no-preference`. No ClientRouter and no JS router; this is
  progressive enhancement, and browsers without it navigate normally.
- **The header is named** (`view-transition-name: site-header`) so it holds still while the page
  changes underneath it.
- **Between case studies:** the main content slides about 24px and cross-fades, 250 to 400ms.
  - Direction follows prev/next if that is achievable without a JS router: for example
    `pagereveal` / `pageswap` plus `ViewTransition.types` set from `navigation.activation`, or a
    `?from=prev` signal. Keep it under 1 KB.
  - If direction is not achievable cleanly, one neutral direction is fine. Note which you chose.
- **Projects card → case study hero:** the card's cover art and the case study hero art share a
  `view-transition-name` per project (`art-<id>`), so the art grows into place. Only the clicked
  card's art may carry its name at navigation time; duplicate names on one page abort the
  transition. Set the name on click, or give each card its unique `art-<id>`.
- **Work pane to pane:** the panes already scroll and snap. Leave the per-pane entrance alone
  beyond what exists.
- **Reduced motion:** no slides or morphs anywhere. Instant swaps are fine.

### 5. Case study "On this page" knows where you are

- The table of contents marks the section in view: accent edge and ink colour, plus
  `aria-current="true"`. Use the same observer as the nav.

## Constraints

- Constitution Art. 12 (ui-craft): tokens only, hover / focus-visible / active parity, the
  motion vocabulary, and the effect budget. Art. 11: no em dashes.
- **JS:** one small vanilla module shared by the header, stepper and ToC, using
  IntersectionObserver and no framework. The Lighthouse script budget (≤ 100 KB) and LCP < 2s
  on every page still hold.
- **Work panes:** the sizes and the scheduler / pipeline fit tests (`demo-fit.spec.ts`) must not
  change.
- **No layout shift** (CLS < 0.05). The crumb area reserves its width; no reflow of the nav links
  as the crumb text changes. Use ellipsis truncation at narrow widths.
- **Phones at 375:** no horizontal scroll, and the brand plus crumb plus menu button fit on one
  line.
- Consult `~/.claude/skills/ui-craft` (states, motion) and the navigation section of
  `~/.claude/skills/ui-ux-pro-max/references/quick-reference.md` (§9: active state, back behaviour,
  deep links).

## Acceptance criteria

- [ ] Scrolling into Work marks the "Work" nav link and shows `Work` in the crumb; inside a pane, the crumb shows that engagement's short name [e2e:wayfinding work crumb follows the pane]
- [ ] Next and Previous in the stepper move to the adjacent pane and the crumb follows; focus lands on the pane heading [e2e:wayfinding stepper moves between engagements]
- [ ] On a case study, the jump list lists every project with the current one marked, and choosing Felt & Tiles from Billable navigates there in one step [e2e:wayfinding project switcher]
- [ ] The case study ToC marks the section in view [e2e:wayfinding toc marks section]
- [ ] The view-transition CSS is present and wrapped in reduced-motion no-preference; no duplicate `view-transition-name` on any page [e2e:wayfinding no duplicate transition names]
- [ ] 375 × 812: no horizontal overflow; the header stays one line [e2e:gates]
- [ ] axe clean, light and dark; Lighthouse budgets on home, a case study and a song page [lighthouse]
- [ ] craft and copy gates pass [gates]
- [ ] Owner sign-off on the preview [owner]

## Out of scope

- The Billable room's Goal / Controls layout (WO-020).
- Changing Work pane sizes or the demos.

## Notes

- Run gates with `PW_PORT=4391 npm run gates -- --quick`, and the full gates before handing back.
