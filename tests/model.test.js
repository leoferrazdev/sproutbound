import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatform, createRun } from '../src/game/model.js';
import { applyProgression, createDefaultProgress } from '../src/game/progression.js';

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
  assert.equal(run.platforms.length >= 24, true);
  const lastPlatform = run.platforms.at(-1);
  const expectedSummitHeight = Math.floor((run.startY - lastPlatform.y) / 12) + 1;
  assert.equal(run.summitHeight, expectedSummitHeight);
  assert.equal(run.summitHeight, 249);
});

test('new run carries persistent visual progression and solar state', () => {
  const reachedBloom = applyProgression(createDefaultProgress(), { type: 'height', height: 25 });
  const run = createRun(1, reachedBloom.progress);

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
