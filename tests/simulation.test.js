import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, rectsOverlap, stepPlayer } from '../src/game/player.js';
import { stepRun } from '../src/game/simulation.js';

test('player steers horizontally and clamps to the viewport', async () => {
  const player = createPlayer({ x: 170, y: 200 });
  const moved = stepPlayer(player, { left: false, right: true }, 0.2, { width: 360, height: 640 });

  assert.ok(moved.x > player.x);
  assert.ok(moved.x + moved.width <= 360);
  assert.equal(player.x, 170);
});

test('player gravity uses a bounded delta time', () => {
  const player = createPlayer({ x: 170, y: 200 });
  const moved = stepPlayer(player, {}, 2, { width: 360, height: 640 });

  assert.ok(moved.y > player.y);
  assert.ok(moved.y < 700);
});

test('descending player lands on a leaf and bounces automatically', () => {
  const run = {
    state: 'playing',
    score: 0,
    bestScore: 0,
    cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'leaf' }],
    thorns: [],
    sunDrops: [],
  };

  const result = stepRun(run, {}, 0.2);

  assert.ok(result.events.includes('landed'));
  assert.ok(result.run.player.vy < 0);
  assert.equal(result.run.score, 1);
});

test('thorn collision and falling emit one playerDied event', () => {
  const run = {
    state: 'playing',
    score: 2,
    bestScore: 2,
    cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 90 }), grounded: false, vy: 0 },
    platforms: [],
    thorns: [{ x: 80, y: 90, width: 22, height: 18, kind: 'thorn' }],
    sunDrops: [],
  };

  const first = stepRun(run, {}, 0.01);
  const second = stepRun(first.run, {}, 0.01);

  assert.ok(first.events.includes('playerDied'));
  assert.equal(second.events.includes('playerDied'), false);
  assert.equal(second.run.player.dead, true);
});

test('rect overlap treats touching edges as non-overlap', () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }), false);
});

test('landing emits a milestone event and advances the next unlock', () => {
  const run = {
    state: 'playing',
    score: 9,
    bestScore: 9,
    cameraY: 0,
    nextUnlock: { id: 'bud', height: 10, label: 'Broto com duas folhas' },
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'leaf' }],
    thorns: [],
    sunDrops: [],
  };

  const result = stepRun(run, {}, 0.2);

  assert.ok(result.events.includes('milestoneReached'));
  assert.equal(result.run.nextUnlock.id, 'bloom');
});
