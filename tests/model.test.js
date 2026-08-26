import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatform, createRun } from '../src/game/model.js';
import { applyRouteResult, createDefaultProgress } from '../src/game/progression.js';
import { getRoute } from '../src/game/campaign.js';

test('new run starts ready with a player and safe starting platform', () => {
  const run = createRun();

  assert.equal(run.state, 'ready');
  assert.equal(run.score, 0);
  assert.equal(run.bestScore, 0);
  assert.equal(run.player.dead, false);
  assert.equal(run.platforms.length > 0, true);
  assert.equal(run.thorns.every((thorn) => thorn.y < 200), true);
  assert.equal(run.sunDrops.length >= 0, true);
  assert.equal(run.nextUnlock.id, 'bud');
  assert.equal(run.sunCount, 0);
  assert.equal(run.route.id, 'canopy-1', 'sem argumento o run começa na primeira rota da campanha');
  assert.equal(run.objective.type, 'reach');
  const lastPlatform = run.platforms.at(-1);
  const expectedSummitHeight = Math.floor((run.startY - lastPlatform.y) / 12) + 1;
  assert.equal(run.summitHeight, expectedSummitHeight);
  assert.ok(run.summitHeight >= getRoute(1).height, 'o cume precisa cobrir a altura declarada da rota');
});

test('new run carries persistent visual progression and solar state', () => {
  let progress = createDefaultProgress();
  for (const order of [1, 2, 3, 4, 5]) {
    progress = applyRouteResult(progress, { routeId: getRoute(order).id, cleared: true, seconds: 20, drops: 4 }).progress;
  }
  const run = createRun(getRoute(6), progress);

  assert.equal(run.visualTier.id, 'bloom');
  assert.deepEqual(run.solar, {
    collected: 0,
    charge: 0,
    shieldAvailable: false,
    shieldUsed: false,
  });
});

test('platform constructor applies the stable leaf shape', () => {
  assert.deepEqual(
    createPlatform({ x: 48, y: 560, width: 96 }),
    { x: 48, y: 560, width: 96, height: 18, kind: 'leaf' },
  );
});
