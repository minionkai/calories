import { lazy, Suspense, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { scaleNutrients, sumNutrients, todayISO } from '../utils/nutrition';
import LogEntryModal from '../components/LogEntryModal';
import FoodDefinitionModal from '../components/FoodDefinitionModal';

const ScannerModal = lazy(() => import('../components/ScannerModal'));

export default function Recipes() {
  const recipes = useLiveQuery(() => db.recipes.toArray()) || [];
  const foods = useLiveQuery(() => db.foods.toArray()) || [];
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [logging, setLogging] = useState(null);

  const addToLog = async (payload) => {
    await db.logEntries.add({ date: todayISO(), ...payload });
    setLogging(null);
    setViewing(null);
  };

  return (
    <div className="screen">
      <h1 className="page-title">Recipes</h1>
      <p className="page-sub">Build a recipe once, log it in one tap from then on.</p>

      <button className="btn btn-primary btn-block" style={{ marginBottom: 16 }} onClick={() => setCreating(true)}>
        + New recipe
      </button>

      {recipes.length === 0 ? (
        <div className="empty-state">No recipes yet. Create one from ingredients in your saved foods.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recipes.map((r) => (
            <button key={r.id} className="card" style={{ textAlign: 'left', border: 'none' }} onClick={() => setViewing(r)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{r.name}</strong>
                <span className="mono" style={{ color: 'var(--ink-soft)' }}>
                  {Math.round(r.perServing.calories)} kcal/serving
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{r.servings} servings</div>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <RecipeBuilder foods={foods} onClose={() => setCreating(false)} />
      )}

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3>{viewing.name}</h3>
            <p className="page-sub">{viewing.servings} servings</p>
            <div className="card" style={{ marginBottom: 14 }}>
              {['calories', 'protein', 'carbs', 'fat', 'fibre', 'sodium'].map((k) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span style={{ textTransform: 'capitalize' }}>{k}</span>
                  <span className="mono">{Math.round(viewing.perServing[k])}{k === 'sodium' ? 'mg' : k === 'calories' ? ' kcal' : 'g'}</span>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary btn-block"
              style={{ marginBottom: 8 }}
              onClick={() => setLogging(viewing)}
            >
              Add one serving to today's log
            </button>
            <button className="btn btn-outline btn-block" onClick={() => setViewing(null)}>Close</button>
          </div>
        </div>
      )}

      {logging && (
        <LogEntryModal
          food={{ ...logging.perServing, name: logging.name, servingSize: 1, servingUnit: 'g' }}
          defaultMeal="Snacks"
          onSave={(payload) => addToLog({ ...payload, qty: 1, unit: 'serving' })}
          onClose={() => setLogging(null)}
        />
      )}
    </div>
  );
}

function RecipeBuilder({ foods, onClose }) {
  const [name, setName] = useState('');
  const [servings, setServings] = useState(1);
  const [rows, setRows] = useState([{ foodId: '', qty: 100, unit: 'g' }]);
  const [creatingFoodForRow, setCreatingFoodForRow] = useState(null); // row index
  const [creationMode, setCreationMode] = useState(null); // 'choose' | 'manual' | 'scan'

  const addRow = () => setRows((r) => [...r, { foodId: '', qty: 100, unit: 'g' }]);
  const updateRow = (i, patch) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));

  const openFoodCreation = (rowIndex) => {
    setCreatingFoodForRow(rowIndex);
    setCreationMode('choose');
  };

  const closeFoodCreation = () => {
    setCreatingFoodForRow(null);
    setCreationMode(null);
  };

  const handleNewFoodSaved = async (food) => {
    const id = await db.foods.add({ ...food, isFavourite: 0, lastLoggedAt: Date.now(), source: food.source || 'manual' });
    updateRow(creatingFoodForRow, { foodId: String(id), qty: food.servingSize, unit: food.servingUnit });
    closeFoodCreation();
  };

  const save = async () => {
    if (!name.trim() || rows.some((r) => !r.foodId)) return;
    const nutrientList = rows.map((r) => {
      const food = foods.find((f) => f.id === Number(r.foodId));
      return food ? scaleNutrients(food, Number(r.qty), r.unit) : sumNutrients([]);
    });
    const total = sumNutrients(nutrientList);
    const perServing = Object.fromEntries(
      Object.entries(total).map(([k, v]) => [k, v / (Number(servings) || 1)])
    );
    await db.recipes.add({
      name,
      servings: Number(servings) || 1,
      ingredients: rows.map((r) => ({ foodId: Number(r.foodId), qty: Number(r.qty), unit: r.unit })),
      perServing,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 12 }}>New recipe</h3>
        <div className="field">
          <label>Recipe name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Number of servings</label>
          <input type="number" value={servings} onChange={(e) => setServings(e.target.value)} />
        </div>

        <label style={{ display: 'block', marginBottom: 6 }}>Ingredients</label>
        {rows.map((row, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <select value={row.foodId} onChange={(e) => updateRow(i, { foodId: e.target.value })} style={{ flex: 2 }}>
                <option value="">Select saved food…</option>
                {foods.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input type="number" value={row.qty} onChange={(e) => updateRow(i, { qty: e.target.value })} style={{ width: 60 }} />
              <select value={row.unit} onChange={(e) => updateRow(i, { unit: e.target.value })} style={{ width: 66 }}>
                {['g', 'kg', 'ml', 'L'].map((u) => <option key={u}>{u}</option>)}
              </select>
              <button className="btn btn-outline" onClick={() => removeRow(i)}>✕</button>
            </div>
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }} onClick={() => openFoodCreation(i)}>
              + Create new food for this ingredient
            </button>
          </div>
        ))}
        <button className="btn btn-secondary btn-block" style={{ marginBottom: 14 }} onClick={addRow}>+ Add ingredient</button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save}>Save recipe</button>
        </div>
      </div>

      {creationMode === 'choose' && (
        <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); closeFoodCreation(); }}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Add a new food</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary btn-block" onClick={() => setCreationMode('scan')}>📷 Scan (label or barcode)</button>
              <button className="btn btn-secondary btn-block" onClick={() => setCreationMode('manual')}>✏️ Manual entry</button>
              <button className="btn btn-outline btn-block" onClick={closeFoodCreation}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {creationMode === 'manual' && (
        <FoodDefinitionModal title="Add food manually" onSave={handleNewFoodSaved} onClose={closeFoodCreation} />
      )}

      {creationMode === 'scan' && (
        <Suspense fallback={<div className="modal-overlay"><div className="modal-sheet">Loading scanner…</div></div>}>
          <ScannerModal onResult={handleNewFoodSaved} onClose={closeFoodCreation} />
        </Suspense>
      )}
    </div>
  );
}
