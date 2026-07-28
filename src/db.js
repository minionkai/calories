import Dexie from 'dexie';

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
// Local-first storage (IndexedDB via Dexie). Everything lives on-device so the
// app works fully offline once installed. See README.md for the full schema
// rationale.
// ---------------------------------------------------------------------------

export const db = new Dexie('caloriesTrackerDB');

db.version(1).stores({
  // Singleton profile row, id is always 1
  profile: 'id',
  // Current active nutrition goal, id is always 1
  goals: 'id',
  // Append-only history of goal changes over time (Section 14 — Historical Goals)
  goalHistory: '++id, date',
  // Body composition check-ins over time (weight, body fat %, muscle, bone, visceral fat)
  bodyComposition: '++id, date',
  // Personal food database (Section 9 — Saved Foods)
  foods: '++id, name, isFavourite, lastLoggedAt',
  // User-created recipes (Section 5)
  recipes: '++id, name',
  // Individual food log entries per day/meal (Section 4)
  logEntries: '++id, date, meal, foodId',
  // Water intake entries (Section 12)
  water: '++id, date',
  // Daily step counts, one row per date (Section 13)
  steps: '&date',
});

export default db;
