import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, rectsOverlap, stepPlayer } from '../src/game/player.js';
import { createRun } from '../src/game/model.js';
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
    startY: 206,
    cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'leaf' }],
    thorns: [],
    sunDrops: [],
  };

  const result = stepRun(run, {}, 0.2);

  assert.ok(result.events.includes('landed'));
  assert.ok(result.run.player.vy < 0);
  assert.equal(result.run.score, 10);
});

test('landing on a fixed leaf starts a visual impact without moving its collision plane', () => {
  const run = {
    state: 'playing',
    score: 0,
    bestScore: 0,
    startY: 206,
    cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'leaf' }],
    thorns: [],
    sunDrops: [],
  };

  const result = stepRun(run, {}, 0.2);
  const platform = result.run.platforms[0];

  assert.ok(result.events.includes('landed'));
  assert.ok(result.events.includes('platformImpact'));
  assert.equal(platform.y, 120);
  assert.ok(platform.impactTime > 0);
  assert.equal(result.run.player.y, 86);
});

test('thorn canopy ends the run without bouncing Pip', () => {
  const run = {
    state: 'playing',
    score: 0,
    bestScore: 0,
    startY: 206,
    cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'thorn-leaf' }],
    thorns: [],
    sunDrops: [],
  };

  const result = stepRun(run, {}, 0.2);

  assert.ok(result.events.includes('hazardHit'));
  assert.ok(result.events.includes('playerDied'));
  assert.equal(result.events.includes('landed'), false);
  assert.equal(result.run.player.dead, true);
  assert.equal(result.run.player.vy < 0, false);
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
    startY: 206,
    cameraY: 0,
    nextUnlock: { id: 'bud', height: 10, label: 'Broto com duas folhas' },
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'leaf' }],
    thorns: [],
    sunDrops: [],
  };

  const result = stepRun(run, {}, 0.2);

  assert.ok(result.events.includes('milestoneReached'));
  assert.equal(result.run.score, 10);
  assert.equal(result.run.nextUnlock.id, 'bloom');
});

test('sun drops are collected once when Pip overlaps them', () => {
  const run = {
    state: 'playing',
    score: 0,
    bestScore: 0,
    cameraY: 0,
    player: { ...createPlayer({ x: 90, y: 300 }), grounded: false, vy: 0 },
    platforms: [],
    thorns: [],
    sunDrops: [{ type: 'sun', x: 100, y: 318, radius: 8, kind: 'sun' }],
  };

  const first = stepRun(run, {}, 0.01);
  const second = stepRun(first.run, {}, 0.01);

  assert.ok(first.events.includes('collectedSun'));
  assert.equal(first.run.sunCount, 1);
  assert.equal(first.run.sunDrops.length, 0);
  assert.equal(second.events.includes('collectedSun'), false);
  assert.equal(second.run.sunCount, 1);
});

test('height is measured from the highest world position instead of landings', () => {
  const run = {
    state: 'playing',
    score: 0,
    bestScore: 0,
    startY: 542,
    cameraY: 0,
    player: { ...createPlayer({ x: 90, y: 302 }), grounded: false, vy: 0 },
    platforms: [],
    thorns: [],
    sunDrops: [],
  };

  const result = stepRun(run, {}, 0);

  assert.equal(result.run.score, 20);
  assert.equal(result.run.bestScore, 20);
});

test('cracked leaf bounces once and immediately loses collision', () => {
  const run = {
    state: 'playing',
    score: 0,
    bestScore: 0,
    startY: 206,
    cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'cracked-leaf' }],
    thorns: [],
    sunDrops: [],
  };

  const first = stepRun(run, {}, 0.2);
  const second = stepRun(first.run, {}, 0.01);

  assert.ok(first.events.includes('landed'));
  assert.ok(first.events.includes('platformTriggered'));
  assert.equal(first.run.platforms[0].collapsing, true);
  assert.equal(second.events.includes('landed'), false);
});

test('collapsing cracked leaf expires and becomes collapsed state', () => {
  const run = {
    state: 'playing',
    score: 0,
    bestScore: 0,
    startY: 206,
    cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: 60, y: 120, width: 100, height: 18, kind: 'cracked-leaf' }],
    thorns: [],
    sunDrops: [],
  };

  let result = stepRun(run, {}, 0.2);
  for (let frame = 0; frame < 20 && !result.run.platforms[0].collapsed; frame += 1) {
    result = stepRun(result.run, {}, 1 / 30);
  }

  assert.ok(result.events.includes('platformCollapsed'));
  assert.equal(result.run.platforms[0].collapsed, true);
  assert.equal(result.run.platforms[0].collapseTime, 0);
});

test('moving canopy advances inside the logical stage before collision', () => {
  const run = {
    state: 'playing',
    score: 0,
    bestScore: 0,
    startY: 206,
    cameraY: 0,
    player: { ...createPlayer({ x: 80, y: 80 }), grounded: false, vy: 220 },
    platforms: [{
      x: 80,
      y: 120,
      width: 90,
      height: 18,
      kind: 'moving-leaf',
      row: 6,
      baseX: 80,
      motionRange: 40,
      motionPhase: 0,
      motionSpeed: 2,
    }],
    thorns: [],
    sunDrops: [],
  };

  const result = stepRun(run, {}, 1 / 30);

  assert.notEqual(result.run.platforms[0].x, 80);
  assert.ok(result.run.platforms[0].x >= 0);
  assert.ok(result.run.platforms[0].x + result.run.platforms[0].width <= 360);
});

test('moving sun drop updates before collection is resolved', () => {
  const run = {
    state: 'playing',
    score: 40,
    bestScore: 40,
    startY: 542,
    cameraY: 0,
    player: { ...createPlayer({ x: 112, y: 300 }), grounded: false, vy: 0 },
    platforms: [],
    thorns: [],
    sunDrops: [{
      type: 'sun',
      x: 100,
      y: 318,
      radius: 8,
      kind: 'sun',
      baseX: 100,
      motionRange: 20,
      motionPhase: Math.PI / 2 - 2 / 30,
      motionSpeed: 2,
    }],
  };

  const result = stepRun(run, {}, 1 / 30);

  assert.equal(result.run.sunDrops.length, 0);
  assert.equal(result.run.sunCount, 1);
});

test('opening jump reaches the first target and aligns Pip feet with the leaf top', () => {
  const initial = createRun(1);
  const target = initial.platforms[1];
  const direction = target.x < initial.player.x ? 'left' : 'right';
  let result = stepRun(initial, { [direction]: true, primary: true }, 1 / 60);

  for (let frame = 0; frame < 90 && !result.events.includes('landed'); frame += 1) {
    result = stepRun(result.run, { [direction]: true }, 1 / 60);
  }

  assert.ok(result.events.includes('landed'));
  assert.equal(result.run.player.y + result.run.player.height, target.y);
});
