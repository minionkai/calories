import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';

export default function AddFoodSheet({ onPickFood, onManual, onScan, onClose }) {
  const [query, setQuery] = useState('');

  const favourites = useLiveQuery(() => db.foods.where('isFavourite').equals(1).toArray()) || [];
  const recent = useLiveQuery(() =>
    db.foods.orderBy('lastLoggedAt').reverse().limit(8).toArray()
  ) || [];
  const searchResults = useLiveQuery(async () => {
    if (!query.trim()) return [];
    const all = await db.foods.toArray();
    const q = query.toLowerCase();
    return all.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]) || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 12 }}>Add food</h3>

        <input
          placeholder="Search saved foods…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onScan}>📷 Scan</button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onManual}>✏️ Manual entry</button>
        </div>

        {query.trim() ? (
          <FoodList title="Results" items={searchResults} onPick={onPickFood} empty="No saved foods match." />
        ) : (
          <>
            <FoodList title="⭐ Favourites" items={favourites} onPick={onPickFood} empty="No favourites yet." />
            <FoodList title="Recent foods" items={recent} onPick={onPickFood} empty="No recent foods yet." />
          </>
        )}

        <button className="btn btn-outline btn-block" style={{ marginTop: 8 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function FoodList({ title, items, onPick, empty }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="section-heading" style={{ margin: '0 0 8px' }}>{title}</div>
      {items.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((f) => (
            <button
              key={f.id}
              className="btn btn-secondary"
              style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
              onClick={() => onPick(f)}
            >
              <span>{f.name}</span>
              <span className="mono" style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>
                {Math.round(f.calories)} kcal
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
