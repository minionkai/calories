import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../db';
import { defaultFibreGoal, DEFAULT_SODIUM_GOAL_MG, todayISO } from '../utils/nutrition';

const ACTIVITY_LEVELS = ['Sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Extremely active'];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const [personal, setPersonal] = useState({
    weight: '', height: '', age: '', gender: '', activityLevel: ACTIVITY_LEVELS[1],
  });
  const [bodyComp, setBodyComp] = useState({
    bodyFatPct: '', bodyFatMassKg: '', muscleMassPct: '', muscleMassKg: '',
    boneMassKg: '', boneMassPct: '', visceralRating: '', visceralPct: '',
  });
  const [goals, setGoals] = useState({ calories: 2000, protein: 120, carbs: 220, fat: 65 });

  const setP = (k, v) => setPersonal((s) => ({ ...s, [k]: v }));
  const setB = (k, v) => setBodyComp((s) => ({ ...s, [k]: v }));
  const setG = (k, v) => setGoals((s) => ({ ...s, [k]: v }));

  const finish = async () => {
    await db.profile.put({
      id: 1,
      weight: Number(personal.weight) || 0,
      height: Number(personal.height) || 0,
      age: Number(personal.age) || 0,
      gender: personal.gender,
      activityLevel: personal.activityLevel,
    });

    await db.bodyComposition.add({
      date: todayISO(),
      weight: Number(personal.weight) || 0,
      bodyFatPct: Number(bodyComp.bodyFatPct) || null,
      bodyFatMassKg: Number(bodyComp.bodyFatMassKg) || null,
      muscleMassPct: Number(bodyComp.muscleMassPct) || null,
      muscleMassKg: Number(bodyComp.muscleMassKg) || null,
      boneMassKg: Number(bodyComp.boneMassKg) || null,
      boneMassPct: Number(bodyComp.boneMassPct) || null,
      visceralRating: Number(bodyComp.visceralRating) || null,
      visceralPct: Number(bodyComp.visceralPct) || null,
    });

    const calorieGoal = Number(goals.calories) || 2000;
    const goalRow = {
      id: 1,
      calories: calorieGoal,
      protein: Number(goals.protein) || 0,
      carbs: Number(goals.carbs) || 0,
      fat: Number(goals.fat) || 0,
      fibre: defaultFibreGoal(calorieGoal),
      sodium: DEFAULT_SODIUM_GOAL_MG,
      label: 'Initial goal',
    };
    await db.goals.put(goalRow);
    await db.goalHistory.add({ date: todayISO(), ...goalRow });

    onDone();
    navigate('/');
  };

  return (
    <div className="screen">
      <h1 className="page-title">Set up your profile</h1>
      <p className="page-sub">Step {step + 1} of 3</p>

      {step === 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Personal information</h3>
          <div className="field">
            <label>Current weight (kg)</label>
            <input type="number" step="any" value={personal.weight} onChange={(e) => setP('weight', e.target.value)} />
          </div>
          <div className="field">
            <label>Height (cm)</label>
            <input type="number" step="any" value={personal.height} onChange={(e) => setP('height', e.target.value)} />
          </div>
          <div className="field">
            <label>Age</label>
            <input type="number" value={personal.age} onChange={(e) => setP('age', e.target.value)} />
          </div>
          <div className="field">
            <label>Gender (optional)</label>
            <input value={personal.gender} onChange={(e) => setP('gender', e.target.value)} />
          </div>
          <div className="field">
            <label>Activity level</label>
            <select value={personal.activityLevel} onChange={(e) => setP('activityLevel', e.target.value)}>
              {ACTIVITY_LEVELS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => setStep(1)}>Continue</button>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Body composition</h3>
          <p className="page-sub">Enter what your scale gives you — leave anything blank you don't have.</p>
          {[
            ['bodyFatPct', 'Body fat (%)'], ['bodyFatMassKg', 'Body fat mass (kg)'],
            ['muscleMassPct', 'Skeletal muscle (%)'], ['muscleMassKg', 'Skeletal muscle mass (kg)'],
            ['boneMassKg', 'Bone mass (kg)'], ['boneMassPct', 'Bone mass (%)'],
            ['visceralRating', 'Visceral fat rating'], ['visceralPct', 'Visceral fat (%)'],
          ].map(([key, label]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input type="number" step="any" value={bodyComp[key]} onChange={(e) => setB(key, e.target.value)} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(0)}>Back</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(2)}>Continue</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Nutrition goals</h3>
          <div className="field">
            <label>Calories <span className="unit-chip">kcal</span></label>
            <input type="number" value={goals.calories} onChange={(e) => setG('calories', e.target.value)} />
          </div>
          <div className="field">
            <label>Protein <span className="unit-chip">g</span></label>
            <input type="number" value={goals.protein} onChange={(e) => setG('protein', e.target.value)} />
          </div>
          <div className="field">
            <label>Carbohydrates <span className="unit-chip">g</span></label>
            <input type="number" value={goals.carbs} onChange={(e) => setG('carbs', e.target.value)} />
          </div>
          <div className="field">
            <label>Fat <span className="unit-chip">g</span></label>
            <input type="number" value={goals.fat} onChange={(e) => setG('fat', e.target.value)} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: 14 }}>
            Fibre and sodium goals are set automatically (14g fibre per 1000 kcal, 2300mg sodium) — you can change either later in Settings.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={finish}>Finish setup</button>
          </div>
        </div>
      )}
    </div>
  );
}
