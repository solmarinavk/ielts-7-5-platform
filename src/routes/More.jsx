import { Link } from 'react-router-dom';
import {
  PenSquare,
  Mic,
  AlertTriangle,
  LineChart,
  Download,
  Library,
  Settings as SettingsIcon,
  ChevronRight,
} from 'lucide-react';
import TopBar from '../components/TopBar.jsx';

const ITEMS = [
  { to: '/writing', label: 'Writing', desc: 'Samples + self-assessment', icon: PenSquare },
  { to: '/speaking', label: 'Speaking', desc: 'Recorder + cue cards', icon: Mic },
  { to: '/errors', label: 'Errores', desc: 'Error log auto-generado', icon: AlertTriangle },
  { to: '/tracking', label: 'Tracking', desc: 'Stats + predictor de banda', icon: LineChart },
  { to: '/resources', label: 'Recursos', desc: 'Catálogo curado de mocks, samples, vocab', icon: Library },
  { to: '/export', label: 'Export', desc: 'Paquete Markdown para coach', icon: Download },
  { to: '/settings', label: 'Settings', desc: 'Examen, theme, reset', icon: SettingsIcon },
];

export default function More() {
  return (
    <>
      <TopBar title="Más" />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-2 animate-fade-in">
        {ITEMS.map(({ to, label, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="card p-4 flex items-center gap-3 hover:border-accent/40 transition"
          >
            <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        ))}
      </main>
    </>
  );
}
