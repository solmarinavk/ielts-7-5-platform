import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAllPlanDays } from '../hooks/useDailyPlan.js';
import TopBar from '../components/TopBar.jsx';
import DayCard from '../components/DayCard.jsx';
import { todayKey } from '../lib/plan-generator.js';
import { cn } from '../lib/cn.js';
import { useNavigate } from 'react-router-dom';

const PHASE_BG = {
  diagnostic: 'bg-phase-diagnostic',
  build: 'bg-phase-build',
  mocks: 'bg-phase-mocks',
  refine: 'bg-phase-refine',
  taper: 'bg-phase-taper',
};

const PHASES = [
  { id: 'diagnostic', label: 'Diagnostic', range: '1–4' },
  { id: 'build', label: 'Build', range: '5–20' },
  { id: 'mocks', label: 'Mock tests', range: '21–35' },
  { id: 'refine', label: 'Refinement', range: '36–42' },
  { id: 'taper', label: 'Taper', range: '43–45' },
];

export default function Plan() {
  const navigate = useNavigate();
  const days = useAllPlanDays();
  const [selectedDate, setSelectedDate] = useState(null);

  if (!days) {
    return (
      <>
        <TopBar title="45-day plan" back />
        <main className="max-w-xl mx-auto px-4 py-6">Loading…</main>
      </>
    );
  }

  if (days.length === 0) {
    return (
      <>
        <TopBar title="45-day plan" back />
        <main className="max-w-xl mx-auto px-4 py-6 space-y-3">
          <p className="text-sm text-slate-500">
            No plan generated yet. Set your exam date first.
          </p>
          <button className="btn-primary" onClick={() => navigate('/settings')}>
            Go to Settings
          </button>
        </main>
      </>
    );
  }

  const selected = selectedDate ? days.find((d) => d.date === selectedDate) : null;
  const today = todayKey();

  return (
    <>
      <TopBar title="45-day plan" back />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
        <Legend />
        <section className="card p-3">
          <div className="grid grid-cols-5 gap-1.5">
            {days.map((d) => {
              const allDone = d.blocks?.length > 0 && d.blocks.every((b) => b.done);
              const isToday = d.date === today;
              const isSelected = d.date === selectedDate;
              return (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date === selectedDate ? null : d.date)}
                  title={`Day ${d.dayNumber} · ${format(parseISO(d.date), 'MMM d')}`}
                  className={cn(
                    'aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-medium border transition active:scale-[0.97]',
                    PHASE_BG[d.phase],
                    'text-slate-800',
                    allDone ? 'ring-2 ring-success' : '',
                    isToday ? 'ring-2 ring-accent' : '',
                    isSelected ? 'border-slate-900 border-2' : 'border-transparent',
                  )}
                >
                  <span className="font-mono font-semibold">{d.dayNumber}</span>
                  <span className="text-[9px] opacity-70">
                    {format(parseISO(d.date), 'M/d')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        {selected ? <DayCard day={selected} onStart={(route) => navigate(route)} /> : null}
      </main>
    </>
  );
}

function Legend() {
  return (
    <section className="card p-3">
      <p className="label mb-2">Phases</p>
      <ul className="grid grid-cols-2 gap-1.5">
        {PHASES.map((p) => (
          <li key={p.id} className="flex items-center gap-2 text-xs">
            <span className={cn('w-3 h-3 rounded', PHASE_BG[p.id])} />
            <span className="text-slate-600 dark:text-slate-300">
              {p.label} <span className="text-slate-400">({p.range})</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
