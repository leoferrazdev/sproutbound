import { createDefaultProgress, getMilestones } from './game/progression.js';

const STORAGE_KEY = 'sproutbound.progress.v1';
const VALID_IDS = new Set(getMilestones().map((milestone) => milestone.id));

function validate(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.unlocked)) {
    return createDefaultProgress();
  }

  const unlocked = [...new Set(value.unlocked.filter((id) => VALID_IDS.has(id)))];
  const bestHeight = Number.isFinite(value.bestHeight) ? Math.max(0, value.bestHeight) : 0;
  return { version: 1, bestHeight, unlocked };
}

export function createSafeStorage(storageLike) {
  return {
    load() {
      try {
        if (!storageLike || typeof storageLike.getItem !== 'function') return createDefaultProgress();
        return validate(JSON.parse(storageLike.getItem(STORAGE_KEY) ?? 'null'));
      } catch {
        return createDefaultProgress();
      }
    },
    save(value) {
      try {
        if (!storageLike || typeof storageLike.setItem !== 'function') return false;
        storageLike.setItem(STORAGE_KEY, JSON.stringify(validate(value)));
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      try {
        if (!storageLike || typeof storageLike.removeItem !== 'function') return false;
        storageLike.removeItem(STORAGE_KEY);
        return true;
      } catch {
        return false;
      }
    },
  };
}
