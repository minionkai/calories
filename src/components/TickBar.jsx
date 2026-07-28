export default function TickBar({ value, goal, ticks = 8 }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const over = goal > 0 && value > goal;
  return (
    <div className="tick-bar">
      <div className={`tick-bar-fill${over ? ' over' : ''}`} style={{ width: `${pct}%` }} />
      <div className="tick-bar-ticks">
        {Array.from({ length: ticks + 1 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
    </div>
  );
}
