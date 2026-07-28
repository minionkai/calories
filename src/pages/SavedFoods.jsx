import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import FoodDefinitionModal from '../components/FoodDefinitionModal';

export default function SavedFoods() {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray()) || [];

  const filtered = foods.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  const toggleFav = (f) => db.foods.update(f.id, { isFavourite: f.isFavourite ? 0 : 1 });
  const remove = (f) => { if (confirm(`Delete "${f.name}"?`)) db.foods.delete(f.id); };
  const saveEdit = async (food) => { await db.foods.update(editing.id, food); setEditing(null); };

  return (
    <div className="screen">
      <h1 className="page-title">Saved Foods</h1>
      <p className="page-sub">Your personal food database.</p>

      <input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 14 }} />

      {filtered.length === 0 ? (
        <div className="empty-state">No saved foods yet. Foods you log manually or scan are saved here automatically.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((f) => (
            <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}>
              <button onClick={() => toggleFav(f)} style={{ background: 'none', border: 'none', fontSize: '1.1rem' }}>
                {f.isFavourite ? '⭐' : '☆'}
              </button>
              <div style={{ flex: 1 }} onClick={() => setEditing(f)}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.name}</div>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                  {Math.round(f.calories)} kcal / {f.servingSize}{f.servingUnit}
                </div>
              </div>
              <button className="btn btn-outline" onClick={() => setEditing(f)}>Edit</button>
              <button className="btn btn-danger" onClick={() => remove(f)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <FoodDefinitionModal title="Edit food" initial={editing} onSave={saveEdit} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
