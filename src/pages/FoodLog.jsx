import { lazy, Suspense, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { todayISO } from '../utils/nutrition';
import AddFoodSheet from '../components/AddFoodSheet';
import FoodDefinitionModal from '../components/FoodDefinitionModal';
import LogEntryModal from '../components/LogEntryModal';

const ScannerModal = lazy(() => import('../components/ScannerModal'));

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function FoodLog() {
  const today = todayISO();
  const entries = useLiveQuery(() => db.logEntries.where('date').equals(today).toArray(), [today]) || [];

  const [activeMeal, setActiveMeal] = useState(null); // which meal we're adding into
  const [sheet, setSheet] = useState(null); // 'pick' | 'manual' | 'scan' | null
  const [pendingFood, setPendingFood] = useState(null); // food chosen, awaiting qty/meal
  const [editingEntry, setEditingEntry] = useState(null);

  const openAdd = (meal) => { setActiveMeal(meal); setSheet('pick'); };

  const handlePickFood = (food) => { setPendingFood(food); setSheet(null); };
  const handleManual = () => { setSheet('manual'); };
  const handleScan = () => { setSheet('scan'); };

  const handleSaveManualFood = async (food) => {
    const id = await db.foods.add({ ...food, isFavourite: 0, lastLoggedAt: Date.now(), source: 'manual' });
    setPendingFood({ ...food, id });
    setSheet(null);
  };

  const handleScanResult = async (food) => {
    const id = await db.foods.add({ ...food, isFavourite: 0, lastLoggedAt: Date.now() });
    setPendingFood({ ...food, id });
    setSheet(null);
  };

  const handleLogSave = async (payload) => {
    if (payload.foodId) {
      await db.foods.update(payload.foodId, { lastLoggedAt: Date.now() });
    }
    await db.logEntries.add({ date: today, ...payload });
    setPendingFood(null);
  };

  const handleEditSave = async (payload) => {
    await db.logEntries.update(editingEntry.id, payload);
    setEditingEntry(null);
  };

  const handleEditDelete = async () => {
    await db.logEntries.delete(editingEntry.id);
    setEditingEntry(null);
  };

  return (
    <div className="screen">
      <h1 className="page-title">Food Log</h1>
      <p className="page-sub">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>

      {MEALS.map((meal) => {
        const mealEntries = entries.filter((e) => e.meal === meal);
        const mealCals = mealEntries.reduce((a, e) => a + (e.calories || 0), 0);
        return (
          <div key={meal} style={{ marginBottom: 18 }}>
            <div className="section-heading">
              <span>{meal}</span>
              <span className="mono" style={{ fontWeight: 500, color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
                {Math.round(mealCals)} kcal
              </span>
            </div>
            <div className="card" style={{ padding: 8 }}>
              {mealEntries.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', padding: '8px 6px' }}>Nothing logged yet.</p>
              ) : (
                mealEntries.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setEditingEntry(e)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', width: '100%',
                      background: 'none', border: 'none', padding: '9px 6px', borderBottom: '1px solid var(--border)',
                      textAlign: 'left', font: 'inherit', color: 'inherit',
                    }}
                  >
                    <span>
                      {e.name}
                      <span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}> — {e.qty}{e.unit}</span>
                    </span>
                    <span className="mono">{Math.round(e.calories)} kcal</span>
                  </button>
                ))
              )}
              <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => openAdd(meal)}>
                + Add food
              </button>
            </div>
          </div>
        );
      })}

      {sheet === 'pick' && (
        <AddFoodSheet
          onPickFood={handlePickFood}
          onManual={handleManual}
          onScan={handleScan}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'manual' && (
        <FoodDefinitionModal title="Add food manually" onSave={handleSaveManualFood} onClose={() => setSheet(null)} />
      )}
      {sheet === 'scan' && (
        <Suspense fallback={<div className="modal-overlay"><div className="modal-sheet">Loading scanner…</div></div>}>
          <ScannerModal onResult={handleScanResult} onClose={() => setSheet(null)} />
        </Suspense>
      )}
      {pendingFood && (
        <LogEntryModal
          food={pendingFood}
          defaultMeal={activeMeal}
          onSave={handleLogSave}
          onClose={() => setPendingFood(null)}
        />
      )}
      {editingEntry && (
        <LogEntryModal
          existingEntry={editingEntry}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
