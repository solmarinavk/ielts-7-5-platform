import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Check, RotateCcw, X } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { db } from '../lib/db.js';
import { reviewCard, SRS_QUALITY } from '../lib/srs.js';
import { useVocabQueue, useVocabStats } from '../hooks/useVocabQueue.js';
import { cn } from '../lib/cn.js';

const TABS = [
  { id: 'review', label: 'Review' },
  { id: 'list', label: 'List' },
  { id: 'add', label: 'Add' },
];

export default function Vocab() {
  const [tab, setTab] = useState('review');
  const stats = useVocabStats();

  return (
    <>
      <TopBar title="Vocab" back />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
        <StatsBar stats={stats} />
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition',
                tab === t.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'review' && <ReviewTab />}
        {tab === 'list' && <ListTab />}
        {tab === 'add' && <AddTab onAdded={() => setTab('list')} />}
      </main>
    </>
  );
}

function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <section className="grid grid-cols-4 gap-2">
      <Tile label="Due" value={stats.dueToday} accent />
      <Tile label="New" value={stats.newCount} />
      <Tile label="Learning" value={stats.learning + stats.review} />
      <Tile label="Mastered" value={stats.mastered} />
    </section>
  );
}

function Tile({ label, value, accent }) {
  return (
    <div className={cn('card p-2.5 text-center', accent && 'border-accent/40 bg-accent/5')}>
      <p className={cn('text-lg font-mono font-semibold', accent && 'text-accent')}>{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function ReviewTab() {
  const queue = useVocabQueue();
  const [revealed, setRevealed] = useState(false);
  const [cursor, setCursor] = useState(0);

  if (!queue) return <p className="text-sm text-slate-500">Loading…</p>;
  if (queue.length === 0) {
    return (
      <div className="card p-6 text-center space-y-2">
        <Check className="w-10 h-10 mx-auto text-success" />
        <p className="text-sm font-semibold">All caught up</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Nothing due right now. Add new words from the Add tab or come back tomorrow.
        </p>
      </div>
    );
  }

  // The cursor only points to a position in the original queue snapshot. After a
  // grade, queue updates and the next index renders automatically; we reset cursor
  // when we run past the end.
  const card = queue[cursor] ?? queue[0];
  if (!card) return null;

  async function grade(quality) {
    const updated = reviewCard(card, quality);
    await db.vocabCards.put(updated);
    setRevealed(false);
    setCursor((c) => c + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Card {Math.min(cursor + 1, queue.length)} of {queue.length}</span>
        <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {card.status === 'new' ? 'NEW' : card.status?.toUpperCase()}
        </span>
      </div>

      <article className="card p-6 min-h-[260px] flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {card.partOfSpeech}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight mt-1">{card.word}</h2>
        </div>

        {revealed ? (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm text-slate-700 dark:text-slate-200">{card.definition}</p>
            <p className="text-sm italic text-slate-600 dark:text-slate-300 border-l-2 border-accent/40 pl-3">
              {card.exampleIELTS}
            </p>
            {card.collocations?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {card.collocations.map((c) => (
                  <span key={c} className="chip bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="btn-outline mt-auto self-stretch"
          >
            Reveal
          </button>
        )}
      </article>

      {revealed ? (
        <div className="grid grid-cols-4 gap-1.5">
          <GradeBtn label="Again" hint="<1d" colour="bg-danger/10 text-danger border-danger/30" onClick={() => grade(SRS_QUALITY.AGAIN)} />
          <GradeBtn label="Hard" hint="" colour="bg-warning/10 text-warning border-warning/30" onClick={() => grade(SRS_QUALITY.HARD)} />
          <GradeBtn label="Good" hint="" colour="bg-success/10 text-success border-success/30" onClick={() => grade(SRS_QUALITY.GOOD)} />
          <GradeBtn label="Easy" hint="" colour="bg-accent/10 text-accent border-accent/30" onClick={() => grade(SRS_QUALITY.EASY)} />
        </div>
      ) : null}
    </div>
  );
}

function GradeBtn({ label, hint, colour, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn('btn border', colour, 'flex-col gap-0 py-2.5')}
    >
      <span className="text-sm font-semibold">{label}</span>
      {hint ? <span className="text-[10px] opacity-70">{hint}</span> : null}
    </button>
  );
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'learning', label: 'Learning' },
  { id: 'review', label: 'Review' },
  { id: 'mastered', label: 'Mastered' },
];

function ListTab() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const cards = useLiveQuery(async () => {
    const all = await db.vocabCards.toArray();
    return all.sort((a, b) => a.word.localeCompare(b.word));
  }, []);

  if (!cards) return <p className="text-sm text-slate-500">Loading…</p>;
  const filtered = cards
    .filter((c) => (filter === 'all' ? true : c.status === filter))
    .filter((c) =>
      search.trim() ? c.word.toLowerCase().includes(search.toLowerCase()) : true,
    );

  async function reset(card) {
    await db.vocabCards.put({
      ...card,
      easiness: 2.5,
      repetitions: 0,
      interval: 0,
      nextReview: null,
      lastReviewed: null,
      status: 'new',
    });
  }
  async function remove(card) {
    if (!confirm(`Delete "${card.word}"?`)) return;
    await db.vocabCards.delete(card.id);
  }

  return (
    <div className="space-y-3">
      <input
        className="input"
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'chip border whitespace-nowrap text-xs',
              filter === f.id
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{filtered.length} entries</p>
      <ul className="space-y-2">
        {filtered.map((c) => (
          <li key={c.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{c.word}</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    {c.partOfSpeech}
                  </span>
                  <StatusChip status={c.status} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {c.definition}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => reset(c)}
                  title="Reset progress"
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(c)}
                  title="Delete card"
                  className="p-1.5 rounded-lg hover:bg-danger/10 text-slate-400 hover:text-danger"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusChip({ status }) {
  const map = {
    new: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    learning: 'bg-warning/10 text-warning',
    review: 'bg-accent/10 text-accent',
    mastered: 'bg-success/10 text-success',
  };
  return <span className={cn('chip', map[status] || map.new)}>{status}</span>;
}

function AddTab({ onAdded }) {
  const [form, setForm] = useState({
    word: '',
    partOfSpeech: 'noun',
    definition: '',
    exampleIELTS: '',
    collocations: '',
    level: 2,
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e) {
    e.preventDefault();
    if (!form.word.trim() || !form.definition.trim()) return;
    setSaving(true);
    await db.vocabCards.add({
      word: form.word.trim(),
      partOfSpeech: form.partOfSpeech,
      definition: form.definition.trim(),
      exampleIELTS: form.exampleIELTS.trim(),
      collocations: form.collocations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      level: Number(form.level),
      tags: ['user'],
      easiness: 2.5,
      repetitions: 0,
      interval: 0,
      nextReview: null,
      lastReviewed: null,
      status: 'new',
      addedAt: new Date().toISOString(),
      source: 'manual',
    });
    setSaving(false);
    onAdded?.();
  }

  return (
    <form onSubmit={save} className="card p-4 space-y-3">
      <Field label="Word">
        <input
          autoFocus
          className="input"
          value={form.word}
          onChange={(e) => set('word', e.target.value)}
          placeholder="e.g. tantamount"
          required
        />
      </Field>
      <Field label="Part of speech">
        <select
          className="input"
          value={form.partOfSpeech}
          onChange={(e) => set('partOfSpeech', e.target.value)}
        >
          {['noun', 'verb', 'adjective', 'adverb', 'phrase', 'linker'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>
      <Field label="Definition">
        <textarea
          className="input min-h-[64px]"
          value={form.definition}
          onChange={(e) => set('definition', e.target.value)}
          required
        />
      </Field>
      <Field label="IELTS example sentence">
        <textarea
          className="input min-h-[64px]"
          value={form.exampleIELTS}
          onChange={(e) => set('exampleIELTS', e.target.value)}
          placeholder="A complete sentence as you would actually use it in Task 1 / 2."
        />
      </Field>
      <Field label="Collocations (comma-separated)">
        <input
          className="input"
          value={form.collocations}
          onChange={(e) => set('collocations', e.target.value)}
          placeholder="strong demand, growing demand, demand falls"
        />
      </Field>
      <Field label="Difficulty">
        <select
          className="input"
          value={form.level}
          onChange={(e) => set('level', e.target.value)}
        >
          <option value={1}>1 · easy</option>
          <option value={2}>2 · mid</option>
          <option value={3}>3 · advanced</option>
        </select>
      </Field>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        <Plus className="w-4 h-4" />
        {saving ? 'Saving…' : 'Add to deck'}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label block mb-1">{label}</span>
      {children}
    </label>
  );
}
