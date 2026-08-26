import { getRoutes, getRoute, getFirstRoute } from './campaign.js';

// Os marcos cosméticos passam a ser ligados a ROTAS CONCLUÍDAS, não a metros.
// Antes disparavam em 10 m, 25 m, 60 m e 240 m, ou seja, três dos quatro nos
// primeiros 4,6 segundos de jogo. Agora se espalham pela campanha inteira.
const MILESTONES = [
  { id: 'bud', routesCleared: 1, label: 'Two-leaf sprout', accent: '#b9f46b' },
  { id: 'bloom', routesCleared: 5, label: 'Blooming Pip', accent: '#ff9ac2' },
  { id: 'sun-cape', routesCleared: 12, label: 'Solar cape', accent: '#ffd166' },
  { id: 'summit-crown', routesCleared: 25, label: 'Summit Crown', accent: '#b9f46b' },
];

const BASE_VISUAL_TIER = {
  id: 'seed',
  label: 'Fresh Pip',
  accent: '#86e6a8',
};

export const PROGRESS_VERSION = 2;

export function createDefaultProgress() {
  return {
    version: PROGRESS_VERSION,
    bestHeight: 0,
    unlocked: [],
    routes: {},
    currentRoute: getFirstRoute().id,
  };
}

function isCurrent(progress) {
  return Boolean(progress) && progress.version === PROGRESS_VERSION;
}

// Jogador antigo não perde nada: o recorde de altura vira conclusão da primeira
// rota, o suficiente para ele não recomeçar numa tela vazia.
export function migrateProgress(value) {
  if (isCurrent(value)) return value;
  const base = createDefaultProgress();
  if (!value || value.version !== 1) return base;

  const bestHeight = Number.isFinite(value.bestHeight) ? Math.max(0, value.bestHeight) : 0;
  const routes = {};
  if (bestHeight > 0) {
    const first = getFirstRoute();
    routes[first.id] = { cleared: bestHeight >= first.height, objectiveMet: false, bestSeconds: null, bestDrops: 0 };
  }
  return { ...base, bestHeight, routes };
}

export function countRoutesCleared(progress) {
  const safe = isCurrent(progress) ? progress : createDefaultProgress();
  return Object.values(safe.routes ?? {}).filter((entry) => entry?.cleared).length;
}

export function isRouteUnlocked(progress, route) {
  if (!route) return false;
  if (route.order === 1) return true;
  const safe = isCurrent(progress) ? progress : createDefaultProgress();
  const previous = getRoutes().find((item) => item.order === route.order - 1);
  return Boolean(previous && safe.routes?.[previous.id]?.cleared);
}

export function getUnlockedRoutes(progress) {
  return getRoutes().filter((route) => isRouteUnlocked(progress, route));
}

export function getCurrentRoute(progress) {
  const safe = isCurrent(progress) ? progress : createDefaultProgress();
  const named = getRoute(safe.currentRoute);
  if (named && isRouteUnlocked(safe, named)) return named;
  const unlocked = getUnlockedRoutes(safe);
  return unlocked.at(-1) ?? getFirstRoute();
}

export function getRouteState(progress, routeId) {
  const safe = isCurrent(progress) ? progress : createDefaultProgress();
  return safe.routes?.[routeId] ?? { cleared: false, objectiveMet: false, bestSeconds: null, bestDrops: 0 };
}

// Resultado de uma rota. Alcançar o topo conclui e libera a seguinte; o objetivo
// é a camada opcional que rende a estrela, para não travar o jogador.
export function applyRouteResult(progress, result = {}) {
  const current = isCurrent(progress) ? progress : createDefaultProgress();
  const route = getRoute(result.routeId);
  if (!route) return { progress: { ...current }, unlocked: [], routeUnlocked: null };

  const previous = getRouteState(current, route.id);
  const seconds = Number.isFinite(result.seconds) ? result.seconds : null;
  const entry = {
    cleared: previous.cleared || Boolean(result.cleared),
    objectiveMet: previous.objectiveMet || Boolean(result.objectiveMet),
    bestSeconds: result.cleared && seconds !== null
      ? Math.min(previous.bestSeconds ?? Infinity, seconds)
      : previous.bestSeconds,
    bestDrops: Math.max(previous.bestDrops ?? 0, Number.isFinite(result.drops) ? result.drops : 0),
  };
  if (entry.bestSeconds === Infinity) entry.bestSeconds = null;

  const routes = { ...current.routes, [route.id]: entry };
  const next = {
    ...current,
    routes,
    bestHeight: Math.max(current.bestHeight ?? 0, Number.isFinite(result.height) ? result.height : 0),
  };

  const cleared = Object.values(routes).filter((item) => item?.cleared).length;
  const known = new Set(current.unlocked ?? []);
  const unlocked = MILESTONES
    .filter((milestone) => milestone.routesCleared <= cleared && !known.has(milestone.id))
    .map((milestone) => milestone.id);
  next.unlocked = [...(current.unlocked ?? []), ...unlocked];

  const following = getRoutes().find((item) => item.order === route.order + 1);
  const routeUnlocked = entry.cleared && following && !previous.cleared ? following.id : null;
  if (entry.cleared && following) next.currentRoute = following.id;

  return { progress: next, unlocked, routeUnlocked };
}

export function selectRoute(progress, routeId) {
  const current = isCurrent(progress) ? progress : createDefaultProgress();
  const route = getRoute(routeId);
  if (!route || !isRouteUnlocked(current, route)) return current;
  return { ...current, currentRoute: route.id };
}

export function getMilestone(routesCleared = 0) {
  return MILESTONES.find((milestone) => milestone.routesCleared > routesCleared) ?? null;
}

export function getMilestones() {
  return MILESTONES.map((milestone) => ({ ...milestone }));
}

export function getVisualTier(progress) {
  const unlocked = new Set(isCurrent(progress) ? progress.unlocked : []);
  const highest = [...MILESTONES].reverse().find((milestone) => unlocked.has(milestone.id));
  return highest
    ? { id: highest.id, label: highest.label, accent: highest.accent }
    : { ...BASE_VISUAL_TIER };
}

// Compatibilidade: o caminho antigo chamava applyProgression com altura. Mantido
// para não quebrar chamadas existentes enquanto a interface migra.
export function applyProgression(progress, event) {
  const current = isCurrent(progress) ? progress : migrateProgress(progress);
  if (event?.type !== 'height' || !Number.isFinite(event.height)) {
    return { progress: { ...current }, unlocked: [] };
  }
  return {
    progress: { ...current, bestHeight: Math.max(current.bestHeight ?? 0, Math.max(0, event.height)) },
    unlocked: [],
  };
}
