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
// Headers are compared after lower-casing and stripping everything except
// letters, digits and "%", so "Body Fat (%)", "body_fat%" and "BodyFat%" all match.
const COLUMN_ALIASES = {
  date: ['date', 'datetime', 'day', 'measureddate', 'measurementdate', 'timestamp'],
  weight: ['weight', 'weightkg', 'bodyweight', 'bodyweightkg'],
  bodyFatPct: ['bodyfatpct', 'bodyfat%', 'bodyfat', 'bodyfatpercent', 'bodyfatpercentage', 'fat%', 'fatpct'],
  bodyFatMassKg: ['bodyfatmasskg', 'bodyfatmass', 'fatmasskg', 'fatmass'],
  muscleMassPct: ['musclemasspct', 'musclemass%', 'skeletalmusclepct', 'skeletalmuscle%', 'skeletalmusclepercent', 'musclepct', 'muscle%', 'skeletalmuscle'],
  muscleMassKg: ['musclemasskg', 'musclemass', 'skeletalmusclemasskg', 'skeletalmusclemass', 'musclekg'],
  boneMassKg: ['bonemasskg', 'bonemass', 'bonekg'],
  boneMassPct: ['bonemasspct', 'bonemass%', 'bonepct', 'bone%'],
  visceralRating: ['visceralrating', 'visceralfat', 'visceralfatrating', 'visceral', 'visceralfatlevel'],
  visceralPct: ['visceralpct', 'visceralfat%', 'visceral%'],
};

export const CSV_TEMPLATE =
  'date,weight,bodyFatPct,bodyFatMassKg,muscleMassPct,muscleMassKg,boneMassKg,boneMassPct,visceralRating,visceralPct\n' +
  '2026-07-01,55.2,22.5,12.4,38.1,21.0,2.4,4.3,5,\n' +
  '2026-07-08,54.9,22.1,12.1,38.4,21.1,2.4,4.4,5,\n';

function normalizeKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9%]/g, '');
}

const pad = (n) => String(n).padStart(2, '0');

// Converts the date formats exports commonly use into YYYY-MM-DD, which is
// what the Progress charts expect. Day-first dates (29/07/2026) are assumed.
export function normalizeDate(raw) {
  const str = String(raw).trim();
  let y, m, d;
  let match = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    [, y, m, d] = match;
  } else if ((match = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) {
    [, d, m, y] = match;
  } else {
    const parsed = new Date(str);
    if (Number.isNaN(parsed.getTime())) return null;
    y = parsed.getFullYear(); m = parsed.getMonth() + 1; d = parsed.getDate();
  }
  y = Number(y); m = Number(m); d = Number(d);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function parseNumber(value) {
  const n = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Maps arbitrary CSV headers onto our bodyComposition schema fields.
// Returns { entries, skipped } — skipped counts rows with no usable date or
// no recognised measurements.
export function mapCsvRowsToBodyComposition(rows) {
  const headerMap = {}; // csvHeader -> schemaField
  if (rows.length > 0) {
    Object.keys(rows[0]).forEach((csvHeader) => {
      const norm = normalizeKey(csvHeader);
      for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
        if (aliases.includes(norm)) headerMap[csvHeader] = field;
      }
    });
  }

  const entries = [];
  let skipped = 0;
  rows.forEach((row) => {
    const entry = {};
    Object.entries(row).forEach(([csvHeader, value]) => {
      const field = headerMap[csvHeader];
      if (!field || value === '') return;
      if (field === 'date') {
        const date = normalizeDate(value);
        if (date) entry.date = date;
      } else {
        const num = parseNumber(value);
        if (num !== null) entry[field] = num;
      }
    });
    if (entry.date && Object.keys(entry).length > 1) entries.push(entry);
    else skipped += 1;
  });
  return { entries, skipped };
}
