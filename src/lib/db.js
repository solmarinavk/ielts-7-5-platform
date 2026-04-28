import Dexie from 'dexie';

export const db = new Dexie('IELTSPlatform');

db.version(1).stores({
  settings: 'id',
  dailyPlans: 'date, dayNumber, phase, status',
  studyLogs: '++id, date, blockId, skill',
  energy: 'date',
  vocabCards: '++id, word, nextReview, status, level',
  mockTests: '++id, date, type',
  mockErrors: '++id, mockId, section, questionType',
  writingSamples: '++id, date, taskType',
  speakingRecordings: '++id, date, part',
  errorLog: '++id, createdAt, status, skill, sourceType',
  streaks: 'id',
  bandPredictions: '++id, date',
});

const TABLES = [
  'settings',
  'dailyPlans',
  'studyLogs',
  'energy',
  'vocabCards',
  'mockTests',
  'mockErrors',
  'writingSamples',
  'speakingRecordings',
  'errorLog',
  'streaks',
  'bandPredictions',
];

export const DEFAULT_SETTINGS = {
  id: 1,
  name: 'Sol',
  examDate: null,
  targetBand: 7.5,
  sectionTargets: { listening: 7.5, reading: 7.5, writing: 7.0, speaking: 7.5 },
  baselineBand: 6.75,
  theme: 'system',
  reminders: false,
  createdAt: null,
};

export async function getSettings() {
  const existing = await db.settings.get(1);
  if (existing) return { ...DEFAULT_SETTINGS, ...existing };
  const seeded = { ...DEFAULT_SETTINGS, createdAt: new Date().toISOString() };
  await db.settings.put(seeded);
  return seeded;
}

export async function updateSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db.settings.put(next);
  // Best-effort: keep an auto-backup fresh after any settings write.
  saveAutoBackup().catch(() => {});
  return next;
}

export async function getStreak() {
  const existing = await db.streaks.get(1);
  if (existing) return existing;
  const seeded = { id: 1, current: 0, best: 0, lastActiveDate: null, restDays: 0 };
  await db.streaks.put(seeded);
  return seeded;
}

export async function clearAllData() {
  await Promise.all(TABLES.map((t) => db[t].clear()));
}

/**
 * Wipe only the dailyPlans table. Vocab, mocks, errors, writing, speaking,
 * settings and streak all stay intact. Useful when the plan template
 * changes shape and we want a clean re-generate without losing progress.
 */
export async function resetPlanOnly() {
  await db.dailyPlans.clear();
}

// ────────────────────────────────────────────────────────────────────────────
// Backup / restore
// ────────────────────────────────────────────────────────────────────────────

const BACKUP_SCHEMA_VERSION = 1;
const BACKUP_KEY = 'ielts.lastBackup';
const BACKUP_TIMESTAMP_KEY = 'ielts.lastBackupAt';
// localStorage typical hard cap is ~5 MB per origin; bail well below it.
const BACKUP_MAX_BYTES = 4_500_000;

/**
 * Read every table, return a self-contained payload that can be re-imported
 * by `importBackup`. Audio blobs are excluded by default — they tend to be
 * large and we keep the transcript anyway.
 */
export async function exportAllData({ includeAudio = false } = {}) {
  const rows = await Promise.all(TABLES.map((t) => db[t].toArray()));
  const data = Object.fromEntries(TABLES.map((t, i) => [t, rows[i]]));

  if (!includeAudio && Array.isArray(data.speakingRecordings)) {
    data.speakingRecordings = data.speakingRecordings.map((r) => ({
      ...r,
      audioBlob: null,
    }));
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tables: TABLES,
    data,
  };
}

/**
 * Replace every table with the contents of a previously-exported payload.
 * Validates schema version and table presence; aborts atomically on failure.
 */
export async function importBackup(payload) {
  if (!payload || typeof payload !== 'object' || !payload.data) {
    throw new Error('Invalid backup file: missing data root.');
  }
  if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported backup schema (got v${payload.schemaVersion}, expected v${BACKUP_SCHEMA_VERSION}).`,
    );
  }
  await db.transaction('rw', TABLES.map((t) => db[t]), async () => {
    for (const t of TABLES) {
      await db[t].clear();
      const rows = payload.data[t];
      if (Array.isArray(rows) && rows.length) {
        await db[t].bulkAdd(rows);
      }
    }
  });
}

/**
 * Persist a fresh export into localStorage so a render-time crash is
 * recoverable without going through the network. Failures (storage full,
 * private mode, etc.) are swallowed — auto-backup is best-effort.
 */
export async function saveAutoBackup() {
  try {
    const payload = await exportAllData({ includeAudio: false });
    const json = JSON.stringify(payload);
    if (json.length > BACKUP_MAX_BYTES) {
      // Don't truncate or partial-save — a partial backup is worse than none.
      // eslint-disable-next-line no-console
      console.warn(
        `Auto-backup skipped: ${(json.length / 1_000_000).toFixed(2)} MB exceeds local cap.`,
      );
      return null;
    }
    localStorage.setItem(BACKUP_KEY, json);
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, payload.exportedAt);
    return payload.exportedAt;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Auto-backup failed:', err);
    return null;
  }
}

export function getAutoBackupTimestamp() {
  try {
    return localStorage.getItem(BACKUP_TIMESTAMP_KEY);
  } catch {
    return null;
  }
}

export function getAutoBackup() {
  try {
    const json = localStorage.getItem(BACKUP_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}
