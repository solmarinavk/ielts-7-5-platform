import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { Check, RotateCcw, X, AlertTriangle } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { db } from '../lib/db.js';
import { SECTIONS, SECTION_LABEL } from '../lib/ielts-bands.js';
import { cn } from '../lib/cn.js';

const STATUS_FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'reviewed', label: 'Reviewed' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
];

export default function Errors() {
  const [statusFilter, setStatusFilter] = useState('open');
  const [skillFilter, setSkillFilter] = useState('all');
  const errors = useLiveQuery(async () => {
    const all = await db.errorLog.toArray();
    return all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, []);

  if (!errors) return <Loading />;
  const filtered = errors
    .filter((e) => (statusFilter === 'all' ? true : e.status === statusFilter))
    .filter((e) => (skillFilter === 'all' ? true : e.skill === skillFilter));

  const counts = {
    open: errors.filter((e) => e.status === 'open').length,
    reviewed: errors.filter((e) => e.status === 'reviewed').length,
    closed: errors.filter((e) => e.status === 'closed').length,
  };

  return (
    <>
      <TopBar title="Error log" back />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
        <section className="grid grid-cols-3 gap-2">
          <Tile label="Open" value={counts.open} accent="text-warning" />
          <Tile label="Reviewed" value={counts.reviewed} accent="text-accent" />
          <Tile label="Closed" value={counts.closed} accent="text-success" />
        </section>

        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap px-2',
                statusFilter === f.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
          <SkillChip id="all" current={skillFilter} onClick={setSkillFilter}>All skills</SkillChip>
          {SECTIONS.map((s) => (
            <SkillChip key={s} id={s} current={skillFilter} onClick={setSkillFilter}>
              {SECTION_LABEL[s]}
            </SkillChip>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">{filtered.length} entries</p>

        {filtered.length === 0 ? (
          <EmptyState statusFilter={statusFilter} totalErrors={errors.length} />
        ) : (
          <ul className="space-y-2">
            {filtered.map((er) => (
              <ErrorRow key={er.id} error={er} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function ErrorRow({ error }) {
  async function setStatus(status) {
    const patch = { ...error, status };
    if (status === 'reviewed') {
      patch.reviewCount = (error.reviewCount ?? 0) + 1;
      patch.lastReviewedAt = new Date().toISOString();
    }
    await db.errorLog.put(patch);
  }
  async function remove() {
    if (!confirm('Delete this error from the log?')) return;
    await db.errorLog.delete(error.id);
  }

  return (
    <li className="card p-3">
      <div className="flex items-start gap-2 mb-1.5 flex-wrap">
        <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          {SECTION_LABEL[error.skill] || error.skill}
        </span>
        {error.questionType ? (
          <span className="chip bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px]">
            {error.questionType}
          </span>
        ) : null}
        <StatusBadge status={error.status} />
        <span className="text-[10px] text-slate-400 ml-auto">
          {error.createdAt ? format(parseISO(error.createdAt), 'MMM d') : ''}
        </span>
      </div>
      <p className="text-sm text-slate-800 dark:text-slate-100 font-medium">{error.description || '—'}</p>
      {error.fixStrategy ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Why: {error.fixStrategy}</p>
      ) : null}
      {(error.correctAnswer || error.myAnswer) ? (
        <p className="text-xs mt-1">
          <span className="text-success">{error.correctAnswer || '—'}</span>
          <span className="mx-1 text-slate-400">·</span>
          <span className="text-danger line-through">{error.myAnswer || '—'}</span>
        </p>
      ) : null}
      {error.reviewCount ? (
        <p className="text-[10px] text-slate-400 mt-1.5">Reviewed {error.reviewCount}× · last {error.lastReviewedAt ? format(parseISO(error.lastReviewedAt), 'MMM d') : '—'}</p>
      ) : null}
      <div className="flex gap-1.5 mt-2.5">
        {error.status !== 'reviewed' ? (
          <button onClick={() => setStatus('reviewed')} className="btn-outline text-xs flex-1">
            <Check className="w-3.5 h-3.5" /> Mark reviewed
          </button>
        ) : null}
        {error.status !== 'open' ? (
          <button onClick={() => setStatus('open')} className="btn-outline text-xs flex-1">
            <RotateCcw className="w-3.5 h-3.5" /> Re-open
          </button>
        ) : null}
        {error.status !== 'closed' ? (
          <button onClick={() => setStatus('closed')} className="btn-outline text-xs flex-1 text-success border-success/40">
            <Check className="w-3.5 h-3.5" /> Close
          </button>
        ) : null}
        <button onClick={remove} className="btn-outline text-xs px-2.5 text-danger border-danger/30">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

function StatusBadge({ status }) {
  const map = {
    open: 'bg-warning/10 text-warning',
    reviewed: 'bg-accent/10 text-accent',
    closed: 'bg-success/10 text-success',
  };
  return <span className={cn('chip', map[status] || map.open)}>{status}</span>;
}

function SkillChip({ id, current, onClick, children }) {
  const active = id === current;
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        'chip border whitespace-nowrap text-xs',
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
      )}
    >
      {children}
    </button>
  );
}

function Tile({ label, value, accent }) {
  return (
    <div className="card p-2.5 text-center">
      <p className={cn('text-lg font-mono font-semibold', accent)}>{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function EmptyState({ statusFilter, totalErrors }) {
  if (totalErrors === 0) {
    return (
      <div className="card p-6 text-center space-y-2">
        <AlertTriangle className="w-10 h-10 mx-auto text-warning" />
        <p className="text-sm font-semibold">No errors logged yet</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          When you register a mock, every error you capture lands here automatically.
        </p>
      </div>
    );
  }
  return (
    <div className="card p-6 text-center text-sm text-slate-500">
      No errors match the current filters.
    </div>
  );
}

function Loading() {
  return (
    <>
      <TopBar title="Error log" back />
      <main className="max-w-xl mx-auto px-4 py-6 text-sm text-slate-500">Loading…</main>
    </>
  );
}
