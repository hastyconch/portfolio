---
id: WO-024
title: Phones and exits: a shorter phone home, a first screen that says who, honest contact links, a résumé PDF
phase: 8
gate: human
agent: builder
depends_on: [WO-021]
touches:
  - src/system/Hero.astro
  - src/system/Work.astro (everything except the snap and scroll-margin rules, which WO-023 owns)
  - src/system/DemoFrame.astro
  - src/demos/airline/** (only what the 320px reflow needs)
  - src/system/Footer.astro
  - src/system/Resume.astro
  - src/system/CaseStudyLayout.astro (the hero meta "Play it" link only)
  - public/resume.pdf (generated)
  - factory/stations/resume-pdf.mjs (new)
  - factory/stations/resume-pdf.hash (generated)
  - factory/stations/gates.sh
  - .github/workflows/gates.yml
  - package.json (scripts)
  - tests/e2e/gates.spec.ts
  - tests/e2e/work.spec.ts (phone demo tests only; WO-023 owns the snap tests)
  - tests/e2e/demo-*.spec.ts (only to expand a collapsed demo first on phones)
  - tests/e2e/demo-billable.spec.ts
---

## Goal

The Phase 8 audits found several problems.

1. **On a phone, visitors never reach the owner's own builds.** The home page is 15,837px (19.5 screens): Work alone is 7,684px and Projects starts at 8,995px. On the first screen the cover takes about 60%, the name sits at 504px and the links are below the fold.
2. **Contact goes in a circle.** "Email ↗" and "LinkedIn ↗" (hero and footer) point to `#contact`, back to where you are, with an external-link arrow. The real links are still to come (`profile.json` status `placeholder`), and the owner will supply them.
3. **The résumé has no file.** There is only "Print résumé". Recruiters forward PDFs.
4. **The home page scrolls sideways at 320 CSS px** (WCAG 1.4.10). `.df-device` is 326px wide inside a 288px `.wk-demo` (airline). With text spacing it overflows 56px.
5. **On a phone, Billable doesn't say "playable" up front.** "Play a room" starts at 944px.

## Design

- **Phone home (< 760px).**
  - The first Work engagement keeps its demo inline.
  - Engagements 2 to 4 show a "Try the demo" button in place of the demo. The button is ≥ 44px, full width, with the demo's name and a one-line description. Activating it reveals the demo, which hydrates then, not before, and moves focus into the demo region.
  - Without JS, the demos show as today.
  - At ≥ 760px nothing changes. Pane sizes and the fit tests at desktop sizes hold.
  - Target: Projects starts within about 6,500px at 375 × 812.
- **Hero on phones.**
  - The name, headline and the links (Résumé, Email) appear in the first screen at 375 × 812. Cap the cover at about 60% of the width, or place it after the headline; choose whichever reads better and note why.
  - Add a quiet "See the work" link to `#work` beside the hero links.
  - Remove the hero's own `scroll-margin-top`; liner.css (WO-023) owns section offsets.
- **Honest contact links.**
  - In the footer and the hero, render a link whose `href` is not `http(s):` or `mailto:` as plain text, not an anchor. Keep the existing Placeholder marker ("Some links to come").
  - Show the ↗ only on external `http(s)` links. A `mailto:` gets no arrow.
  - Remove the footer's own `scroll-margin-top`.
  - Don't invent an email address or a consulting offer; the owner supplies both.
- **Résumé PDF.**
  - `factory/stations/resume-pdf.mjs` builds `public/resume.pdf` from the built page using Playwright `page.pdf()`. It uses the existing print path: the `ln-print-cv` class on `<html>` with print media. It writes `factory/stations/resume-pdf.hash`, the sha256 of `src/content/resume.json` plus `src/content/profile.json`.
  - Add `npm run resume:pdf` (regenerate) and `npm run resume:check` (fails if the hash is stale or the PDF is missing). Wire `resume:check` into `gates.sh` and `gates.yml` as a gate named "resume pdf".
  - `Resume.astro` gets a "Download PDF" link (`/resume.pdf`, `download`) beside "Print résumé", with the same button styling and states.
- **320px reflow.**
  - `.df-device` and `.df-screen` get `min-width: 0` and shrink. The airline app's tabs and points card shrink with them.
  - If a demo can't shrink, drop the bezel padding below 360px. No horizontal page overflow at 320 × 640, with or without WCAG 1.4.12 text spacing.
- **Billable on phones.** When the case study's `play` slot is filled, the hero meta shows a "Play it ↓" link to `#play`. It shows at every width, but it matters on phones.

## Constraints

- Constitution Art. 12: tokens only, hover / focus-visible / active parity. Art. 11: no em dashes.
- WO-022 (Music) and WO-023 (liner.css, Nav, Projects, Work snap rules) run in parallel. Stay out
  of their files and lines.
- Lighthouse budgets on every page; the script budget ≤ 100 KB. Collapsed demos must not hydrate.
- The PDF is generated, not hand-made. It is committed because the Pages build has no browser.

## Acceptance criteria

- [ ] At 375 × 812, Projects' top is ≤ 6,500px. Demos 2 to 4 are collapsed behind "Try the demo"; expanding one mounts it and focuses it [e2e:work phone demos expand on demand]
- [ ] At 375 × 812, the name, headline, Résumé and Email links are in the first viewport [e2e:gates hero first screen on phones]
- [ ] No anchor on the site has `href="#contact"` with an external-link arrow. Placeholder links render as text [e2e:gates contact links are honest]
- [ ] `/resume.pdf` returns 200 with `application/pdf`; the Download link points to it; `npm run resume:check` passes [e2e:gates resume pdf]
- [ ] No horizontal overflow at 320 × 640 on home, with and without text spacing [e2e:gates reflow at 320]
- [ ] On /projects/billable/, a "Play it" link in the hero goes to `#play` [e2e:demo-billable play it link]
- [ ] All demo tests and desktop fit tests still pass [e2e:demo-fit]
- [ ] axe clean, light and dark; Lighthouse budgets [lighthouse]
- [ ] Owner sign-off [owner]

## Out of scope

- The real email, LinkedIn URL and any consulting offer (owner content).
- The Music section (WO-022), the header, anchors and snap (WO-023).

## Notes

- Run gates with `PW_PORT=4395 npm run gates -- --quick`, and the full gates before handing back.
- Audit evidence: `factory/out/audit/` (`reflow.mjs`, `airline320.png`, `usability/`).
