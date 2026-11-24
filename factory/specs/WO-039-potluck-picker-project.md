---
id: WO-039
title: Potluck Picker: a new project, built for my mom, one link and one purpose
phase: 12
gate: human
agent: builder
depends_on: [WO-017]
touches:
  - src/content/projects/potluck-picker.md (new)
  - src/content/projects/*.md (the `order` field only)
  - src/assets/projects/potluck-picker/** (new)
  - src/assets/projects/README.md (one row)
  - tests/e2e/projects.spec.ts (new tests only)
  - tests/e2e/routes.ts (the new route only)
---

## Goal

The owner: "We just made a new project. It was the potluck picker. Add that in as a project and talk about how it was to build an application for my mom, how we wanted a very focused application that had one purpose: to help people organize potlucks and figure out the list."

The sources, both read-only (don't change anything in them):

- the repo at `~/potluck-picker` (private on GitHub): its README, `factory/specs/`, `factory/decisions.md`, `shared/categories.ts`, `wrangler.jsonc`;
- the live app at https://potluck-picker.pages.dev.

What the owner said when starting it, in their own words: their mom wants to "send the link to this application to a group chat so that everyone can fill in what they're bringing to a potluck. It needs to be extremely easy to use because everyone who is using it is pretty old." Guests are "completely autonomous on what needs to be brought", and the app categorises afterwards: how many starters, mains, sides, desserts.

## Design

- **Content file.** Add `src/content/projects/potluck-picker.md` in the same schema as `felt-and-tiles.md`. Draft copy follows; owner review is required, so flag it in your report. Check every fact against the repo, and cut anything the repo doesn't support.
  - `title`: Potluck Picker
  - `tagline`: One link for the group chat, and everyone says what they're bringing.
  - `category`: app · `year`: '2026' · `platforms`: [Web]
  - `problem` (the story the owner asked for; keep it to about 60 to 90 words, first person; add nothing about her or her guests that the owner did not say): My mom wanted one link she could send to a group chat, where everyone writes down what they're bringing to a potluck. Most of her guests aren't used to apps, so it had to do one thing and do it simply: no accounts for guests, big text and buttons, one question at a time. Guests choose their own dishes; the app sorts and counts them.
  - `features`, from the README, each one line:
    - the host's setup and ready-to-send message (WhatsApp, other apps, copy);
    - guests tap their name, with no account or password;
    - the kind of dish is worked out from its name, and the app asks only when it can't tell;
    - a soft duplicate check (typos and spellings as you type, then a meaning check, "lemonade" and "nimbu pani"), and guests can always add it anyway;
    - dishes grouped by kind with counts ("2 mains · 1 dessert"), who hasn't added anything, and a reminder;
    - an AI-written card and photo for each dish, with the dish still added if AI is down;
    - host accounts, so the host link can't be lost.
  - `planned`: only what the repo's specs or README list as not done. For example, forgot password is built but switched off until a sending domain exists. If nothing qualifies, leave it empty.
  - `stack`, layer by layer, with the "why" from the repo:
    - React + Vite;
    - a Cloudflare Worker (Hono) with D1, R2 and the Images binding;
    - Workers AI;
    - Pages as the front door;
    - Playwright + axe, Vitest in workerd.
  - `engineering`, three notes. Title and body each stay short.
    1. **Built for one person's guests.** What designing for older, app-shy guests changed: one question per screen, big targets, plain words, the guest list to tap instead of typing.
    2. **A soft rule, not a lock.** Duplicates warn; they never block.
    3. **AI is optional.** The dish is saved first; the card and photo follow. If AI fails, nothing breaks.
  - **Links.** Add the live app as a link with its address, if the project schema has a links field. If it doesn't, put the address in the case study's existing link slot. No repo link: the repo is private.
  - **Order.** Put it first in the rail (`order: 1`) and shift the others down by one, `order` fields only. `featured: true` only once it has real screenshots (WO-029's rule: no Featured chip over placeholder art).
- **Screenshots, captured from a copy of the app running locally.**
  - Copy `~/potluck-picker` to a scratch folder outside both repos, install, migrate the local D1, and run it with `LOCAL_ONLY=1` (no AI calls, so no spend and no network AI). Don't touch production: create nothing on potluck-picker.pages.dev.
  - Seed an invented potluck with invented names. Keep the existing test fixture's names if it has them ("Diwali Potluck", "Meena", "Sunita" are the fixture's), or use plainly fictional ones. No real people, addresses or phone numbers.
  - Capture at 390 × 844 at 2x (the `phone` frame), light mode:
    1. `01-board`: the dish list, grouped, with counts. It is the cover and the hero.
    2. `02-who`: a guest tapping their name.
    3. `03-dish`: adding a dish.
    4. `04-duplicate`: the gentle duplicate heads-up.
    5. `05-share`: the host's ready-to-send message.
  - No toasts mid-animation, and no half-loaded photos ("Photo coming" placeholders are fine, since there's no AI locally; or pick screens without photos).
  - Convert to WebP with sharp (strips metadata), as the other projects did. Add a row to `src/assets/projects/README.md`.
  - Write alt text for each that says what is on the screen. Captions are one short line.

## Constraints

- Constitution Art. 11: no em dashes. The anonymize and private-leak gates must pass: no emails, no real names, no inventory data.
- Nothing from `~/potluck-picker` is copied into this repo except the screenshots you capture. No code, no secrets, no `.dev.vars`, no database files.
- Don't start the app with real AI, and don't deploy or write anything to the potluck-picker Cloudflare project.
- WO-034 (system components), WO-035 to WO-037 (demos) and WO-038 (résumé) run in parallel. Stay out of their files.

## Acceptance criteria

- [ ] `/projects/potluck-picker/` renders the case study with the story, features, stack and three engineering notes, and is in the internal-links and route lists [e2e:projects potluck picker case study]
- [ ] Potluck Picker is the first card in the Projects rail, with its cover screenshot [e2e:projects potluck picker leads the rail]
- [ ] Five screenshots are WebP in `src/assets/projects/potluck-picker/`, show invented data only, and each has alt text [review]
- [ ] The live link points at https://potluck-picker.pages.dev, and no link points at the private repo [e2e:projects potluck picker case study]
- [ ] Anonymize, private leak, copy and internal links gates pass [anonymize] [links]
- [ ] axe clean, light and dark; Lighthouse budgets on the new route [lighthouse]
- [ ] Owner review of the copy, especially the story [owner]

## Out of scope

- Any change to the potluck-picker repo or its deployment.
- A live interactive demo of it inside the portfolio.

## Notes

- Run gates with `PW_PORT=4419 npm run gates -- --quick`, and the full gates before handing back.
- Model: `src/content/projects/felt-and-tiles.md` (a browser app captured locally from `wrangler` local D1) and `box-scores.md` (phone frame).
