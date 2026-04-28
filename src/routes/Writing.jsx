import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { Plus, ChevronRight, PenSquare, Star } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { db } from '../lib/db.js';

export default function Writing() {
  const navigate = useNavigate();
  const samples = useLiveQuery(async () => {
    const all = await db.writingSamples.toArray();
    return all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, []);

  return (
    <>
      <TopBar
        title="Writing"
        back
        right={
          <button
            onClick={() => navigate('/writing/new')}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="New writing sample"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-3 animate-fade-in">
        {!samples ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : samples.length === 0 ? (
          <Empty onStart={() => navigate('/writing/new')} />
        ) : (
          <>
            <button onClick={() => navigate('/writing/new')} className="btn-primary w-full">
              <Plus className="w-4 h-4" /> New writing sample
            </button>
            <ul className="space-y-2">
              {samples.map((s) => (
                <SampleRow key={s.id} sample={s} />
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

function SampleRow({ sample }) {
  const overall = sample.selfAssessment?.overall;
  return (
    <li>
      <Link
        to={`/writing/${sample.id}`}
        className="card p-3 flex items-center gap-3 hover:border-accent/40 transition"
      >
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <PenSquare className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              {sample.taskType === 'T1' ? 'Task 1' : 'Task 2'}
            </span>
            <span className="text-[10px] text-slate-400">{sample.wordCount} words</span>
            {sample.coachReview ? (
              <span className="chip bg-accent/10 text-accent">
                <Star className="w-3 h-3" /> coach
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-100 mt-0.5 truncate">
            {(sample.prompt || '').slice(0, 90)}
            {(sample.prompt || '').length > 90 ? '…' : ''}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {sample.date ? format(parseISO(sample.date), 'MMM d, yyyy') : ''}
          </p>
        </div>
        {overall != null ? (
          <div className="text-right shrink-0">
            <p className="text-xl font-mono font-semibold text-accent">{overall.toFixed(1)}</p>
            <p className="text-[10px] text-slate-400 -mt-1">band</p>
          </div>
        ) : null}
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </Link>
    </li>
  );
}

function Empty({ onStart }) {
  return (
    <div className="card p-6 text-center space-y-3">
      <PenSquare className="w-10 h-10 mx-auto text-accent" />
      <h2 className="text-base font-semibold">No writing samples yet</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Start a new sample, write under timed conditions and self-assess against the band rubric
        when you finish.
      </p>
      <button onClick={onStart} className="btn-primary mx-auto">
        <Plus className="w-4 h-4" /> Start first sample
      </button>
    </div>
  );
}
