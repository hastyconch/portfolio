# The craft pass: from "AI slop" to designed

_2026-11-22. WO-014; constitution Article 12._

## The feedback

A reviewer said the live site "looks like AI slop". The owner shared seven references to raise the
bar: bencho, transitions.dev, BoardUI, ObsidianUI, Aceternity UI, Meta's Astryx and HorizonX.

## The reusable artifact

The references became a **Claude Code skill**, `ui-craft` (github.com/hastyconch/ui-craft),
installed at user level so every future project gets it.

- **What it carries:** rules and numbers only, no third-party code. That matters because
  Aceternity and HorizonX forbid redistribution, and HorizonX forbids training on its content.
- **The consensus it encodes:**
  - one ease, `cubic-bezier(0.22, 1, 0.36, 1)`, found independently in three references;
  - about 150ms for state changes, 250ms to open and 150ms to close;
  - press scale 0.97;
  - radius 4 / 8 / 12 / full, with concentric nesting;
  - a type scale with line-height tied to size;
  - full hover / focus / pressed parity on every control.
- **What's in it:**
  - a token file;
  - references on anti-slop, motion, typography, surfaces, states, effects, copy and sources;
  - a zero-dependency CSS auditor with budgets;
  - a screenshot-critic agent prompt.

## Measured before → after (craft audit, `src/system` + `src/pages`)

|                                          |  Before | After |
| ---------------------------------------- | ------: | ----: |
| Distinct font sizes                      |      52 |     2 |
| Line-heights / letter-spacings           | 21 / 14 | 0 / 0 |
| Radii / shadows                          | 14 / 11 | 0 / 1 |
| Durations / easings                      |   9 / 4 | 0 / 1 |
| Hovers with no focus state               |      16 |     0 |
| Pressable controls with no pressed state |       5 |     0 |
| Pills / decorative blurs                 |  11 / 3 | 0 / 0 |
| Token share                              |     48% |   99% |

## What changed on the page

- **The record metaphor moved back to where it means something:** the hero sleeve and the Music
  section. Gone elsewhere: "Side A/B", tracklists, "Now playing", ℗, and "Thanks for listening".
- **One display moment:** the name, in Bricolage's condensed width. Every other heading steps
  down clearly.
- **Work:** demo engagements first; the rest are a compact list with disclosures.
- **Projects:** flat colour swatches instead of generated covers.
- **Music:** an excerpt on the home page; full lyrics on each song's page.
- **Decoration removed:** the glow blobs, page-wide grain and the orange-to-indigo gradient. The
  cover is two warm tones taken from the accent.
- **Copy:** concrete wording, marked as placeholders for the owner to review. The owner kept every
  placeholder marker visible on purpose, to track what still needs writing.

## The loop

1. A builder agent made the first pass.
2. A fresh-context design critic rated it "mixed, leaning crafted (about 60%)" and listed the
   five biggest remaining problems.
3. The owner made two calls: keep the placeholder markers, and keep the nav disc but drop the
   footer barcode.
4. A second pass fixed the critic's list.

The craft audit now runs as a gate locally and in CI, with a separate budget for the demos.
