import { addDays, format, parseISO, differenceInCalendarDays } from 'date-fns';
import { db } from './db.js';
import template from '../data/plan-template.json';

const STANDARD_TOTAL_DAYS = 45;

// Standard 45-day plan: phase ranges follow the template (1-4 / 5-20 / 21-35 /
// 36-42 / 43-45). Mock days fall on positions 21,23,25,28,30,32,35 + 37,41 in
// the refinement phase.
const STANDARD_MOCK_DAY_NUMBERS = new Set([21, 23, 25, 28, 30, 32, 35]);
const STANDARD_REFINE_MOCK_DAYS = new Set([37, 41]);

// ────────────────────────────────────────────────────────────────────────────
// Plan-shape derivation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Decide how a plan should be shaped given today and the exam date.
 *
 * - mode='standard'   : (exam − today) ≥ 45. Plan length 45, day 1 = exam − 45,
 *                       so any extra slack lives BEFORE day 1 ("buffer").
 * - mode='compressed' : 14 ≤ (exam − today) < 45. Plan length = window,
 *                       day 1 = today, phases scaled proportionally.
 * - mode='minimal'    : (exam − today) < 14. Mock-intensive + Taper only.
 *                       Settings shows an "Insufficient prep window" warning.
 * - mode='past'       : (exam − today) ≤ 0. Returns no plan rows.
 */
export function derivePlanShape(examDate, today = new Date()) {
  if (!examDate) return null;
  const examIso = typeof examDate === 'string' ? examDate : format(examDate, 'yyyy-MM-dd');
  const days = differenceInCalendarDays(parseISO(examIso), today);

  if (days <= 0) {
    return { mode: 'past', daysAvailable: days, N: 0, startDate: null, ranges: [] };
  }

  if (days >= STANDARD_TOTAL_DAYS) {
    const startDate = addDays(parseISO(examIso), -STANDARD_TOTAL_DAYS);
    return {
      mode: 'standard',
      daysAvailable: days,
      N: STANDARD_TOTAL_DAYS,
      startDate: format(startDate, 'yyyy-MM-dd'),
      ranges: standardRanges(),
    };
  }

  if (days < 14) {
    return {
      mode: 'minimal',
      daysAvailable: days,
      N: days,
      startDate: format(today, 'yyyy-MM-dd'),
      ranges: minimalRanges(days),
    };
  }

  // compressed
  return {
    mode: 'compressed',
    daysAvailable: days,
    N: days,
    startDate: format(today, 'yyyy-MM-dd'),
    ranges: compressedRanges(days),
  };
}

function standardRanges() {
  return template.phases.map((p) => ({
    id: p.id,
    label: p.label,
    color: p.color,
    range: [p.range[0], p.range[1]],
  }));
}

/**
 * Proportional split for plans of 14-44 days.
 *   diagnostic = max(2, round(N * 0.10))
 *   build      = round(N * 0.35)
 *   mocks      = round(N * 0.30)
 *   refine     = round(N * 0.15)
 *   taper      = max(2, N − sum_of_above)
 * If rounding overshoots N, the surplus is absorbed by Build (largest phase)
 * to keep Diagnostic and Taper at their minima.
 */
export function compressedRanges(N) {
  let d = Math.max(2, Math.round(N * 0.10));
  let b = Math.round(N * 0.35);
  let m = Math.round(N * 0.30);
  let r = Math.round(N * 0.15);
  let t = Math.max(2, N - (d + b + m + r));
  let total = d + b + m + r + t;
  if (total !== N) {
    b += N - total;
    if (b < 1) {
      // Edge case for very tight plans (e.g. N=14): if pulling from build
      // would zero it out, pull from mocks instead so build keeps at least
      // one block.
      const deficit = 1 - b;
      b = 1;
      m = Math.max(1, m - deficit);
    }
  }
  return rangesFromCounts({ diagnostic: d, build: b, mocks: m, refine: r, taper: t });
}

/**
 * Minimal plan for windows < 14 days. We drop everything except a focused
 * mock-intensive block followed by 2 days of taper. If only 1-2 days are
 * left, the entire window collapses into taper.
 */
