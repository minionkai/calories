import { useState } from 'react';

const UNITS = ['g', 'kg', 'ml', 'L'];
const FIELDS = [
  ['calories', 'Calories', 'kcal'],
  ['protein', 'Protein', 'g'],
  ['carbs', 'Carbohydrates', 'g'],
  ['fat', 'Fat', 'g'],
  ['fibre', 'Fibre', 'g'],
  ['sodium', 'Sodium', 'mg'],
];

export default function FoodDefinitionModal({ initial, title = 'Add food', onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', servingSize: 100, servingUnit: 'g',
    calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0,
    ...initial,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...form,
      servingSize: Number(form.servingSize) || 0,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      fibre: Number(form.fibre) || 0,
      sodium: Number(form.sodium) || 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 14 }}>{title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Serving size</label>
              <input type="number" step="any" value={form.servingSize} onChange={(e) => set('servingSize', e.target.value)} />
            </div>
            <div className="field" style={{ width: 90 }}>
              <label>Unit</label>
              <select value={form.servingUnit} onChange={(e) => set('servingUnit', e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FIELDS.map(([key, label, unit]) => (
              <div className="field" key={key}>
                <label>{label} <span className="unit-chip">{unit}</span></label>
                <input type="number" step="any" value={form[key]} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Save food</button>
          </div>
        </form>
      </div>
    </div>
  );
}
