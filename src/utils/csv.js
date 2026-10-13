// Minimal CSV parser — handles quoted fields with commas inside them, which
// covers the vast majority of exports from spreadsheets and smart-scale apps.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field); field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim(); });
    return obj;
  });
}

// Column names we recognize in a body-composition CSV, and their common aliases.
const COLUMN_ALIASES = {
  date: ['date'],
  weight: ['weight', 'weight_kg', 'weightkg'],
  bodyFatPct: ['bodyfatpct', 'bodyfat%', 'bodyfat', 'body_fat_pct', 'body fat %', 'body fat'],
  bodyFatMassKg: ['bodyfatmasskg', 'bodyfatmass', 'body fat mass', 'body fat mass (kg)'],
  muscleMassPct: ['musclemasspct', 'skeletalmusclepct', 'skeletal muscle %', 'skeletal muscle'],
  muscleMassKg: ['musclemasskg', 'skeletalmusclemasskg', 'skeletal muscle mass', 'skeletal muscle mass (kg)'],
  boneMassKg: ['bonemasskg', 'bone mass', 'bone mass (kg)'],
  boneMassPct: ['bonemasspct', 'bone mass %', 'bone mass (%)'],
  visceralRating: ['visceralrating', 'visceral fat', 'visceral fat rating', 'visceral'],
  visceralPct: ['visceralpct', 'visceral fat %', 'visceral %'],
};

function normalizeKey(key) {
  return key.toLowerCase().replace(/\s+/g, '');
}

// Maps arbitrary CSV headers onto our bodyComposition schema fields.
export function mapCsvRowsToBodyComposition(rows) {
  const headerMap = {}; // csvHeader -> schemaField
  if (rows.length > 0) {
    const csvHeaders = Object.keys(rows[0]);
    csvHeaders.forEach((csvHeader) => {
      const norm = normalizeKey(csvHeader);
      for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
        if (aliases.some((a) => normalizeKey(a) === norm)) {
          headerMap[csvHeader] = field;
        }
      }
    });
  }

  return rows
    .map((row) => {
      const entry = {};
      Object.entries(row).forEach(([csvHeader, value]) => {
        const field = headerMap[csvHeader];
        if (!field || value === '') return;
        entry[field] = field === 'date' ? value : Number(value);
      });
      return entry;
    })
    .filter((e) => e.date); // a row without a date can't be plotted on the trend charts
}