export function minimalRanges(N) {
  if (N <= 0) return [];
  if (N <= 2) {
    return rangesFromCounts({ diagnostic: 0, build: 0, mocks: 0, refine: 0, taper: N });
  }
  const t = 2;
  const m = Math.max(1, N - t);
  return rangesFromCounts({ diagnostic: 0, build: 0, mocks: m, refine: 0, taper: t });
}

function rangesFromCounts(counts) {
  const order = ['diagnostic', 'build', 'mocks', 'refine', 'taper'];
  const labels = Object.fromEntries(template.phases.map((p) => [p.id, p]));
  const out = [];
  let cursor = 1;
  for (const id of order) {
    const n = counts[id] ?? 0;
    if (n <= 0) continue;
    out.push({
      id,
      label: labels[id].label,
      color: labels[id].color,
      range: [cursor, cursor + n - 1],
    });
    cursor += n;
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Day building
// ────────────────────────────────────────────────────────────────────────────

function getPhaseForDay(dayNumber, ranges) {
  for (const phase of ranges) {
    const [from, to] = phase.range;
    if (dayNumber >= from && dayNumber <= to) return phase;
  }
  return ranges[0] ?? null;
}

function rotateSkillForDay(dayNumber) {
  const skills = ['listening', 'reading', 'writing', 'speaking'];
  return skills[(dayNumber - 1) % skills.length];
}

function cloneBlocks(blocks) {
  return blocks.map((b, idx) => ({ ...b, id: `b-${idx}`, done: false }));
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Map a position within the diagnostic phase to one of the four explicit
 * day templates (full mock → format familiarisation → templates &
 * technique → receptive mini-mock). Compressed plans drop the middle
 * days first.
 */
function pickDiagnosticTemplateKey(positionInPhase, phaseLength) {
  // Priority order: 1 (full diagnostic mock) > 4 (receptive mini-mock) > 2 > 3
  const templatesByLength = {
    1: ['1'],
    2: ['1', '4'],
    3: ['1', '2', '4'],
    4: ['1', '2', '3', '4'],
  };
  const list = templatesByLength[Math.min(phaseLength, 4)] || templatesByLength[4];
  return list[Math.min(positionInPhase, list.length - 1)];
}

/**
 * Map a position within the taper phase to one of the three explicit
 * end-game day templates. Last day = "45" (rest), second-to-last = "44"
 * (light review), third-to-last = "43" (light mock). Anything earlier in
 * a longer taper falls back to the light review template.
 */
function pickTaperTemplateKey(positionInPhase, phaseLength) {
  const daysFromEnd = phaseLength - 1 - positionInPhase;
  if (daysFromEnd === 0) return '45';
  if (daysFromEnd === 1) return '44';
  if (daysFromEnd === 2) return '43';
  return '44'; // Extra-long taper: extra light-review days at the front.
}

/**
 * Mock-day pattern for the "mocks" phase. We fire mock days at roughly
 * 1/3, 1/2, and 2/3 of the way through the phase, plus the first day if
 * the phase is long enough. Any phase length ≥ 2 gets at least one mock.
 */
function isMockDayInPhase(positionInPhase, phaseLength) {
  if (phaseLength <= 1) return positionInPhase === 0;
  // Pre-compute mock positions deterministically — they are stable across
  // re-renders so plan editing keeps the same mock-day rhythm.
  const fractions = [0.0, 0.2, 0.4, 0.55, 0.7, 0.85];
  const positions = new Set(
    fractions.map((f) => Math.round(f * (phaseLength - 1))),
  );
  // Cap mocks at one every 2 days so the user gets recovery time.
  const ordered = Array.from(positions).sort((a, b) => a - b);
  const filtered = [];
  let last = -2;
  for (const p of ordered) {
    if (p - last >= 2) {
      filtered.push(p);
      last = p;
    }
  }
  return filtered.includes(positionInPhase);
}

/**
 * Mock-day pattern for the refinement phase. Standard plans hit days 37
 * and 41; for compressed plans we pick the first day and the day at ~70%
 * of the phase, ensuring at least one buffer day before the taper.
 */
function isRefineMockDay(positionInPhase, phaseLength) {
  if (phaseLength <= 0) return false;
  if (phaseLength <= 2) return positionInPhase === 0;
  const second = Math.max(1, Math.round(phaseLength * 0.7) - 1);
  return positionInPhase === 0 || positionInPhase === second;
}

function buildBlocksForDay({ dayNumber, phase, positionInPhase, phaseLength, mode }) {
  // Standard plan keeps the original explicit-day templates (1-4, 43-45).
  if (mode === 'standard') {
    const explicit = template.days[String(dayNumber)];
    if (explicit) return { title: explicit.title, blocks: cloneBlocks(explicit.blocks) };
  }

  if (phase.id === 'diagnostic') {
    const key = pickDiagnosticTemplateKey(positionInPhase, phaseLength);
    const tpl = template.days[key];
    return { title: tpl.title, blocks: cloneBlocks(tpl.blocks) };
  }

  if (phase.id === 'taper') {
    const key = pickTaperTemplateKey(positionInPhase, phaseLength);
    const tpl = template.days[key];
    return { title: tpl.title, blocks: cloneBlocks(tpl.blocks) };
  }

  if (phase.id === 'build') {
    const primarySkill = rotateSkillForDay(dayNumber);
    const tpl = template.days.default_build;
    const blocks = cloneBlocks(tpl.blocks).map((b) =>
      b.skill === 'primary'
        ? { ...b, skill: primarySkill, label: `${capitalize(primarySkill)}: technique + 1 practised set` }
        : b,
    );
    return { title: `Build · ${capitalize(primarySkill)} focus`, blocks };
  }

  if (phase.id === 'mocks') {
    const isMockDay =
      mode === 'standard'
        ? STANDARD_MOCK_DAY_NUMBERS.has(dayNumber)
        : isMockDayInPhase(positionInPhase, phaseLength);
    const tpl = isMockDay
      ? template.days.default_mocks_mockDay
      : template.days.default_mocks_recoveryDay;
    const primarySkill = rotateSkillForDay(dayNumber);
    const blocks = cloneBlocks(tpl.blocks).map((b) =>
      b.skill === 'primary'
        ? { ...b, skill: primarySkill, label: `Focused practice: ${capitalize(primarySkill)}` }
        : b,
    );
    return {
      title: isMockDay ? 'Full mock' : `Recovery · ${capitalize(primarySkill)} focus`,
      blocks,
    };
  }

  if (phase.id === 'refine') {
    const blocks = cloneBlocks(template.days.default_refine.blocks);
    const isRefineMock =
      mode === 'standard'
        ? STANDARD_REFINE_MOCK_DAYS.has(dayNumber)
        : isRefineMockDay(positionInPhase, phaseLength);
    if (isRefineMock) {
      blocks.unshift({
        id: 'b-mock',
        skill: 'mock',
        label: 'Full refinement mock',
        minutes: 170,
        intensity: 'heavy',
        done: false,
      });
    }
    return { title: isRefineMock ? 'Refinement + mock' : 'Refinement', blocks };
  }

  return { title: phase.label, blocks: [] };
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build the plan rows in memory based on the exam date. Does NOT persist.
 * Returns [] when there is no usable window (no exam date, or it is in the
 * past).
 */
export function buildPlan(examDate, today = new Date()) {
  const shape = derivePlanShape(examDate, today);
  if (!shape || shape.mode === 'past' || shape.N === 0) return [];

  const startDate = parseISO(shape.startDate);
  const rows = [];
  for (let i = 0; i < shape.N; i++) {
    const dayNumber = i + 1;
    const date = format(addDays(startDate, i), 'yyyy-MM-dd');
    const phase = getPhaseForDay(dayNumber, shape.ranges);
    const phaseStart = phase.range[0];
    const phaseLength = phase.range[1] - phase.range[0] + 1;
    const positionInPhase = dayNumber - phaseStart;

    const { title, blocks } = buildBlocksForDay({
      dayNumber,
      phase,
      positionInPhase,
      phaseLength,
      mode: shape.mode,
    });

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
      planMode: shape.mode,
    });
  }
  return rows;
}

/**
 * Persist plan into Dexie. Existing rows are merged on `date` so any per-day
 * completion state the user already has is preserved when regenerating.
 */
export async function generateAndPersistPlan(examDate) {
  const rows = buildPlan(examDate);
  if (!rows.length) {
    await db.dailyPlans.clear();
    return [];
  }
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
