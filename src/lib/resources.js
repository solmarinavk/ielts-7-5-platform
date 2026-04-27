import data from '../data/resources.json';
import { parseISO, getDayOfYear } from 'date-fns';

export const RESOURCE_CATEGORIES = data.categories;
export const RESOURCES = data.items;

export function getResource(id) {
  return RESOURCES.find((r) => r.id === id) ?? null;
}

export function getByCategory(categoryId) {
  return RESOURCES
    .filter((r) => r.category === categoryId)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Map a plan block to one of our internal "block-types" used for resource picks.
 * The brief asks specifically for: mock, writing_practice, listening_passive.
 */
export function classifyBlock(block) {
  if (!block) return null;
  const skill = block.skill;
  const intensity = block.intensity;
  if (skill === 'mock' || skill === 'diagnostic') return 'mock';
  if (skill === 'writing') return 'writing_practice';
  if (skill === 'listening' && intensity === 'light') return 'listening_passive';
  return null;
}

const BLOCK_TYPE_TO_CATEGORY = {
  mock: 'mocks_official',
  writing_practice: 'writing_feedback',
  listening_passive: 'listening_uk',
};

/**
 * For a given plan block, return the recommended resource (highest priority)
 * within the category aligned to the block's nature, or null if no match.
 */
export function getResourceForBlock(block) {
  const blockType = classifyBlock(block);
  if (!blockType) return null;
  const category = BLOCK_TYPE_TO_CATEGORY[blockType];
  const candidates = getByCategory(category);
  return candidates[0] ?? null;
}

/**
 * Pick a "Resource of the day" deterministically based on phase + date,
 * so it stays stable within a day but rotates across days.
 */
export function getResourceOfDay(phase, dateIso) {
  const phaseFiltered = RESOURCES.filter(
    (r) => Array.isArray(r.phaseHint) && (!phase || r.phaseHint.includes(phase)),
  );
  const pool = phaseFiltered.length ? phaseFiltered : RESOURCES;
  const idx = dateIso ? getDayOfYear(parseISO(dateIso)) % pool.length : 0;
  return pool[idx];
}
