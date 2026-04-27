import { addDays, format, parseISO } from 'date-fns';

/**
 * SM-2 (SuperMemo 2) spaced-repetition algorithm.
 *
 * Quality scale used in the UI:
 *   q=1 (Again)   → reset interval, see again tomorrow
 *   q=3 (Hard)    → keep cadence, small easiness penalty
 *   q=4 (Good)    → standard advance
 *   q=5 (Easy)    → standard advance, easiness bonus
 *
 * easiness floor: 1.3
 * Status transitions are derived from interval/repetitions to drive UI badges.
 */

const TODAY = () => format(new Date(), 'yyyy-MM-dd');

export const SRS_QUALITY = {
  AGAIN: 1,
  HARD: 3,
  GOOD: 4,
  EASY: 5,
};

export function reviewCard(card, quality) {
  let easiness = card.easiness ?? 2.5;
  let repetitions = card.repetitions ?? 0;
  let interval = card.interval ?? 0;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.max(1, Math.round(interval * easiness));
    repetitions += 1;
  }

  easiness = Math.max(
    1.3,
    easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  const nextReview = format(addDays(new Date(), interval), 'yyyy-MM-dd');

  return {
    ...card,
    easiness: Number(easiness.toFixed(3)),
    repetitions,
    interval,
    nextReview,
    lastReviewed: TODAY(),
    status: deriveStatus({ repetitions, interval }),
  };
}

export function deriveStatus({ repetitions, interval }) {
  if (!repetitions) return 'new';
  if (interval >= 21) return 'mastered';
  if (repetitions <= 2) return 'learning';
  return 'review';
}

export function isDueToday(card, today = TODAY()) {
  if (card.status === 'mastered') return false;
  if (!card.repetitions) return true; // new cards are always available
  if (!card.nextReview) return true;
  return card.nextReview <= today;
}

export function daysUntilDue(card, today = TODAY()) {
  if (!card.nextReview) return 0;
  const diffMs = parseISO(card.nextReview).getTime() - parseISO(today).getTime();
  return Math.round(diffMs / 86400000);
}
