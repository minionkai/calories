import { useState } from 'react';
import { scaleNutrients } from '../utils/nutrition';

const UNITS = ['g', 'kg', 'ml', 'L'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

// `food` = the nutrition source (from Saved Foods, scanner result, etc).
// `existingEntry` = when editing an already-logged item, pass the log entry
// itself (which carries its own name/qty/unit/meal, possibly detached from food).
export default function LogEntryModal({ food, existingEntry, defaultMeal = 'Breakfast', onSave, onDelete, onClose }) {
  const base = existingEntry || {
    name: food?.name,
    qty: food?.servingSize ?? 100,
    unit: food?.servingUnit ?? 'g',
    meal: defaultMeal,
  };
  const [name, setName] = useState(base.name);
  const [qty, setQty] = useState(base.qty);
  const [unit, setUnit] = useState(base.unit);
  const [meal, setMeal] = useState(base.meal);

  const sourceFood = food || existingEntry?.foodSnapshot;

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = Number(qty) || 0;
    const nutrients = sourceFood
      ? scaleNutrients(sourceFood, q, unit)
      : {
          calories: existingEntry?.calories || 0,
          protein: existingEntry?.protein || 0,
          carbs: existingEntry?.carbs || 0,
          fat: existingEntry?.fat || 0,
          fibre: existingEntry?.fibre || 0,
          sodium: existingEntry?.sodium || 0,
        };
    onSave({ name, qty: q, unit, meal, ...nutrients, foodId: sourceFood?.id, foodSnapshot: sourceFood });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 14 }}>{existingEntry ? 'Edit entry' : 'Log food'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Quantity</label>
              <input type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="field" style={{ width: 90 }}>
              <label>Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Meal</label>
            <select value={meal} onChange={(e) => setMeal(e.target.value)}>
              {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {existingEntry && (
              <button type="button" className="btn btn-danger" onClick={onDelete}>Delete</button>
            )}
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              {existingEntry ? 'Save changes' : 'Add to log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
