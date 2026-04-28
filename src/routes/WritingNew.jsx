import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Save, Shuffle, Play, Pause, RotateCcw } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { db, saveAutoBackup } from '../lib/db.js';
import { useCountdown, formatMmSs } from '../hooks/useCountdown.js';
import prompts from '../data/writing-prompts.json';
import { cn } from '../lib/cn.js';

export default function WritingNew() {
  const navigate = useNavigate();
  const [taskType, setTaskType] = useState('T2');
  const [prompt, setPrompt] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [timerOn, setTimerOn] = useState(false);

  const targetWords = taskType === 'T1' ? 150 : 250;
  const targetMinutes = taskType === 'T1' ? 20 : 40;
  const wordCount = useMemo(() => countWords(body), [body]);

  const timer = useCountdown({ durationSec: targetMinutes * 60, autoStart: false });

  function pickRandomPrompt() {
    const pool = taskType === 'T1' ? prompts.task1 : prompts.task2;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setPrompt(next.prompt);
  }

  function switchTaskType(next) {
    setTaskType(next);
    timer.reset((next === 'T1' ? 20 : 40) * 60);
    setTimerOn(false);
  }

  async function save() {
    if (!body.trim()) return;
    setSaving(true);
    const id = await db.writingSamples.add({
      date: format(new Date(), 'yyyy-MM-dd'),
      taskType,
      prompt: prompt.trim(),
      body: body.trim(),
      wordCount,
      durationSec: targetMinutes * 60 - timer.remaining,
      selfAssessment: null,
      coachReview: false,
      createdAt: new Date().toISOString(),
    });
    saveAutoBackup().catch(() => {});
    setSaving(false);
    navigate(`/writing/${id}`, { replace: true });
  }

  const wordPct = Math.min(100, Math.round((wordCount / targetWords) * 100));
  const wordColour =
    wordCount < targetWords * 0.9
      ? 'text-warning'
      : wordCount > targetWords * 1.4
        ? 'text-warning'
        : 'text-success';

  return (
    <>
      <TopBar title="New writing sample" back />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
        <section className="card p-4 space-y-3">
          <div className="flex gap-2">
            <Toggle active={taskType === 'T1'} onClick={() => switchTaskType('T1')}>
              Task 1 · Academic
            </Toggle>
            <Toggle active={taskType === 'T2'} onClick={() => switchTaskType('T2')}>
              Task 2
            </Toggle>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Target: {targetWords}+ words in ≤ {targetMinutes} minutes.
          </p>
        </section>

        <section className="card p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Prompt</h2>
            <button onClick={pickRandomPrompt} className="text-xs text-accent hover:underline inline-flex items-center gap-1">
              <Shuffle className="w-3.5 h-3.5" /> Random prompt
            </button>
          </div>
          <textarea
            className="input min-h-[88px]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              taskType === 'T1'
                ? 'Paste your Task 1 prompt or hit Random prompt'
                : 'Paste your Task 2 prompt or hit Random prompt'
            }
          />
        </section>

        <section className="card p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Timer</h2>
            <span
              className={cn(
                'text-2xl font-mono font-semibold',
                timer.remaining <= 60 && timer.running ? 'text-danger' : 'text-slate-700 dark:text-slate-200',
              )}
            >
              {formatMmSs(timer.remaining)}
            </span>
          </div>
          <div className="flex gap-2">
            {!timer.running ? (
              <button
                onClick={() => {
                  timer.start();
                  setTimerOn(true);
                }}
                className="btn-primary flex-1"
              >
                <Play className="w-4 h-4" /> {timerOn ? 'Resume' : 'Start timer'}
              </button>
            ) : (
              <button onClick={timer.pause} className="btn-outline flex-1">
                <Pause className="w-4 h-4" /> Pause
              </button>
            )}
            <button onClick={() => timer.reset()} className="btn-outline">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="card p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Your response</h2>
            <span className={cn('text-xs font-mono', wordColour)}>
              {wordCount} / {targetWords} words
            </span>
          </div>
          <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${wordPct}%` }}
            />
          </div>
          <textarea
            className="input min-h-[320px] font-mono text-sm leading-relaxed"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your response here. Aim for clear paragraphing — Coherence and Cohesion grades it."
          />
        </section>

        <button
          onClick={save}
          disabled={saving || !body.trim()}
          className="btn-primary w-full sticky bottom-20"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save and self-assess'}
        </button>
      </main>
    </>
  );
}

function countWords(text) {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
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
