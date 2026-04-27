import { useEffect, useState } from 'react';
import { db } from '../lib/db.js';
import { todayKey } from '../lib/plan-generator.js';
import { cn } from '../lib/cn.js';

const LEVELS = [
  { value: 1, emoji: '😩', label: 'Agotada' },
  { value: 2, emoji: '😕', label: 'Baja' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '🙂', label: 'Buena' },
  { value: 5, emoji: '🔥', label: 'Pico' },
];

export default function EnergyMeter() {
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    db.energy.get(todayKey()).then((row) => {
      if (!active) return;
      setToday(row || null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function pick(level) {
    const row = { date: todayKey(), level, notes: today?.notes ?? '' };
    await db.energy.put(row);
    setToday(row);
  }

  if (loading) return null;

  const lowEnergyHint = today?.level && today.level <= 2;

  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-semibold">Energy check</h2>
        {today ? <span className="label">Registrado hoy</span> : <span className="label">¿Cómo te sentís?</span>}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            onClick={() => pick(l.value)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 rounded-xl border text-xs transition active:scale-[0.97]',
              today?.level === l.value
                ? 'border-accent bg-accent/10 text-slate-900 dark:text-slate-100'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
            )}
            aria-label={l.label}
          >
            <span className="text-xl leading-none">{l.emoji}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{l.value}</span>
          </button>
        ))}
      </div>
      {lowEnergyHint ? (
        <p className="mt-3 text-xs text-warning">
          Energía baja. Sustituí los bloques heavy por revisión de vocab y un Speaking Part 1 corto.
        </p>
      ) : null}
    </section>
  );
}
