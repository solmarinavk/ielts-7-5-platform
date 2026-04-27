import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db.js';
import { todayKey } from '../lib/plan-generator.js';

export function useDailyPlan(date = todayKey()) {
  return useLiveQuery(() => db.dailyPlans.get(date), [date]);
}

export function useAllPlanDays() {
  return useLiveQuery(async () => {
    const rows = await db.dailyPlans.toArray();
    rows.sort((a, b) => a.dayNumber - b.dayNumber);
    return rows;
  }, []);
}

export async function setBlockDone(date, blockId, done) {
  const row = await db.dailyPlans.get(date);
  if (!row) return;
  const blocks = row.blocks.map((b) => (b.id === blockId ? { ...b, done } : b));
  const allDone = blocks.length > 0 && blocks.every((b) => b.done);
  await db.dailyPlans.put({
    ...row,
    blocks,
    status: allDone ? 'done' : 'pending',
  });
}
