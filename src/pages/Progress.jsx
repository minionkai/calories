import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import db from '../db';
import { movingAverage } from '../utils/nutrition';

const RANGE_DAYS = { Weekly: 7, Monthly: 30, Yearly: 365 };
const METRICS = [
  ['weight', 'Weight', 'kg'],
  ['bodyFatPct', 'Body Fat %', '%'],
  ['bodyFatMassKg', 'Body Fat Mass', 'kg'],
  ['muscleMassPct', 'Skeletal Muscle %', '%'],
  ['muscleMassKg', 'Skeletal Muscle Mass', 'kg'],
  ['boneMassKg', 'Bone Mass', 'kg'],
  ['visceralRating', 'Visceral Fat', ''],
];

export default function Progress() {
  const [range, setRange] = useState('Monthly');
  const [metric, setMetric] = useState('weight');
  const entries = useLiveQuery(() => db.bodyComposition.orderBy('date').toArray()) || [];

  const days = RANGE_DAYS[range];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = entries.filter((e) => new Date(e.date) >= cutoff);

  const values = filtered.map((e) => e[metric]).map((v) => (v == null ? null : v));
  const hasData = values.some((v) => v != null);
  const cleanValues = values.map((v) => v ?? 0);
  const ma7 = movingAverage(cleanValues, 7);

  const chartData = filtered.map((e, i) => ({
    date: e.date.slice(5),
    value: e[metric],
    ma: Math.round(ma7[i] * 10) / 10,
  }));

  const metricLabel = METRICS.find((m) => m[0] === metric);

  return (
    <div className="screen">
      <h1 className="page-title">Progress</h1>
      <p className="page-sub">Trends across your check-ins.</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {Object.keys(RANGE_DAYS).map((r) => (
          <button
            key={r}
            className={`btn ${range === r ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <select value={metric} onChange={(e) => setMetric(e.target.value)} style={{ marginBottom: 14 }}>
        {METRICS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>

      <div className="card" style={{ height: 260, paddingRight: 4 }}>
        {!hasData ? (
          <div className="empty-state">No {metricLabel?.[1].toLowerCase()} data in this range yet. Log a check-in below.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#dcdad0" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="#2f6f6b" strokeWidth={2} dot={{ r: 2 }} name={metricLabel?.[1]} />
              <Line type="monotone" dataKey="ma" stroke="#dd9a2e" strokeWidth={2} dot={false} strokeDasharray="4 3" name="7-day avg" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', marginTop: 6 }}>
        Teal = daily value · Amber dashed = 7-day moving average (smooths out day-to-day fluctuation).
      </p>

      <CheckInForm />
    </div>
  );
}

function CheckInForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    weight: '', bodyFatPct: '', bodyFatMassKg: '', muscleMassPct: '', muscleMassKg: '',
    boneMassKg: '', boneMassPct: '', visceralRating: '', visceralPct: '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    await db.bodyComposition.add({
      date: new Date().toISOString().slice(0, 10),
      weight: Number(form.weight) || null,
      bodyFatPct: Number(form.bodyFatPct) || null,
      bodyFatMassKg: Number(form.bodyFatMassKg) || null,
      muscleMassPct: Number(form.muscleMassPct) || null,
      muscleMassKg: Number(form.muscleMassKg) || null,
      boneMassKg: Number(form.boneMassKg) || null,
      boneMassPct: Number(form.boneMassPct) || null,
      visceralRating: Number(form.visceralRating) || null,
      visceralPct: Number(form.visceralPct) || null,
    });
    setOpen(false);
    setForm({ weight: '', bodyFatPct: '', bodyFatMassKg: '', muscleMassPct: '', muscleMassKg: '', boneMassKg: '', boneMassPct: '', visceralRating: '', visceralPct: '' });
  };

  if (!open) {
    return <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setOpen(true)}>+ Log a check-in</button>;
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 10 }}>New check-in</h3>
      {[
        ['weight', 'Weight (kg)'], ['bodyFatPct', 'Body fat (%)'], ['bodyFatMassKg', 'Body fat mass (kg)'],
        ['muscleMassPct', 'Skeletal muscle (%)'], ['muscleMassKg', 'Skeletal muscle mass (kg)'],
        ['boneMassKg', 'Bone mass (kg)'], ['boneMassPct', 'Bone mass (%)'],
        ['visceralRating', 'Visceral fat rating'], ['visceralPct', 'Visceral fat (%)'],
      ].map(([k, label]) => (
        <div className="field" key={k}>
          <label>{label}</label>
          <input type="number" step="any" value={form[k]} onChange={(e) => set(k, e.target.value)} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={save}>Save check-in</button>
      </div>
    </div>
  );
}
