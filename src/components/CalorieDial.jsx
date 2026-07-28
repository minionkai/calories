const TICKS = 40;

export default function CalorieDial({ consumed, goal }) {
  const remaining = Math.max(goal - consumed, 0);
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const over = consumed > goal && goal > 0;
  const r = 78;
  const cx = 90;
  const cy = 90;

  return (
    <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        {Array.from({ length: TICKS }).map((_, i) => {
          const angle = (i / TICKS) * 2 * Math.PI - Math.PI / 2;
          const active = i / TICKS <= pct;
          const inner = r - (i % 5 === 0 ? 10 : 6);
          const x1 = cx + Math.cos(angle) * r;
          const y1 = cy + Math.sin(angle) * r;
          const x2 = cx + Math.cos(angle) * inner;
          const y2 = cy + Math.sin(angle) * inner;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={active ? (over ? '#bd4f30' : '#2f6f6b') : '#dcdad0'}
              strokeWidth={i % 5 === 0 ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 600, color: over ? '#bd4f30' : '#1c2b2b' }}>
          {Math.round(remaining)}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#5b6764', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          {over ? 'kcal over' : 'kcal left'}
        </div>
      </div>
    </div>
  );
}
