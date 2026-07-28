# Calories & Body Composition Tracker

A local-first, installable Progressive Web App for tracking calories, macros,
fibre, sodium, body composition, recipes, water, and steps.

## Stack

- **React 19 + Vite** — app shell and build tooling
- **Dexie (IndexedDB)** — all data is stored on-device; the app works fully
  offline once it's been opened once. There is no backend/server and no login.
- **react-router-dom** — page navigation
- **recharts** — progress trend charts
- **html5-qrcode** — barcode scanning (camera)
- **Tesseract.js** — on-device OCR for nutrition label scanning
- **OpenFoodFacts API** — barcode → nutrition lookup
- **vite-plugin-pwa** — installable app manifest + offline service worker

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL. Camera access (for the scanner) requires HTTPS or
`localhost`, so local dev works out of the box.

## Deploying

1. Push this folder to a GitHub repository.
2. Import the repo into [Vercel](https://vercel.com/new) — it auto-detects
   Vite, no config needed. Build command `npm run build`, output `dist`.
3. Once deployed, open the Vercel URL on your phone and use "Add to Home
   Screen" (iOS Safari) or the install prompt (Android Chrome).

## Data model

All tables live in `src/db.js` (Dexie/IndexedDB):

| Table | Purpose |
|---|---|
| `profile` | Singleton: weight, height, age, gender, activity level |
| `bodyComposition` | One row per check-in: weight, body fat %/mass, muscle %/mass, bone mass, visceral fat |
| `goals` | Current active daily targets (calories, protein, carbs, fat, fibre, sodium) |
| `goalHistory` | Append-only log of every goal change, for the Historical Goals table |
| `foods` | Personal food database — name, serving size/unit, nutrients per serving, favourite flag, last-logged timestamp |
| `recipes` | Name, servings, ingredient list (food + qty + unit), calculated per-serving nutrition |
| `logEntries` | One row per food logged to a specific date + meal |
| `water` | One row per water addition (date + ml) |
| `steps` | One row per date (date is the primary key) |

Units are restricted to **g / kg / ml / L** throughout — no density-dependent
units like cups or tsp, since converting those to weight accurately requires a
per-ingredient density table that was out of scope for this build.

## Feature checklist (mapped to spec sections)

- [x] 1. User Profile — onboarding wizard collects personal info + body composition
- [x] 2. Nutrition Goals — macro table, fibre default (14g/1000kcal, overridable), sodium default (2300mg, overridable)
- [x] 3. Dashboard — calorie dial, macro/fibre/sodium bars, remaining-today tiles
- [x] 4. Food Log — meal sections, add/edit/delete entries, dashboard recalculates instantly
- [x] 5. Recipe Library — ingredients from Saved Foods, per-serving nutrition, log a serving in one tap
- [x] 6. Add Food via Camera — unified entry point, Mode A (label OCR) / Mode B (barcode), shared result screen
- [x] 7. Progress Tracking — weekly/monthly/yearly, line charts incl. 7-day moving average
- [x] 8. Installable PWA — manifest, icons, offline caching via service worker
- [x] 9. Saved Foods — personal database, searchable, editable
- [x] 10. Favourite Foods — starred, shown at top of Add Food sheet
- [x] 11. Recent Foods — most-recently-logged foods surfaced in Add Food sheet
- [x] 12. Water Tracker — 2L goal, quick-add buttons, progress bar
- [x] 13. Daily Step Tracker — manual entry (Health/Health Connect integration intentionally deferred, as noted in the original spec)
- [x] 14. Historical Goals — table of every goal change over time
- [x] 15. Weight Trends — daily/weekly/monthly views with moving average, inside Progress Tracking

**Not included:** the Adaptive Goal Calculator (removed from spec — needs a
defined formula and a recalculation trigger before it can be built) and OCR
accuracy tuning for real-world crumpled labels (Tesseract.js is wired up as
specified, but expect to iterate on `parseLabelText` in
`src/utils/parseLabel.js` against real photos).

## Known follow-ups worth doing next

- Add authentication + a backend if you want data to sync across devices —
  currently everything is local to one browser/device.
- `src/utils/parseLabel.js` uses simple regex matching; real labels vary a lot
  and this will need tuning against actual photos.
- The main JS bundle is ~217KB gzipped; the scanner (Tesseract.js +
  html5-qrcode) is already code-split into its own chunk that only loads when
  a user taps "Scan".
