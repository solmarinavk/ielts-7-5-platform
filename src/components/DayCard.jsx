import { Check, Clock, ExternalLink } from 'lucide-react';
import { setBlockDone } from '../hooks/useDailyPlan.js';
import { cn } from '../lib/cn.js';
import { getResourceForBlock } from '../lib/resources.js';

const SKILL_ROUTE = {
  vocab: '/vocab',
  listening: '/mocks',
  reading: '/mocks',
  writing: '/writing',
  speaking: '/speaking',
  mock: '/mocks',
  diagnostic: '/mocks',
  review: '/errors',
  rest: null,
};

const SKILL_LABEL = {
  vocab: 'Vocab',
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  mock: 'Mock',
  diagnostic: 'Mock',
  review: 'Review',
  rest: 'Rest',
};

const PHASE_BG = {
  diagnostic: 'bg-phase-diagnostic',
  build: 'bg-phase-build',
  mocks: 'bg-phase-mocks',
  refine: 'bg-phase-refine',
  taper: 'bg-phase-taper',
};

export default function DayCard({ day, onStart }) {
  if (!day) return null;
  const completed = day.blocks?.filter((b) => b.done).length ?? 0;
  const total = day.blocks?.length ?? 0;

  return (
    <section className="card overflow-hidden">
      <div className={cn('px-4 py-3 flex items-center justify-between', PHASE_BG[day.phase])}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
            {day.phaseLabel} · day {day.dayNumber} of 45
          </p>
          <h3 className="text-base font-semibold text-slate-900 mt-0.5">{day.title}</h3>
        </div>
        <span className="chip bg-white/70 text-slate-700">
          <Clock className="w-3 h-3" /> {day.totalMinutes} min
        </span>
      </div>
      <div className="px-2 py-2 divide-y divide-slate-100 dark:divide-slate-800">
        {day.blocks.map((b) => {
          const route = SKILL_ROUTE[b.skill] ?? null;
          const resource = getResourceForBlock(b);
          return (
            <div key={b.id} className="flex items-center gap-3 px-2 py-2.5">
              <button
                onClick={() => setBlockDone(day.date, b.id, !b.done)}
                aria-label={b.done ? 'Mark as pending' : 'Mark as done'}
                className={cn(
                  'shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition',
                  b.done
                    ? 'bg-success border-success text-white'
                    : 'border-slate-300 dark:border-slate-600 hover:border-accent',
                )}
              >
                {b.done ? <Check className="w-4 h-4" strokeWidth={3} /> : null}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {SKILL_LABEL[b.skill] ?? b.skill}
                  </span>
                  {b.minutes ? (
                    <span className="text-[10px] text-slate-400">{b.minutes} min</span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    'text-sm leading-snug',
                    b.done ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100',
                  )}
                >
                  {b.label}
                </p>
                {resource ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {resource.title}
                  </a>
                ) : null}
              </div>
              {route ? (
                <button
                  onClick={() => onStart?.(route, b)}
                  className="text-xs font-medium text-accent hover:underline shrink-0"
                >
                  Start
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400">
        Progress: {completed} of {total} blocks
      </div>
    </section>
  );
}
