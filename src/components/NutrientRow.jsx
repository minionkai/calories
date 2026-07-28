import TickBar from './TickBar';

export default function NutrientRow({ label, value, goal, unit }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
        <span className="mono" style={{ fontSize: '0.85rem' }}>
          {Math.round(value)} / {Math.round(goal)}
          <span className="unit-chip">{unit}</span>
        </span>
      </div>
      <TickBar value={value} goal={goal} />
    </div>
  );
}
