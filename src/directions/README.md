# Design directions — the slot contract (Phase 1)

Four directions (A–D) render **the same content** so the owner can mix and match slots.
Each direction lives entirely in `src/directions/<x>/` plus its routes in `src/pages/lab/<x>/`.
Nothing outside those two folders may be edited by a direction builder.

## Routes each direction must ship

| Route                      | What                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| `/lab/<x>/`                | The full one-page home: every section below, nav, footer                 |
| `/lab/<x>/<project-slug>/` | Case-study page for **every** project (`getStaticPaths` over `projects`) |

## Section ids (required — `/lab` deep-links to them)

`#hero` · `#work` · `#projects` · `#music` · `#resume` · `#contact` (see `SLOT_IDS` in `src/lib/content.ts`).

## Slots (each a component in `src/directions/<x>/`)

| Slot              | Contents                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Nav`             | Site navigation; must work at 375px (menu pattern of your choice) and 1440px. Keyboard operable.                                                                                                                                                                                                                                                                                                              |
| `Hero`            | `profile.name`, `headline`, `roleLine`, `intro`, `pillars`.                                                                                                                                                                                                                                                                                                                                                   |
| `Work`            | All `work` entries. Entries with `demo: airline` embed `<AirlineDemo client:visible />` in **your** `DemoFrame`. Others show a "demo coming" treatment if `demo !== 'none'`.                                                                                                                                                                                                                                  |
| `DemoFrame`       | The chrome around demos — phone (`demoFrame: phone`), desktop window (`desktop`) or diagram (`diagram`).                                                                                                                                                                                                                                                                                                      |
| `ProjectCard`     | One card per project: title, tagline, category, platforms, a hint of the stack; links to its case study.                                                                                                                                                                                                                                                                                                      |
| `CaseStudyLayout` | The project page: problem, features, `planned` (clearly labelled "On the roadmap"), stack table (layer · tech · why), engineering notes.                                                                                                                                                                                                                                                                      |
| `Music`           | Story intro (2020, writing and producing with Sergei, published on streaming), song list with art (gradient from `artColors`), and a **lyrics annotator**: lyric lines with a `note` are buttons; selecting one shows the annotation (side panel on desktop, sheet/inline on mobile). Show `meaning`. Spotify/YouTube: a click-to-load placeholder button only — never load third-party iframes on page load. |
| `Resume`          | `resume` collection as an HTML résumé (print-friendly is a bonus).                                                                                                                                                                                                                                                                                                                                            |
| `Footer/contact`  | `profile.links`, id `contact`.                                                                                                                                                                                                                                                                                                                                                                                |

## Data

```ts
import { getSiteContent } from '../../lib/content';
const { profile, resume, work, projects, songs } = await getSiteContent();
```

Never hard-code copy. Entries with `status: placeholder` must show a small, tasteful
"placeholder" marker so the owner can see what still needs real content.

## Rules (constitution excerpts)

- Pages use `src/layouts/Base.astro` (skip link, focus, reduced motion). Put your fonts/tokens
  in the `head` slot or import a stylesheet; exactly **one `<h1>` per page**.
- WCAG 2.2 AA in light **and** dark (`prefers-color-scheme`), 375 and 1440, no horizontal scroll.
- Fonts: self-hosted `@fontsource*` packages already installed (Fraunces, Inter, JetBrains Mono,
  IBM Plex Sans/Mono, Bricolage Grotesque, DM Sans). No Google Fonts or other CDNs.
- JS: prefer zero. Islands only where interaction needs it (`client:visible`). ≤ 100 KB per route.
- Anonymity: no real client names, logos or brand colours — the content is already anonymized.
- Honesty: render `planned` as roadmap, never as shipped.
- Add `noindex` to every lab page (`<Base noindex>`).
