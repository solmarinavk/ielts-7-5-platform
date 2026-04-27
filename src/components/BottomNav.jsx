import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, BookOpenCheck, ListChecks, Menu } from 'lucide-react';
import { cn } from '../lib/cn.js';

const items = [
  { to: '/', label: 'Hoy', icon: Home, end: true },
  { to: '/plan', label: 'Plan', icon: CalendarDays },
  { to: '/vocab', label: 'Vocab', icon: BookOpenCheck },
  { to: '/mocks', label: 'Mocks', icon: ListChecks },
  { to: '/more', label: 'Más', icon: Menu },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 safe-bottom">
      <ul className="grid grid-cols-5 max-w-xl mx-auto">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition',
                  isActive
                    ? 'text-accent'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                )
              }
            >
              <Icon className="w-5 h-5" strokeWidth={2.2} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
