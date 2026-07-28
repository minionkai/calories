import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Today', icon: <path d="M4 3h16v18H4z M4 9h16 M9 3v18" /> },
  { to: '/log', label: 'Log', icon: <path d="M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5" /> },
  { to: '/recipes', label: 'Recipes', icon: <path d="M12 3v6l3 3-3 9-3-9 3-3z" /> },
  { to: '/progress', label: 'Progress', icon: <path d="M4 19V9 M10 19V5 M16 19v-8 M21 19H3" /> },
  { to: '/more', label: 'More', icon: <path d="M5 12h.01 M12 12h.01 M19 12h.01" /> },
];

export default function BottomNav() {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {t.icon}
          </svg>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
