import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import db from './db';
import BottomNav from './components/BottomNav';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import FoodLog from './pages/FoodLog';
import Recipes from './pages/Recipes';
import Progress from './pages/Progress';
import More from './pages/More';
import SavedFoods from './pages/SavedFoods';

export default function App() {
  const profile = useLiveQuery(() => db.profile.get(1));
  const [forceOnboarded, setForceOnboarded] = useState(false);

  // useLiveQuery returns undefined while loading, null-ish once resolved with no row
  if (profile === undefined) return null;

  if (!profile && !forceOnboarded) {
    return (
      <HashRouter>
        <Onboarding onDone={() => setForceOnboarded(true)} />
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<FoodLog />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/more" element={<More />} />
        <Route path="/saved-foods" element={<SavedFoods />} />
      </Routes>
      <BottomNav />
    </HashRouter>
  );
}
