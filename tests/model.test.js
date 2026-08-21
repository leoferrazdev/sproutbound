import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatform, createRun } from '../src/game/model.js';

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
  assert.ok(run.summitHeight > 200);
});

test('platform constructor applies the stable leaf shape', () => {
  assert.deepEqual(
    createPlatform({ x: 48, y: 560, width: 96 }),
    { x: 48, y: 560, width: 96, height: 18, kind: 'leaf' },
  );
});
