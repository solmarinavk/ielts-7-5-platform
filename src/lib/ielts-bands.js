// IELTS-specific helpers (sections, question types, band rounding).

export const SECTIONS = ['listening', 'reading', 'writing', 'speaking'];

export const SECTION_LABEL = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

export const BAND_OPTIONS = [
  4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0,
];

/**
 * IELTS rounds the average of the four sub-scores to the nearest 0.5.
 * 0.25 rounds up to 0.5, 0.75 rounds up to the next whole number.
 * (Matches the official rounding rule.)
 */
export function roundOverall(avg) {
  if (avg === null || isNaN(avg)) return null;
  const x = Number(avg);
  const floor = Math.floor(x);
  const frac = x - floor;
  if (frac < 0.25) return floor;
  if (frac < 0.75) return floor + 0.5;
  return floor + 1;
}

export function computeOverall(scores) {
  const vals = SECTIONS.map((s) => scores?.[s]?.band).filter((v) => typeof v === 'number');
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return roundOverall(avg);
}

export const QUESTION_TYPES = {
  listening: [
    'Form completion',
    'Multiple choice',
    'Matching',
    'Plan/map/diagram',
    'Note completion',
    'Sentence completion',
    'Short-answer',
  ],
  reading: [
    'Matching headings',
    'Matching information',
    'Matching features',
    'True / False / Not Given',
    'Yes / No / Not Given',
    'Multiple choice',
    'Sentence completion',
    'Summary completion',
    'Diagram label',
    'Short-answer',
  ],
  writing: [
    'Task 1 · Task achievement',
    'Task 1 · Coherence & cohesion',
    'Task 1 · Lexical resource',
    'Task 1 · Grammar range & accuracy',
    'Task 2 · Task response',
    'Task 2 · Coherence & cohesion',
    'Task 2 · Lexical resource',
    'Task 2 · Grammar range & accuracy',
  ],
  speaking: [
    'Part 1 · Fluency',
    'Part 1 · Lexis',
    'Part 2 · Fluency',
    'Part 2 · Lexis',
    'Part 2 · Coherence',
    'Part 3 · Fluency',
    'Part 3 · Lexis',
    'Part 3 · Coherence',
  ],
};
