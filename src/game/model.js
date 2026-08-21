import { createWorld } from './world.js';

export function createPlatform({ x, y, width, kind = 'leaf' }) {
  return {
    x,
    y,
    width,
    height: 18,
    kind,
  };
}

export function createRun(seed = 1) {
  const entities = createWorld(seed, { width: 360, height: 640 });
  const platforms = entities
    .filter((entity) => entity.type === 'platform')
    .map(({ type, ...platform }) => platform);
  const thorns = entities.filter((entity) => entity.type === 'thorn');
  const sunDrops = entities.filter((entity) => entity.type === 'sun');
  const firstPlatform = platforms[0];

  return {
    state: 'ready',
    score: 0,
    bestScore: 0,
    player: {
      x: firstPlatform.x + firstPlatform.width / 2 - 13,
      y: firstPlatform.y - 34,
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
    nextUnlock: {
      id: 'bud',
      height: 25,
      label: 'Broto com duas folhas',
    },
  };
}
