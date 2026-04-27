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
  if (existing) return existing;
  const seeded = { ...DEFAULT_SETTINGS, createdAt: new Date().toISOString() };
  await db.settings.put(seeded);
  return seeded;
}

export async function updateSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db.settings.put(next);
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
  await Promise.all([
    db.settings.clear(),
    db.dailyPlans.clear(),
    db.studyLogs.clear(),
    db.energy.clear(),
    db.vocabCards.clear(),
    db.mockTests.clear(),
    db.mockErrors.clear(),
    db.writingSamples.clear(),
    db.speakingRecordings.clear(),
    db.errorLog.clear(),
    db.streaks.clear(),
    db.bandPredictions.clear(),
  ]);
}
