import { addDays, format, parseISO, differenceInCalendarDays } from 'date-fns';
import { db } from './db.js';
import template from '../data/plan-template.json';

const TOTAL_DAYS = 45;

// Mock days (within "mocks" phase, days 21-35) hit on Mon/Wed/Fri of each block.
// Concretely: day numbers 21, 23, 25, 28, 30, 32, 35 are mocks.
const MOCK_DAY_NUMBERS = new Set([21, 23, 25, 28, 30, 32, 35]);

// Refine phase mocks (2 mocks across days 36-42).
const REFINE_MOCK_DAYS = new Set([37, 41]);

export function getPhaseForDay(dayNumber) {
  for (const phase of template.phases) {
    const [from, to] = phase.range;
    if (dayNumber >= from && dayNumber <= to) return phase;
  }
  return template.phases[0];
}

function rotateSkillForDay(dayNumber) {
  const skills = ['listening', 'reading', 'writing', 'speaking'];
  return skills[(dayNumber - 5) % skills.length];
}

function buildBlocksForDay(dayNumber) {
  const explicit = template.days[String(dayNumber)];
  if (explicit) {
    return { title: explicit.title, blocks: cloneBlocks(explicit.blocks) };
  }
  const phase = getPhaseForDay(dayNumber);

  if (phase.id === 'build') {
    const primarySkill = rotateSkillForDay(dayNumber);
    const tpl = template.days.default_build;
    const blocks = cloneBlocks(tpl.blocks).map((b) =>
      b.skill === 'primary' ? { ...b, skill: primarySkill, label: `${capitalize(primarySkill)}: technique + 1 practised set` } : b,
    );
    return { title: `Build · ${capitalize(primarySkill)} focus`, blocks };
  }

  if (phase.id === 'mocks') {
    const isMockDay = MOCK_DAY_NUMBERS.has(dayNumber);
    const tpl = isMockDay ? template.days.default_mocks_mockDay : template.days.default_mocks_recoveryDay;
    const primarySkill = rotateSkillForDay(dayNumber);
    const blocks = cloneBlocks(tpl.blocks).map((b) =>
      b.skill === 'primary' ? { ...b, skill: primarySkill, label: `Focused practice: ${capitalize(primarySkill)}` } : b,
    );
    return { title: isMockDay ? 'Full mock' : `Recovery · ${capitalize(primarySkill)} focus`, blocks };
  }

  if (phase.id === 'refine') {
    const blocks = cloneBlocks(template.days.default_refine.blocks);
    if (REFINE_MOCK_DAYS.has(dayNumber)) {
      blocks.unshift({ skill: 'mock', label: 'Full refinement mock', minutes: 170, intensity: 'heavy' });
    }
    return { title: REFINE_MOCK_DAYS.has(dayNumber) ? 'Refinement + mock' : 'Refinement', blocks };
  }

  // Diagnostic and taper days are all explicit; this is a fallback.
  return { title: phase.label, blocks: [] };
}

function cloneBlocks(blocks) {
  return blocks.map((b, idx) => ({ ...b, id: `b-${idx}`, done: false }));
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Generate the 45-day plan ending on examDate.
 * Returns the plan rows; does NOT persist by itself.
 */
export function buildPlan(examDate) {
  if (!examDate) return [];
  const exam = typeof examDate === 'string' ? parseISO(examDate) : examDate;
  // Day 45 = day before exam. Day 1 = exam - 45 days.
  const startDay = addDays(exam, -TOTAL_DAYS);

  const rows = [];
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const dayNumber = i + 1;
    const date = format(addDays(startDay, i), 'yyyy-MM-dd');
    const phase = getPhaseForDay(dayNumber);
    const { title, blocks } = buildBlocksForDay(dayNumber);
    const blocksWithIds = blocks.map((b, idx) => ({
      ...b,
      id: b.id ?? `d${dayNumber}-b${idx}`,
      done: false,
    }));
    const totalMinutes = blocksWithIds.reduce((acc, b) => acc + (b.minutes || 0), 0);
    rows.push({
      date,
      dayNumber,
      phase: phase.id,
      phaseLabel: phase.label,
      phaseColor: phase.color,
      title,
      blocks: blocksWithIds,
      totalMinutes,
      status: 'pending',
    });
  }
  return rows;
}

/**
 * Persist plan into Dexie. Existing rows are merged on `date` so that any
 * per-day completion state the user already has is preserved when regenerating.
 */
export async function generateAndPersistPlan(examDate) {
  const rows = buildPlan(examDate);
  if (!rows.length) return [];
  const existingByDate = new Map(
    (await db.dailyPlans.toArray()).map((row) => [row.date, row]),
  );
  const merged = rows.map((row) => {
    const prior = existingByDate.get(row.date);
    if (!prior) return row;
    // Preserve completion state but accept template-level changes otherwise.
    const blocks = row.blocks.map((b, idx) => ({
      ...b,
      done: prior.blocks?.[idx]?.done ?? false,
    }));
    return { ...row, blocks, status: prior.status ?? 'pending' };
  });
  await db.transaction('rw', db.dailyPlans, async () => {
    await db.dailyPlans.clear();
    await db.dailyPlans.bulkPut(merged);
  });
  return merged;
}

export function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function daysUntil(dateIso) {
  if (!dateIso) return null;
  return differenceInCalendarDays(parseISO(dateIso), new Date());
}
