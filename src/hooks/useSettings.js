import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings, DEFAULT_SETTINGS } from '../lib/db.js';

/**
 * Returns the settings row with DEFAULT_SETTINGS merged in. This means a
 * consumer can always read `settings.sectionTargets.listening` without
 * worrying about the field being absent on an older row from a previous
 * schema. Returns undefined while still loading from IndexedDB.
 */
export function useSettings() {
  return useLiveQuery(async () => {
    const row = await db.settings.get(1);
    if (!row) return undefined;
    return {
      ...DEFAULT_SETTINGS,
      ...row,
      // Nested objects also need a defensive merge so the UI never has to
      // bail out on a partial row.
      sectionTargets: { ...DEFAULT_SETTINGS.sectionTargets, ...(row.sectionTargets || {}) },
    };
  });
}

export async function ensureSettings() {
  return getSettings();
}
