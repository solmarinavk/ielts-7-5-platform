import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db.js';
import { isDueToday } from '../lib/srs.js';
import { format } from 'date-fns';

const NEW_PER_DAY_LIMIT = 15;

/**
 * Today's review queue: due cards first (by oldest nextReview), then up to
 * NEW_PER_DAY_LIMIT brand-new cards. Mastered cards are skipped.
 */
export function useVocabQueue() {
  return useLiveQuery(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const all = await db.vocabCards.toArray();
    const due = all
      .filter((c) => c.repetitions > 0 && c.nextReview && c.nextReview <= today && c.status !== 'mastered')
      .sort((a, b) => (a.nextReview || '').localeCompare(b.nextReview || ''));
    const newCards = all
      .filter((c) => !c.repetitions)
      .sort((a, b) => (a.level ?? 2) - (b.level ?? 2))
      .slice(0, NEW_PER_DAY_LIMIT);
    return [...due, ...newCards];
  }, []);
}

export function useVocabStats() {
  return useLiveQuery(async () => {
    const all = await db.vocabCards.toArray();
    const today = format(new Date(), 'yyyy-MM-dd');
    return {
      total: all.length,
      newCount: all.filter((c) => !c.repetitions).length,
      learning: all.filter((c) => c.status === 'learning').length,
      review: all.filter((c) => c.status === 'review').length,
      mastered: all.filter((c) => c.status === 'mastered').length,
      dueToday: all.filter((c) => isDueToday(c, today)).length,
    };
  }, []);
}
