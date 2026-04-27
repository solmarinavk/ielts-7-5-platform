import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { Trash2, ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { db } from '../lib/db.js';
import { SECTIONS, SECTION_LABEL } from '../lib/ielts-bands.js';
import { cn } from '../lib/cn.js';

export default function MockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mockId = Number(id);

  const data = useLiveQuery(async () => {
    const mock = await db.mockTests.get(mockId);
    if (!mock) return { mock: null, errors: [], previous: null };
    const errors = await db.mockErrors.where('mockId').equals(mockId).toArray();
    const all = await db.mockTests.toArray();
    const earlier = all
      .filter((m) => (m.date || '') < (mock.date || ''))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return { mock, errors, previous: earlier[0] || null };
  }, [mockId]);

  if (!data) return <Loading />;
  if (!data.mock) {
    return (
      <>
        <TopBar title="Mock not found" back />
        <main className="max-w-xl mx-auto px-4 py-8 text-sm text-slate-500">
          This mock no longer exists.
        </main>
      </>
    );
  }

  const { mock, errors, previous } = data;
  const errorsBySection = groupBySection(errors);

  async function remove() {
    if (!confirm('Delete this mock and its error-log entries?')) return;
    await db.transaction('rw', db.mockTests, db.mockErrors, db.errorLog, async () => {
      await db.mockTests.delete(mockId);
      await db.mockErrors.where('mockId').equals(mockId).delete();
      await db.errorLog
        .where('sourceType')
        .equals('mock')
        .and((e) => e.sourceId === mockId)
        .delete();
    });
    navigate('/mocks', { replace: true });
  }

  return (
    <>
      <TopBar
        title="Mock detail"
        back
        right={
          <button onClick={remove} className="p-2 rounded-full hover:bg-danger/10 text-slate-400 hover:text-danger" aria-label="Delete mock">
            <Trash2 className="w-5 h-5" />
          </button>
        }
      />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
        <header className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mock.date ? format(parseISO(mock.date), 'EEEE, MMMM d, yyyy') : ''}
            {' · '}
            {mock.type === 'full' ? 'Full mock' : 'Section only'}
          </p>
          <h1 className="text-lg font-semibold mt-1">{mock.source || 'Mock'}</h1>
          {mock.overall ? (
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-mono font-semibold text-accent">{mock.overall.toFixed(1)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">overall band</span>
              {previous?.overall ? <BandDelta delta={mock.overall - previous.overall} /> : null}
            </div>
          ) : null}
        </header>

        <section className="card p-4">
          <h2 className="text-sm font-semibold mb-3">Section scores</h2>
          <div className="grid grid-cols-2 gap-3">
            {SECTIONS.map((s) => {
              const cur = mock.scoresBySection?.[s]?.band ?? null;
              const prev = previous?.scoresBySection?.[s]?.band ?? null;
              return (
                <div key={s} className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {SECTION_LABEL[s]}
                  </p>
                  <p className="text-xl font-mono font-semibold mt-0.5">
                    {cur != null ? cur.toFixed(1) : '—'}
                  </p>
                  {cur != null && prev != null ? (
                    <p className="text-[11px] mt-0.5"><BandDelta delta={cur - prev} compact /></p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Errors ({errors.length})</h2>
            <Link to="/errors" className="text-xs text-accent hover:underline">
              Open error log →
            </Link>
          </div>
          {errors.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No errors logged for this mock.</p>
          ) : (
            <div className="space-y-3">
              {SECTIONS.filter((s) => errorsBySection[s]?.length).map((s) => (
                <div key={s}>
                  <p className="label mb-1.5">{SECTION_LABEL[s]}</p>
                  <ul className="space-y-1.5">
                    {errorsBySection[s].map((er) => (
                      <li key={er.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-xs">
                        {er.questionType ? (
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            {er.questionType}
                          </p>
                        ) : null}
                        <p className="text-slate-800 dark:text-slate-100 font-medium mt-0.5">{er.what || '—'}</p>
                        {er.why ? <p className="text-slate-500 dark:text-slate-400 mt-1">Why: {er.why}</p> : null}
                        {(er.correctAnswer || er.myAnswer) ? (
                          <p className="text-slate-500 dark:text-slate-400 mt-1">
                            <span className="text-success">{er.correctAnswer || '—'}</span>
                            <span className="mx-1">·</span>
                            <span className="text-danger line-through">{er.myAnswer || '—'}</span>
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {mock.notes ? (
          <section className="card p-4">
            <h2 className="text-sm font-semibold mb-2">Notes</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{mock.notes}</p>
          </section>
        ) : null}
      </main>
    </>
  );
}

function groupBySection(errors) {
  const out = {};
  for (const e of errors) {
    (out[e.section] ||= []).push(e);
  }
  return out;
}

function BandDelta({ delta, compact }) {
  if (delta === 0) {
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-slate-400', !compact && 'text-xs')}>
        <Minus className="w-3 h-3" /> 0.0
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5',
        up ? 'text-success' : 'text-danger',
        !compact && 'text-xs',
      )}
    >
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {(up ? '+' : '') + delta.toFixed(1)}
    </span>
  );
}

function Loading() {
  return (
    <>
      <TopBar title="Mock detail" back />
      <main className="max-w-xl mx-auto px-4 py-6 text-sm text-slate-500">Loading…</main>
    </>
  );
}
