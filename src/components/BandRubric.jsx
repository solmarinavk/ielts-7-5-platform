import { useMemo } from 'react';
import descriptors from '../data/band-descriptors.json';
import { cn } from '../lib/cn.js';

const CRITERIA = [
  { id: 'TR', label: 'Task Response', short: 'TR' },
  { id: 'CC', label: 'Coherence & Cohesion', short: 'CC' },
  { id: 'LR', label: 'Lexical Resource', short: 'LR' },
  { id: 'GRA', label: 'Grammar Range & Accuracy', short: 'GRA' },
];

const VALID_BANDS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
const STEPS = VALID_BANDS.length - 1; // slider step count
const MIN = 5;
const MAX = 9;

/**
 * IELTS rounds the average of the four criteria to the nearest 0.5; .25
 * rounds up to .5 and .75 rounds up to the next whole. Same rule used for
 * the overall mock band.
 */
function roundOverall(avg) {
  if (avg === null || isNaN(avg)) return null;
  const floor = Math.floor(avg);
  const frac = avg - floor;
  if (frac < 0.25) return floor;
  if (frac < 0.75) return floor + 0.5;
  return floor + 1;
}

/**
 * Pick the descriptor band whose key is the floor-of-band, since the public
 * IELTS rubric is published per whole band (5, 6, 7, 8, 9). A self-assessed
 * 6.5 reads against the band-6 descriptor on the way up to 7.
 */
function descriptorBand(value) {
  return Math.floor(value);
}

export default function BandRubric({ taskType = 'T2', value, onChange }) {
  const taskKey = taskType === 'T1' ? 'task1' : 'task2';
  const overall = useMemo(() => {
    const vals = CRITERIA.map((c) => value?.[c.id]).filter((v) => typeof v === 'number');
    if (!vals.length) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return roundOverall(avg);
  }, [value]);

  function set(crit, v) {
    onChange?.({ ...(value || {}), [crit]: Number(v), overall: null });
  }

  return (
    <section className="card p-4 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Self-assessment</h2>
        <span className="text-xs">
          <span className="text-slate-500 dark:text-slate-400 mr-1">Overall</span>
          <span className="font-mono font-semibold text-accent">
            {overall != null ? overall.toFixed(1) : '—'}
          </span>
        </span>
      </div>
      {CRITERIA.map((c) => {
        const v = value?.[c.id] ?? null;
        return (
          <CriterionRow
            key={c.id}
            criterion={c}
            value={v}
            descriptor={
              v != null ? descriptors[taskKey]?.[c.id]?.[descriptorBand(v)] : null
            }
            onChange={(nv) => set(c.id, nv)}
          />
        );
      })}
      <p className="text-[11px] text-slate-400 leading-snug">
        Descriptors paraphrase the official IELTS public band descriptors. Use them as a
        self-check; the final examiner judgement is holistic.
      </p>
    </section>
  );
}

function CriterionRow({ criterion, value, descriptor, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium" htmlFor={`rubric-${criterion.id}`}>
          {criterion.label}
        </label>
        <span className="text-sm font-mono">
          {value != null ? value.toFixed(1) : '—'}
          <span className="text-slate-400 ml-1 text-[10px]">/9</span>
        </span>
      </div>
      <input
        id={`rubric-${criterion.id}`}
        type="range"
        min={MIN}
        max={MAX}
        step={0.5}
        value={value ?? MIN}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-accent',
        )}
      />
      <div className="flex justify-between px-1 text-[10px] text-slate-400 font-mono select-none">
        {[5, 6, 7, 8, 9].map((b) => (
          <span key={b}>{b}</span>
        ))}
      </div>
      {descriptor ? (
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug pt-1 border-l-2 border-accent/40 pl-3">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Band {descriptorBand(value)}:
          </span>{' '}
          {descriptor}
        </p>
      ) : null}
    </div>
  );
}
