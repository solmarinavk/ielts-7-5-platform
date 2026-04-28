import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { Trash2, Star } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { db, saveAutoBackup } from '../lib/db.js';
import BandRubric from '../components/BandRubric.jsx';

export default function WritingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sampleId = Number(id);
  const sample = useLiveQuery(() => db.writingSamples.get(sampleId), [sampleId]);

  const [rubric, setRubric] = useState(null);
  const [coachReview, setCoachReview] = useState(false);
  const [savingRubric, setSavingRubric] = useState(false);

  useEffect(() => {
    if (sample) {
      setRubric(sample.selfAssessment || null);
      setCoachReview(Boolean(sample.coachReview));
    }
  }, [sample?.id]);

  if (sample === undefined) {
    return (
      <>
        <TopBar title="Writing sample" back />
        <main className="max-w-xl mx-auto px-4 py-6 text-sm text-slate-500">Loading…</main>
      </>
    );
  }
  if (!sample) {
    return (
      <>
        <TopBar title="Sample not found" back />
        <main className="max-w-xl mx-auto px-4 py-8 text-sm text-slate-500">
          This writing sample no longer exists.
        </main>
      </>
    );
  }

  async function saveRubric() {
    setSavingRubric(true);
    const overall = computeOverall(rubric);
    await db.writingSamples.put({
      ...sample,
      selfAssessment: { ...rubric, overall },
      coachReview,
    });
    saveAutoBackup().catch(() => {});
    setSavingRubric(false);
  }

  async function toggleCoachReview() {
    const next = !coachReview;
    setCoachReview(next);
    await db.writingSamples.put({ ...sample, coachReview: next });
    saveAutoBackup().catch(() => {});
  }

  async function remove() {
    if (!confirm('Delete this writing sample?')) return;
    await db.writingSamples.delete(sampleId);
    saveAutoBackup().catch(() => {});
    navigate('/writing', { replace: true });
  }

  return (
    <>
      <TopBar
        title="Writing sample"
        back
        right={
          <button
            onClick={remove}
            className="p-2 rounded-full hover:bg-danger/10 text-slate-400 hover:text-danger"
            aria-label="Delete sample"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        }
      />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
        <header className="card p-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              {sample.taskType === 'T1' ? 'Task 1' : 'Task 2'}
            </span>
            <span className="text-[11px] text-slate-400">
              {sample.date ? format(parseISO(sample.date), 'MMMM d, yyyy') : ''}
              {' · '}
              {sample.wordCount} words
              {sample.durationSec ? ` · ${Math.round(sample.durationSec / 60)} min` : ''}
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{sample.prompt}</p>
        </header>

        <section className="card p-4">
          <h2 className="text-sm font-semibold mb-2">Your response</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-slate-800 dark:text-slate-100">
            {sample.body}
          </p>
        </section>

        <BandRubric
          taskType={sample.taskType}
          value={rubric}
          onChange={setRubric}
        />

        <button
          onClick={saveRubric}
          disabled={savingRubric || !rubric}
          className="btn-primary w-full"
        >
          {savingRubric ? 'Saving…' : 'Save self-assessment'}
        </button>

        <section className="card p-4 space-y-2">
          <h2 className="text-sm font-semibold">Coach review</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Marked samples are included in the next Markdown export so you can hand them to your
            coach without scrolling.
          </p>
          <button
            onClick={toggleCoachReview}
            className={
              coachReview
                ? 'btn-primary w-full'
                : 'btn-outline w-full'
            }
          >
            <Star className="w-4 h-4" />
            {coachReview ? 'Marked for coach review' : 'Mark for coach review'}
          </button>
        </section>
      </main>
    </>
  );
}

function computeOverall(rubric) {
  if (!rubric) return null;
  const vals = ['TR', 'CC', 'LR', 'GRA']
    .map((k) => rubric[k])
    .filter((v) => typeof v === 'number');
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  // Same IELTS rounding rule as in BandRubric.
  const floor = Math.floor(avg);
  const frac = avg - floor;
  if (frac < 0.25) return floor;
  if (frac < 0.75) return floor + 0.5;
  return floor + 1;
}
