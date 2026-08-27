import { createWorld } from './world.js';
import { createDefaultProgress, getMilestone, getVisualTier, countRoutesCleared, PROGRESS_VERSION } from './progression.js';
import { getFirstRoute, getRouteRows, createObjectiveTracker } from './campaign.js';
import { STAGE_WIDTH, STAGE_HEIGHT } from './stage.js';

export function createPlatform({ x, y, width, kind = 'leaf' }) {
  return {
    x,
    y,
    width,
    height: 18,
    kind,
  };
}

// A rota carrega a própria semente: repetir uma fase produz a mesma fase.
export function createRun(seedOrRoute = null, progress = createDefaultProgress()) {
  const route = seedOrRoute && typeof seedOrRoute === 'object' && seedOrRoute.id
    ? seedOrRoute
    : { ...getFirstRoute(), seed: Number.isFinite(seedOrRoute) ? seedOrRoute : getFirstRoute().seed };
  const entities = createWorld(route.seed, {
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    platformCount: getRouteRows(route),
    reachScale: route.reachScale,
    hazards: route.hazards,
  });
  const platforms = entities
    .filter((entity) => entity.type === 'platform')
    .map(({ type, ...platform }) => platform);
  const thorns = entities.filter((entity) => entity.type === 'thorn');
  const sunDrops = entities.filter((entity) => entity.type === 'sun');
  const firstPlatform = platforms[0];
  const startY = firstPlatform.y - 34;
  const lastPlatform = platforms.at(-1);
  const summitHeight = Math.floor((startY - lastPlatform.y) / 12) + 1;
  const safeProgress = progress?.version === PROGRESS_VERSION ? progress : createDefaultProgress();

  return {
    state: 'ready',
    route: { id: route.id, order: route.order, biome: route.biome, objective: route.objective, height: route.height },
    objective: createObjectiveTracker(route),
    score: 0,
    bestScore: Math.max(0, safeProgress.bestHeight ?? 0),
    startY,
    summitHeight,
    summitReached: false,
    sunCount: 0,
    solar: {
      collected: 0,
      charge: 0,
      shieldAvailable: false,
      shieldUsed: false,
    },
    visualTier: getVisualTier(safeProgress),
    player: {
      x: firstPlatform.x + firstPlatform.width / 2 - 13,
      y: startY,
      vx: 0,
      vy: 0,
      width: 26,
      height: 34,
      grounded: true,
      dead: false,
    },
    platforms,
    thorns,
    sunDrops,
    cameraY: 0,
    nextUnlock: getMilestone(countRoutesCleared(safeProgress)),
  };
}
