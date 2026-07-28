// Very small, forgiving parser for nutrition-label OCR text. Real labels vary
// wildly in layout, so this looks for the first number following each known
// nutrient keyword rather than assuming a fixed table structure.
const PATTERNS = {
  calories: /(calories|energy)[^\d]{0,15}(\d+[\d.,]*)/i,
  protein: /protein[^\d]{0,15}(\d+[\d.,]*)/i,
  carbs: /(total carbohydrate|carbohydrate|carbs)[^\d]{0,15}(\d+[\d.,]*)/i,
  fat: /(total fat|fat)[^\d]{0,15}(\d+[\d.,]*)/i,
  fibre: /(dietary fibre|dietary fiber|fibre|fiber)[^\d]{0,15}(\d+[\d.,]*)/i,
  sodium: /sodium[^\d]{0,15}(\d+[\d.,]*)/i,
  servingSize: /serving size[^\d]{0,10}(\d+[\d.,]*)\s*(g|ml|kg|l)?/i,
};

function firstNumber(match) {
  if (!match) return null;
  const raw = match[match.length - 1] ?? match[1];
  const num = parseFloat(String(raw).replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

export function parseLabelText(text) {
  const clean = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ');
  const result = {
    calories: firstNumber(clean.match(PATTERNS.calories)) ?? 0,
    protein: firstNumber(clean.match(PATTERNS.protein)) ?? 0,
    carbs: firstNumber(clean.match(PATTERNS.carbs)) ?? 0,
    fat: firstNumber(clean.match(PATTERNS.fat)) ?? 0,
    fibre: firstNumber(clean.match(PATTERNS.fibre)) ?? 0,
    sodium: firstNumber(clean.match(PATTERNS.sodium)) ?? 0,
    servingSize: firstNumber(clean.match(PATTERNS.servingSize)) ?? 100,
  };
  const unitMatch = clean.match(PATTERNS.servingSize);
  result.servingUnit = (unitMatch && unitMatch[2]) ? unitMatch[2].toLowerCase() : 'g';
  return result;
}
