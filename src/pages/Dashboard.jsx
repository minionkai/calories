import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { sumNutrients, todayISO } from '../utils/nutrition';
import CalorieDial from '../components/CalorieDial';
import NutrientRow from '../components/NutrientRow';
import TickBar from '../components/TickBar';

const WATER_GOAL_ML = 2000;
const STEP_GOAL = 10000;
const WATER_QUICK_ADD = [250, 500, 750];

export default function Dashboard() {
  const today = todayISO();
  const goals = useLiveQuery(() => db.goals.get(1));
  const entries = useLiveQuery(() => db.logEntries.where('date').equals(today).toArray(), [today]) || [];
  const waterEntries = useLiveQuery(() => db.water.where('date').equals(today).toArray(), [today]) || [];
  const stepRow = useLiveQuery(() => db.steps.get(today), [today]);
  const [stepInput, setStepInput] = useState('');

  const totals = sumNutrients(entries);
  const waterMl = waterEntries.reduce((a, w) => a + w.amountMl, 0);
  const steps = stepRow?.count || 0;

  useEffect(() => { setStepInput(steps ? String(steps) : ''); }, [steps]);

  if (!goals) return null;

  const addWater = async (ml) => {
    await db.water.add({ date: today, amountMl: ml, time: new Date().toISOString() });
  };

  const saveSteps = async () => {
    const count = Number(stepInput) || 0;
    await db.steps.put({ date: today, count });
  };

  return (
    <div className="screen">
      <h1 className="page-title">Today</h1>
      <p className="page-sub">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>

      <div className="card" style={{ paddingTop: 24, paddingBottom: 20 }}>
        <CalorieDial consumed={totals.calories} goal={goals.calories} />
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: 8 }} className="mono">
          {Math.round(totals.calories)} / {Math.round(goals.calories)} kcal
        </p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <NutrientRow label="Protein" value={totals.protein} goal={goals.protein} unit="g" />
        <NutrientRow label="Carbs" value={totals.carbs} goal={goals.carbs} unit="g" />
        <NutrientRow label="Fat" value={totals.fat} goal={goals.fat} unit="g" />
        <NutrientRow label="Fibre" value={totals.fibre} goal={goals.fibre} unit="g" />
        <NutrientRow label="Sodium" value={totals.sodium} goal={goals.sodium} unit="mg" />
      </div>

      <div className="section-heading">Remaining today</div>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
        {[
          ['Calories', goals.calories - totals.calories, ''],
          ['Protein', goals.protein - totals.protein, 'g'],
          ['Carbs', goals.carbs - totals.carbs, 'g'],
          ['Fat', goals.fat - totals.fat, 'g'],
          ['Fibre', goals.fibre - totals.fibre, 'g'],
        ].map(([label, val, unit]) => (
          <div key={label}>
            <div className="mono" style={{ fontWeight: 600 }}>{Math.max(Math.round(val), 0)}{unit}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="section-heading">Water</div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Water intake</span>
          <span className="mono" style={{ fontSize: '0.85rem' }}>
            {(waterMl / 1000).toFixed(2)} / {(WATER_GOAL_ML / 1000).toFixed(2)}<span className="unit-chip">L</span>
          </span>
        </div>
        <TickBar value={waterMl} goal={WATER_GOAL_ML} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {WATER_QUICK_ADD.map((ml) => (
            <button key={ml} className="btn btn-secondary" style={{ flex: 1 }} onClick={() => addWater(ml)}>+{ml}ml</button>
          ))}
        </div>
      </div>

      <div className="section-heading">Steps</div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Daily steps</span>
          <span className="mono" style={{ fontSize: '0.85rem' }}>{steps} / {STEP_GOAL}</span>
        </div>
        <TickBar value={steps} goal={STEP_GOAL} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input type="number" placeholder="Enter steps" value={stepInput} onChange={(e) => setStepInput(e.target.value)} />
          <button className="btn btn-primary" onClick={saveSteps}>Save</button>
        </div>
      </div>
    </div>
  );
}
