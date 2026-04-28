import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Trash2, Save } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { db, saveAutoBackup } from '../lib/db.js';
import {
  SECTIONS,
  SECTION_LABEL,
  BAND_OPTIONS,
  QUESTION_TYPES,
  computeOverall,
} from '../lib/ielts-bands.js';
import { cn } from '../lib/cn.js';

const EMPTY_ERROR = () => ({
  section: 'reading',
  questionType: '',
  what: '',
  why: '',
  correctAnswer: '',
  myAnswer: '',
});

export default function MockNew() {
  const navigate = useNavigate();
  const [type, setType] = useState('full');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [source, setSource] = useState('Cambridge 17 · Test 1');
  const [durationMin, setDurationMin] = useState('170');
  const [notes, setNotes] = useState('');
  const [scores, setScores] = useState({
    listening: { raw: '', band: '' },
    reading: { raw: '', band: '' },
    writing: { raw: '', band: '' },
    speaking: { raw: '', band: '' },
  });
  const [errors, setErrors] = useState([EMPTY_ERROR()]);
  const [saving, setSaving] = useState(false);

  const overall = useMemo(() => {
    const numericScores = Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, { ...v, band: v.band ? Number(v.band) : null }]),
    );
    return computeOverall(numericScores);
  }, [scores]);

  function setSectionScore(s, key, value) {
    setScores((prev) => ({ ...prev, [s]: { ...prev[s], [key]: value } }));
  }

  function setError(i, key, value) {
    setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)));
  }
  function addError() {
    setErrors((prev) => [...prev, EMPTY_ERROR()]);
  }
  function removeError(i) {
    setErrors((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const cleanScores = Object.fromEntries(
      SECTIONS.map((s) => [
        s,
        {
          raw: scores[s].raw === '' ? null : Number(scores[s].raw),
          band: scores[s].band === '' ? null : Number(scores[s].band),
        },
      ]),
    );
    const mockId = await db.mockTests.add({
      date,
      type,
      source,
      durationMin: durationMin ? Number(durationMin) : null,
      notes,
      scoresBySection: cleanScores,
      overall: overall ?? null,
      createdAt: new Date().toISOString(),
    });

    const validErrors = errors.filter(
      (er) => er.what.trim() || er.questionType.trim() || er.correctAnswer.trim(),
    );
    if (validErrors.length) {
      const now = new Date().toISOString();
      await db.transaction('rw', db.mockErrors, db.errorLog, async () => {
        for (const er of validErrors) {
          await db.mockErrors.add({ mockId, ...er });
          await db.errorLog.add({
            sourceType: 'mock',
            sourceId: mockId,
            skill: er.section,
            description: er.what || er.questionType || 'Mock error',
            fixStrategy: er.why || '',
            questionType: er.questionType || null,
            correctAnswer: er.correctAnswer || null,
            myAnswer: er.myAnswer || null,
            status: 'open',
            reviewCount: 0,
            createdAt: now,
            lastReviewedAt: null,
          });
        }
      });
    }

    // Best-effort: refresh the auto-backup so a fresh mock can survive any
    // later render-time crash without going through the network.
    saveAutoBackup().catch(() => {});

    setSaving(false);
    navigate(`/mocks/${mockId}`, { replace: true });
  }

  return (
    <>
      <TopBar title="Register mock" back />
      <form onSubmit={save} className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Basics</h2>
          <div className="flex gap-2">
            <Toggle active={type === 'full'} onClick={() => setType('full')}>Full mock</Toggle>
            <Toggle active={type === 'section'} onClick={() => setType('section')}>Section only</Toggle>
          </div>
          <Field label="Date">
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Source">
            <input
              className="input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Cambridge 18 · Test 2"
            />
          </Field>
          <Field label="Duration (minutes)">
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
            />
          </Field>
        </section>

        <section className="card p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Section scores</h2>
            {overall ? (
              <span className="text-sm">
                <span className="text-slate-500 dark:text-slate-400 mr-1">Overall</span>
                <span className="font-mono font-semibold text-accent">{overall.toFixed(1)}</span>
              </span>
            ) : null}
          </div>
          {SECTIONS.map((s) => (
            <div key={s} className="grid grid-cols-[1fr_5rem_5rem] gap-2 items-end">
              <span className="text-sm text-slate-700 dark:text-slate-200 self-center">
                {SECTION_LABEL[s]}
              </span>
              <Field label="Raw">
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  value={scores[s].raw}
                  onChange={(e) => setSectionScore(s, 'raw', e.target.value)}
                  placeholder="—"
                />
              </Field>
              <Field label="Band">
                <select
                  className="input"
                  value={scores[s].band}
                  onChange={(e) => setSectionScore(s, 'band', e.target.value)}
                >
                  <option value="">—</option>
                  {BAND_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b.toFixed(1)}</option>
                  ))}
                </select>
              </Field>
            </div>
          ))}
        </section>

        <section className="card p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Errors</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Auto-saved to the error log
            </span>
          </div>
          {errors.map((er, i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 relative">
              <button
                type="button"
                onClick={() => removeError(i)}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-danger"
                aria-label="Remove error"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Section">
                  <select
                    className="input"
                    value={er.section}
                    onChange={(e) => setError(i, 'section', e.target.value)}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>{SECTION_LABEL[s]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Question type">
                  <select
                    className="input"
                    value={er.questionType}
                    onChange={(e) => setError(i, 'questionType', e.target.value)}
                  >
                    <option value="">—</option>
                    {(QUESTION_TYPES[er.section] || []).map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="What went wrong">
                <input
                  className="input"
                  value={er.what}
                  onChange={(e) => setError(i, 'what', e.target.value)}
                  placeholder="e.g. Misread 'not given' as 'false' on Q14"
                />
              </Field>
              <Field label="Why (root cause + fix)">
                <textarea
                  className="input min-h-[56px]"
                  value={er.why}
                  onChange={(e) => setError(i, 'why', e.target.value)}
                  placeholder="e.g. Skim too fast on inference Qs. Fix: highlight modal verbs in the passage."
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Correct answer">
                  <input
                    className="input"
                    value={er.correctAnswer}
                    onChange={(e) => setError(i, 'correctAnswer', e.target.value)}
                  />
                </Field>
                <Field label="My answer">
                  <input
                    className="input"
                    value={er.myAnswer}
                    onChange={(e) => setError(i, 'myAnswer', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addError}
            className="btn-outline w-full"
          >
            <Plus className="w-4 h-4" /> Add another error
          </button>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Notes</h2>
          <textarea
            className="input min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Conditions, fatigue, distractions, anything that affected your performance."
          />
        </section>

        <button type="submit" disabled={saving} className="btn-primary w-full sticky bottom-20">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save mock'}
        </button>
      </form>
    </>
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

function Toggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 py-2 text-sm font-medium rounded-xl border transition',
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
      )}
    >
      {children}
    </button>
  );
}
