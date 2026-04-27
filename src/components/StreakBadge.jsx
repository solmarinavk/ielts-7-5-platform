import { Flame } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db.js';

export default function StreakBadge() {
  const streak = useLiveQuery(() => db.streaks.get(1));
  const current = streak?.current ?? 0;
  return (
    <span
      className="chip bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200"
      title={`Best streak: ${streak?.best ?? 0} days`}
    >
      <Flame className="w-3 h-3" strokeWidth={2.4} />
      {current}d
    </span>
  );
}
