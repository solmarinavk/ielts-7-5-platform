import { db } from './db.js';
import seed from '../data/awl-vocab.json';

/**
 * Idempotent: seeds vocabCards from awl-vocab.json the first time the
 * table is empty. Subsequent calls are no-ops, so it can run on every
 * app load without re-creating cards or duplicating user progress.
 */
export async function seedVocabIfEmpty() {
  const count = await db.vocabCards.count();
  if (count > 0) return { seeded: false, count };

  const now = new Date().toISOString();
  const rows = seed.map((entry) => ({
    word: entry.word,
    partOfSpeech: entry.partOfSpeech,
    definition: entry.definition,
    exampleIELTS: entry.exampleIELTS,
    collocations: entry.collocations || [],
    level: entry.level ?? 2,
    tags: entry.tags || [],
    easiness: 2.5,
    repetitions: 0,
    interval: 0,
    nextReview: null,
    lastReviewed: null,
    status: 'new',
    addedAt: now,
    source: 'seed',
  }));

  await db.vocabCards.bulkAdd(rows);
  return { seeded: true, count: rows.length };
}
