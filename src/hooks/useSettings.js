import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../lib/db.js';

export function useSettings() {
  // useLiveQuery returns undefined while loading; we expose that explicitly.
  return useLiveQuery(() => db.settings.get(1));
}

export async function ensureSettings() {
  return getSettings();
}
