# Project screenshots

Screens for the project cards and case studies (WO-017). Each project has a folder named after
its content file in `src/content/projects/`.

| Folder            | Source                                                                      | Frame   |
| ----------------- | --------------------------------------------------------------------------- | ------- |
| `billable/`       | The game running locally from a copy of the repo, 800×448 at 2x             | game    |
| `box-scores/`     | The app running locally on public NBA data, 390×844 at 2x                   | phone   |
| `felt-and-tiles/` | The app running locally (`wrangler` local D1), as a guest, 1280×800 at 1.5x | browser |
| `tcg/`            | **Mock-ups**, built in HTML/CSS with invented cards, vendors and prices     | browser |
| `portfolio/`      | This site's home page, cropped to the hero art                              | browser |

All committed images are WebP, converted with sharp, which strips EXIF, GPS and XMP metadata.

## Owner drop-ins: Travel Planner, Parking Registrar, Fashion Companion

These apps run on real accounts and personal data, so they show a designed "Screenshots coming"
frame until you add screenshots. **Drop a file with exactly the name below into the folder and
rebuild.** Nothing else to edit: the cards and case studies pick files up by name (the `slot`
values in each project's content file). The first file of each project is also its card and
case-study hero.

All three are phone apps, so every screenshot is **portrait, from a phone**: a straight iPhone
screenshot (for example 1179×2556 or 1170×2532) is right. Any width from 780px up works; the site
crops to a 390:844 phone screen from the top, so keep what matters in the top of the screen.
PNG, JPG or WebP.

### `travel-planner/`

| File               | Screen                                                                      |
| ------------------ | --------------------------------------------------------------------------- |
| `01-dashboard.png` | The daily dashboard: the day's plan, the forecast and AI tips (card + hero) |
| `02-day-map.png`   | A day on the map, with walking and driving routes                           |
| `03-assistant.png` | The assistant editing the schedule after a request                          |
| `04-costs.png`     | The cost splitter: shared expenses and who owes whom                        |

### `parking/`

| File                  | Screen                                                             |
| --------------------- | ------------------------------------------------------------------ |
| `01-visitors.png`     | Saved visitors, one-tap Register and the usage meter (card + hero) |
| `02-confirmation.png` | A registration confirmed, with its code                            |
| `03-history.png`      | History, grouped by month                                          |

### `fashion/`

| File              | Screen                                                            |
| ----------------- | ----------------------------------------------------------------- |
| `01-today.png`    | Today's three outfits for the occasion and forecast (card + hero) |
| `02-closet.png`   | The closet, with tags                                             |
| `03-add-item.png` | Adding a piece: the photo and the suggested tags                  |
| `04-style.png`    | The style brief                                                   |

### Before you commit

1. **Demo data only.** No real names (yours, travel companions', guests'), emails, licence
   plates, addresses, booking or confirmation codes, or anything from a client. Use a demo
   account or edit the data first; blur nothing (blurs read as broken), replace it instead.
2. **Strip metadata.** Phone screenshots can carry EXIF. Convert to WebP with sharp, which drops
   it, and delete the original:

   ```bash
   node -e "require('sharp')(process.argv[1]).webp({quality:80}).toFile(process.argv[2])" \
     01-today.png 01-today.webp && rm 01-today.png
   ```

3. Run `npm run anonymize` (it flags EXIF and GPS in images) and `npm run gates -- --quick`.
4. Once a project's screenshots are in, change the gallery intro in its content file from
   "The app's main screens." to say where they came from (for example "Captured on a demo
   account."). The "Screenshots are on their way" note disappears on its own.
