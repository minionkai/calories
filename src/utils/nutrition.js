// Macro → calorie conversion factors (Section 2)
export const KCAL_PER_G = { carbs: 4, protein: 4, fat: 9 };

export function macroCalories({ carbs = 0, protein = 0, fat = 0 }) {
  return {
    carbs: carbs * KCAL_PER_G.carbs,
    protein: protein * KCAL_PER_G.protein,
    fat: fat * KCAL_PER_G.fat,
  };
}

// Builds the Macro / Grams / Calories / % of Calories table described in the spec.
export function macroBreakdown({ carbs = 0, protein = 0, fat = 0 }) {
  const cals = macroCalories({ carbs, protein, fat });
  const total = cals.carbs + cals.protein + cals.fat || 1;
  return [
    { macro: 'Carbohydrates', grams: carbs, calories: cals.carbs, pct: (cals.carbs / total) * 100 },
    { macro: 'Protein', grams: protein, calories: cals.protein, pct: (cals.protein / total) * 100 },
    { macro: 'Fat', grams: fat, calories: cals.fat, pct: (cals.fat / total) * 100 },
  ];
}

// Fibre default: 14g per 1000 kcal, the standard dietary guideline proxy.
export function defaultFibreGoal(calorieGoal) {
  return Math.round(calorieGoal * 0.014);
}

export const DEFAULT_SODIUM_GOAL_MG = 2300;

export function round1(n) {
  return Math.round(n * 10) / 10;
}

export function todayISO(d = new Date()) {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 10);
}

// Sums a list of {calories, protein, carbs, fat, fibre, sodium} nutrient objects.
export function sumNutrients(items) {
  return items.reduce(
    (acc, it) => ({
      calories: acc.calories + (it.calories || 0),
      protein: acc.protein + (it.protein || 0),
      carbs: acc.carbs + (it.carbs || 0),
      fat: acc.fat + (it.fat || 0),
      fibre: acc.fibre + (it.fibre || 0),
      sodium: acc.sodium + (it.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0 }
  );
}

// Scales a food/recipe's stored nutrients (defined per `servingSize` `servingUnit`)
// to an arbitrary logged quantity in the same unit family (g/kg/ml/L).
const UNIT_TO_BASE = { g: 1, kg: 1000, ml: 1, l: 1000 };

export function scaleNutrients(food, qty, unit) {
  const baseServing = food.servingSize * (UNIT_TO_BASE[food.servingUnit] || 1);
  const baseQty = qty * (UNIT_TO_BASE[unit] || 1);
  const factor = baseServing > 0 ? baseQty / baseServing : 0;
  return {
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fat: food.fat * factor,
    fibre: food.fibre * factor,
    sodium: food.sodium * factor,
  };
}

export function movingAverage(values, windowSize) {
  return values.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}
