import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { Shuffle, ChevronLeft, ChevronRight, Trash2, Clock } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import Recorder from '../components/Recorder.jsx';
import { db, saveAutoBackup } from '../lib/db.js';
import { useCountdown, formatMmSs } from '../hooks/useCountdown.js';
import cueCardsData from '../data/cue-cards.json';
import part1Data from '../data/speaking-part1-topics.json';
import { cn } from '../lib/cn.js';

const TABS = [
  { id: 'p1', label: 'Part 1' },
  { id: 'p2', label: 'Part 2' },
  { id: 'p3', label: 'Part 3' },
];

export default function Speaking() {
  const [tab, setTab] = useState('p1');

  return (
    <>
      <TopBar title="Speaking" back />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
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

        {tab === 'p1' && <Part1Tab />}
        {tab === 'p2' && <Part2Tab />}
        {tab === 'p3' && <Part3Tab />}

        <RecentRecordings part={tab === 'p1' ? 1 : tab === 'p2' ? 2 : 3} />
      </main>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Part 1: 4-5 minute topical Q&A. Pick a topic; the recorder runs for 4 min.
// ────────────────────────────────────────────────────────────────────────────
function Part1Tab() {
  const [topicId, setTopicId] = useState(part1Data.topics[0].id);
  const [saving, setSaving] = useState(false);
  const topic = part1Data.topics.find((t) => t.id === topicId);

  async function save({ transcript, audioBlob, durationSec }) {
    setSaving(true);
    await db.speakingRecordings.add({
      date: format(new Date(), 'yyyy-MM-dd'),
      part: 1,
      topic: topic?.label ?? null,
      cueCardId: null,
      transcript,
      audioBlob,
      durationSec,
      selfNotes: '',
      createdAt: new Date().toISOString(),
    });
    saveAutoBackup().catch(() => {});
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <section className="card p-4 space-y-2">
        <p className="label">Pick a topic</p>
        <select
          className="input"
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
        >
          {part1Data.topics.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        {topic ? (
          <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-200 mt-1">
            {topic.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        ) : null}
      </section>
      <Recorder
        durationSec={4 * 60}
        hint="Real Part 1 runs 4-5 min. Speak through the questions naturally."
        saving={saving}
        onSave={save}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Part 2: 1 min prep + 2 min monologue. Pick or randomise a cue card.
// ────────────────────────────────────────────────────────────────────────────
function Part2Tab() {
  const [cardIdx, setCardIdx] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | prep | monologue
  const [saving, setSaving] = useState(false);
  const card = cueCardsData.cards[cardIdx];

  const prepTimer = useCountdown({
    durationSec: 60,
    onComplete: () => setPhase('monologue'),
  });

  function randomise() {
    setCardIdx(Math.floor(Math.random() * cueCardsData.cards.length));
    setPhase('idle');
    prepTimer.reset(60);
  }
  function nextCard() {
    setCardIdx((i) => (i + 1) % cueCardsData.cards.length);
    setPhase('idle');
    prepTimer.reset(60);
  }
  function prevCard() {
    setCardIdx((i) => (i - 1 + cueCardsData.cards.length) % cueCardsData.cards.length);
    setPhase('idle');
    prepTimer.reset(60);
  }
  function startPrep() {
    setPhase('prep');
    prepTimer.start();
  }

  async function save({ transcript, audioBlob, durationSec }) {
    setSaving(true);
    await db.speakingRecordings.add({
      date: format(new Date(), 'yyyy-MM-dd'),
      part: 2,
      topic: card?.prompt ?? null,
      cueCardId: card?.id ?? null,
      transcript,
      audioBlob,
      durationSec,
      selfNotes: '',
      createdAt: new Date().toISOString(),
    });
    saveAutoBackup().catch(() => {});
    setSaving(false);
    setPhase('idle');
    prepTimer.reset(60);
  }

  return (
    <div className="space-y-3">
      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="label">Cue card</p>
          <div className="flex gap-1">
            <button onClick={prevCard} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Previous">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextCard} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Next">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={randomise} className="btn-outline text-xs ml-1">
              <Shuffle className="w-3.5 h-3.5" /> Random
            </button>
          </div>
        </div>
        <p className="text-base font-semibold leading-snug">{card.prompt}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">You should say:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-200">
          {card.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">
          {card.category} · {cardIdx + 1} of {cueCardsData.cards.length}
        </p>
      </section>

      {phase === 'idle' ? (
        <button onClick={startPrep} className="btn-primary w-full">
          <Clock className="w-4 h-4" />
          Start 1-minute prep
        </button>
      ) : phase === 'prep' ? (
        <PrepCountdown remaining={prepTimer.remaining} onSkip={() => {
          prepTimer.pause();
          setPhase('monologue');
        }} />
      ) : (
        <Recorder
          durationSec={2 * 60}
          hint="Speak for the full 2 minutes. The examiner stops you when time is up."
          saving={saving}
          onSave={save}
        />
      )}
    </div>
  );
}

function PrepCountdown({ remaining, onSkip }) {
  return (
    <div className="card p-6 text-center space-y-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Preparation time
      </p>
      <p className="text-4xl font-mono font-semibold">{formatMmSs(remaining)}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Jot down keywords. The recorder will start automatically when this hits zero.
      </p>
      <button onClick={onSkip} className="btn-outline">
        Skip prep · start recording now
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Part 3: Free-form abstract follow-up on the Part 2 theme. 4-5 min.
// ────────────────────────────────────────────────────────────────────────────
function Part3Tab() {
  const [topic, setTopic] = useState('');
  const [saving, setSaving] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);

  function loadPreset(idx) {
    setPresetIdx(idx);
    const card = cueCardsData.cards[idx];
    setTopic(card.part3Questions.join('\n'));
  }

  async function save({ transcript, audioBlob, durationSec }) {
    setSaving(true);
    await db.speakingRecordings.add({
      date: format(new Date(), 'yyyy-MM-dd'),
      part: 3,
      topic: topic.trim() || null,
      cueCardId: cueCardsData.cards[presetIdx]?.id ?? null,
      transcript,
      audioBlob,
      durationSec,
      selfNotes: '',
      createdAt: new Date().toISOString(),
    });
    saveAutoBackup().catch(() => {});
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="label">Discussion questions</p>
          <button
            onClick={() => loadPreset(Math.floor(Math.random() * cueCardsData.cards.length))}
            className="btn-outline text-xs"
          >
            <Shuffle className="w-3.5 h-3.5" /> Random theme
          </button>
        </div>
        <textarea
          className="input min-h-[120px] text-sm"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Write or paste a theme. Random theme loads the Part 3 follow-ups paired with one of the cue cards."
        />
      </section>
      <Recorder
        durationSec={4 * 60}
        hint="Real Part 3 runs 4-5 min. Discuss the abstract questions in detail."
        saving={saving}
        onSave={save}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Recent recordings list, scoped to the active tab's part number.
// ────────────────────────────────────────────────────────────────────────────
function RecentRecordings({ part }) {
  const recs = useLiveQuery(async () => {
    const all = await db.speakingRecordings.where('part').equals(part).toArray();
    return all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [part]);

  if (!recs || recs.length === 0) return null;

  async function remove(id) {
    if (!confirm('Delete this recording? Transcript will be lost.')) return;
    await db.speakingRecordings.delete(id);
    saveAutoBackup().catch(() => {});
  }

  async function setNotes(rec, notes) {
    await db.speakingRecordings.put({ ...rec, selfNotes: notes });
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold mt-4">Recent recordings</h2>
      <ul className="space-y-2">
        {recs.map((rec) => (
          <RecordingRow key={rec.id} rec={rec} onDelete={remove} onNotes={setNotes} />
        ))}
      </ul>
    </section>
  );
}

function RecordingRow({ rec, onDelete, onNotes }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(rec.selfNotes || '');
  const audioUrl = useAudioUrl(rec.audioBlob);

  function saveNotes() {
    onNotes(rec, notes);
  }

  return (
    <li className="card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 dark:text-slate-400">
            <span>
              {rec.createdAt ? format(parseISO(rec.createdAt), 'MMM d · HH:mm') : '—'}
            </span>
            {rec.durationSec ? <span>· {Math.round(rec.durationSec)}s</span> : null}
            {rec.audioBlob ? <span className="text-success">· audio</span> : <span>· transcript only</span>}
          </div>
          {rec.topic ? (
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 line-clamp-2">{rec.topic}</p>
          ) : null}
          {expanded ? (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">
              {rec.transcript || <em className="text-slate-400">No transcript captured.</em>}
            </p>
          ) : null}
          {expanded && audioUrl ? (
            <audio controls src={audioUrl} className="w-full mt-2" />
          ) : null}
          {expanded ? (
            <div className="mt-2 space-y-1">
              <p className="label">Self-notes</p>
              <textarea
                className="input min-h-[64px] text-xs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="What worked, what to fix next time."
              />
            </div>
          ) : null}
          <button
            onClick={() => setExpanded((x) => !x)}
            className="text-xs text-accent hover:underline mt-2"
          >
            {expanded ? 'Hide' : 'Show transcript'}
          </button>
        </div>
        <button
          onClick={() => onDelete(rec.id)}
          className="p-1.5 rounded-lg hover:bg-danger/10 text-slate-400 hover:text-danger shrink-0"
          aria-label="Delete recording"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

// Convert a stored Blob into an object URL, revoking it on change/unmount.
// Tolerates older rows where audioBlob may not be a real Blob (e.g. null
// after the 14-day cleanup) — returns null in that case.
function useAudioUrl(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!(blob instanceof Blob)) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
