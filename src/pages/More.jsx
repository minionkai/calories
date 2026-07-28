import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import db from '../db';
import { defaultFibreGoal, todayISO } from '../utils/nutrition';

export default function More() {
  const goals = useLiveQuery(() => db.goals.get(1));
  const history = useLiveQuery(() => db.goalHistory.orderBy('date').reverse().toArray()) || [];
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const startEdit = () => {
    setForm({ ...goals, label: '' });
    setEditing(true);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const useDefaultFibre = () => set('fibre', defaultFibreGoal(Number(form.calories) || 0));

  const save = async () => {
    const updated = {
      id: 1,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      fibre: Number(form.fibre) || 0,
      sodium: Number(form.sodium) || 0,
      label: form.label || 'Updated goal',
    };
    await db.goals.put(updated);
    await db.goalHistory.add({ date: todayISO(), ...updated });
    setEditing(false);
  };

  if (!goals) return null;

  return (
    <div className="screen">
      <h1 className="page-title">More</h1>

      <div className="section-heading">Saved Foods</div>
      <Link to="/saved-foods" className="card" style={{ display: 'block', marginBottom: 4, textDecoration: 'none' }}>
        Browse your personal food database →
      </Link>

      <div className="section-heading">Nutrition goals</div>
      {!editing ? (
        <div className="card">
          {[
            ['Calories', goals.calories, 'kcal'], ['Protein', goals.protein, 'g'], ['Carbohydrates', goals.carbs, 'g'],
            ['Fat', goals.fat, 'g'], ['Fibre', goals.fibre, 'g'], ['Sodium', goals.sodium, 'mg'],
          ].map(([label, val, unit]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
              <span>{label}</span>
              <span className="mono">{Math.round(val)} {unit}</span>
            </div>
          ))}
          <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={startEdit}>Edit goals</button>
        </div>
      ) : (
        <div className="card">
          <div className="field">
            <label>Goal label <span style={{ fontWeight: 400, textTransform: 'none' }}>(e.g. "Fat Loss", "Maintenance")</span></label>
            <input value={form.label} onChange={(e) => set('label', e.target.value)} />
          </div>
          {[['calories', 'Calories', 'kcal'], ['protein', 'Protein', 'g'], ['carbs', 'Carbohydrates', 'g'], ['fat', 'Fat', 'g']].map(([k, label, unit]) => (
            <div className="field" key={k}>
              <label>{label} <span className="unit-chip">{unit}</span></label>
              <input type="number" value={form[k]} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
          <div className="field">
            <label>Fibre <span className="unit-chip">g</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" value={form.fibre} onChange={(e) => set('fibre', e.target.value)} />
              <button type="button" className="btn btn-outline" onClick={useDefaultFibre}>Use default</button>
            </div>
          </div>
          <div className="field">
            <label>Sodium <span className="unit-chip">mg</span></label>
            <input type="number" value={form.sodium} onChange={(e) => set('sodium', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={save}>Save goals</button>
          </div>
        </div>
      )}

      <div className="section-heading">Historical goals</div>
      {history.length === 0 ? (
        <div className="empty-state">No goal changes recorded yet.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-sunken)' }}>
                {['Date', 'Calories', 'Protein', 'Goal'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="mono" style={{ padding: '7px 10px' }}>{h.date}</td>
                  <td className="mono" style={{ padding: '7px 10px' }}>{Math.round(h.calories)}</td>
                  <td className="mono" style={{ padding: '7px 10px' }}>{Math.round(h.protein)}g</td>
                  <td style={{ padding: '7px 10px' }}>{h.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
