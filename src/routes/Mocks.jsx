import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { Plus, ChevronRight, ListChecks } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { db } from '../lib/db.js';
import { SECTIONS } from '../lib/ielts-bands.js';

export default function Mocks() {
  const navigate = useNavigate();
  const mocks = useLiveQuery(async () => {
    const all = await db.mockTests.toArray();
    return all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, []);

  return (
    <>
      <TopBar
        title="Mock tests"
        back
        right={
          <button
            onClick={() => navigate('/mocks/new')}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Register mock"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-3 animate-fade-in">
        {!mocks ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : mocks.length === 0 ? (
          <EmptyState onStart={() => navigate('/mocks/new')} />
        ) : (
          <>
            <button
              onClick={() => navigate('/mocks/new')}
              className="btn-primary w-full"
            >
              <Plus className="w-4 h-4" /> Register mock
            </button>
            <ul className="space-y-2">
              {mocks.map((m) => (
                <MockRow key={m.id} mock={m} />
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

function MockRow({ mock }) {
  return (
    <li>
      <Link to={`/mocks/${mock.id}`} className="card p-3 flex items-center gap-3 hover:border-accent/40 transition">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <ListChecks className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">
              {mock.source || 'Mock'}
            </span>
            <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {mock.type === 'full' ? 'Full' : mock.section || 'Section'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {mock.date ? format(parseISO(mock.date), 'MMM d, yyyy') : ''}
            {' · '}
            {SECTIONS.map((s) => mock.scoresBySection?.[s]?.band)
              .filter(Boolean)
              .map((b) => b.toFixed(1))
              .join(' / ')}
          </p>
        </div>
        {mock.overall ? (
          <div className="text-right shrink-0">
            <p className="text-xl font-mono font-semibold text-accent">{mock.overall.toFixed(1)}</p>
            <p className="text-[10px] text-slate-400 -mt-1">overall</p>
          </div>
        ) : null}
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </Link>
    </li>
  );
}

function EmptyState({ onStart }) {
  return (
    <div className="card p-6 text-center space-y-3">
      <ListChecks className="w-10 h-10 mx-auto text-accent" />
      <h2 className="text-base font-semibold">No mocks yet</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Register your first mock to start tracking band progression and feed the error log automatically.
      </p>
      <button onClick={onStart} className="btn-primary mx-auto">
        <Plus className="w-4 h-4" /> Register first mock
      </button>
    </div>
  );
}
