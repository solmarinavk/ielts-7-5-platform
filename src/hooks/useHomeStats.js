import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../lib/db.js';
import { isDueToday } from '../lib/srs.js';

/**
 * Aggregates the three counts shown in Home QuickStats and the next mock day.
 * Returns null while data is loading.
 */
export function useHomeStats() {
  return useLiveQuery(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [vocab, errors, plans] = await Promise.all([
      db.vocabCards.toArray(),
      db.errorLog.toArray(),
      db.dailyPlans.toArray(),
    ]);

    const vocabDue = vocab.filter((c) => isDueToday(c, today)).length;
    const openErrors = errors.filter((e) => e.status === 'open').length;

    const nextMock = plans
      .filter((p) => p.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .find((p) => p.blocks?.some((b) => b.skill === 'mock' || b.skill === 'diagnostic'));

    return {
      vocabDue,
      openErrors,
      nextMock: nextMock
        ? { date: nextMock.date, dayNumber: nextMock.dayNumber }
        : null,
    };
  }, []);
}

/**
 * Up to 3 open errors prioritised for today's recycling widget. Strategy:
 * pick errors with the lowest reviewCount, breaking ties by oldest createdAt.
 * That keeps fresh-but-fading errors at the top while bringing in older ones
 * gradually after a few reviews.
 */
export function useRecycledErrors(limit = 3) {
  return useLiveQuery(async () => {
    const all = await db.errorLog.where('status').equals('open').toArray();
    return all
      .slice()
      .sort((a, b) => {
        const reviewDiff = (a.reviewCount ?? 0) - (b.reviewCount ?? 0);
        if (reviewDiff !== 0) return reviewDiff;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      })
      .slice(0, limit);
  }, [limit]);
}
