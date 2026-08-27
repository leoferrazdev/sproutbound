import { createDefaultProgress, getMilestones, migrateProgress, PROGRESS_VERSION } from './game/progression.js';
import { getRoutes } from './game/campaign.js';

const STORAGE_KEY = 'sproutbound.progress.v2';
const LEGACY_KEY = 'sproutbound.progress.v1';
const VALID_IDS = new Set(getMilestones().map((milestone) => milestone.id));
const VALID_ROUTES = new Set(getRoutes().map((route) => route.id));

function validate(value) {
  const migrated = value && value.version !== PROGRESS_VERSION ? migrateProgress(value) : value;
  if (!migrated || migrated.version !== PROGRESS_VERSION || !Array.isArray(migrated.unlocked)) {
    return createDefaultProgress();
  }

  const unlocked = [...new Set(migrated.unlocked.filter((id) => VALID_IDS.has(id)))];
  const bestHeight = Number.isFinite(migrated.bestHeight) ? Math.max(0, migrated.bestHeight) : 0;

  const routes = {};
  for (const [id, entry] of Object.entries(migrated.routes ?? {})) {
    if (!VALID_ROUTES.has(id) || !entry) continue;
    routes[id] = {
      cleared: Boolean(entry.cleared),
      objectiveMet: Boolean(entry.objectiveMet),
      bestSeconds: Number.isFinite(entry.bestSeconds) && entry.bestSeconds > 0 ? entry.bestSeconds : null,
      bestDrops: Number.isFinite(entry.bestDrops) ? Math.max(0, Math.trunc(entry.bestDrops)) : 0,
    };
  }

  const currentRoute = VALID_ROUTES.has(migrated.currentRoute)
    ? migrated.currentRoute
    : createDefaultProgress().currentRoute;

  return { version: PROGRESS_VERSION, bestHeight, unlocked, routes, currentRoute };
}

export function createSafeStorage(storageLike) {
  return {
    load() {
      try {
        if (!storageLike || typeof storageLike.getItem !== 'function') return createDefaultProgress();
        const raw = storageLike.getItem(STORAGE_KEY);
        if (raw) return validate(JSON.parse(raw));
        // Jogador que já tinha progresso na versão anterior não recomeça do zero.
        const legacy = storageLike.getItem(LEGACY_KEY);
        return validate(legacy ? JSON.parse(legacy) : null);
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
