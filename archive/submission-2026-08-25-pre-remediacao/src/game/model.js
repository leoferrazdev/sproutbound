import { createWorld } from './world.js';
import { createDefaultProgress, getMilestone, getVisualTier } from './progression.js';

export function createPlatform({ x, y, width, kind = 'leaf' }) {
  return {
    x,
    y,
    width,
    height: 18,
    kind,
  };
}

export function createRun(seed = 1, progress = createDefaultProgress()) {
  const entities = createWorld(seed, { width: 360, height: 640, platformCount: 36 });
  const platforms = entities
    .filter((entity) => entity.type === 'platform')
    .map(({ type, ...platform }) => platform);
  const thorns = entities.filter((entity) => entity.type === 'thorn');
  const sunDrops = entities.filter((entity) => entity.type === 'sun');
  const firstPlatform = platforms[0];
  const startY = firstPlatform.y - 34;
  const lastPlatform = platforms.at(-1);
  const summitHeight = Math.floor((startY - lastPlatform.y) / 12) + 1;
  const safeProgress = progress?.version === 1 ? progress : createDefaultProgress();

  return {
    state: 'ready',
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
    nextUnlock: getMilestone(safeProgress.bestHeight ?? 0),
  };
}
