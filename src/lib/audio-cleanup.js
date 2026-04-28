import { db } from './db.js';
import { differenceInCalendarDays, parseISO } from 'date-fns';

const RETENTION_DAYS = 14;

/**
 * Strip audio blobs from speakingRecordings older than RETENTION_DAYS while
 * keeping the row + transcript intact. Audio is the only large field in the
 * DB; transcripts remain searchable forever.
 *
 * Idempotent — rows already without audio are skipped.
 */
export async function pruneOldAudio(today = new Date()) {
  let pruned = 0;
  await db.transaction('rw', db.speakingRecordings, async () => {
    const rows = await db.speakingRecordings.toArray();
    for (const r of rows) {
      if (!r.audioBlob) continue;
      const ageDays = r.date
        ? differenceInCalendarDays(today, parseISO(r.date))
        : Infinity;
      if (ageDays > RETENTION_DAYS) {
        await db.speakingRecordings.put({ ...r, audioBlob: null });
        pruned++;
      }
    }
  });
  return pruned;
}
