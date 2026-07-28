// Looks up a scanned barcode against the OpenFoodFacts public database.
// Returns a normalized food object, or null if not found.
export async function lookupBarcode(code) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    code
  )}.json?fields=product_name,nutriments,serving_size,serving_quantity`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenFoodFacts request failed (${res.status})`);
  const data = await res.json();

  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments || {};

  // OpenFoodFacts reports per-100g by default; normalize to a 100 g/ml serving
  // so it lines up with our g/kg/ml/L unit system.
  const servingSize = 100;
  const servingUnit = 'g';

  return {
    name: p.product_name || 'Unknown product',
    servingSize,
    servingUnit,
    calories: n['energy-kcal_100g'] ?? 0,
    protein: n['proteins_100g'] ?? 0,
    carbs: n['carbohydrates_100g'] ?? 0,
    fat: n['fat_100g'] ?? 0,
    fibre: n['fiber_100g'] ?? 0,
    sodium: (n['sodium_100g'] ?? 0) * 1000, // OFF reports sodium in g; we store mg
    source: 'barcode',
    barcode: code,
  };
}
