import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/game/world.js';

const viewport = { width: 360, height: 640 };

test('same seed produces the same world', () => {
  assert.deepEqual(createWorld(7, viewport), createWorld(7, viewport));
});

test('initial world keeps early platforms readable and hazard-free', () => {
  const world = createWorld(11, viewport);
  const platforms = world.filter((entity) => entity.type === 'platform');
  const earlyPlatforms = platforms.slice(0, 3);

  assert.equal(earlyPlatforms.length, 3);
  assert.equal(world.filter((entity) => entity.type === 'thorn').length, 0);
  assert.equal(earlyPlatforms.every((platform) => platform.width >= 76 && platform.width <= 112), true);
  assert.equal(Math.max(...earlyPlatforms.map((platform) => platform.x)) < viewport.width, true);
  assert.equal(Math.min(...earlyPlatforms.map((platform) => platform.x)) >= 0, true);
  assert.equal(earlyPlatforms.every((platform, index) => index === 0 || platform.y < earlyPlatforms[index - 1].y), true);
});

test('extended world keeps the climb available beyond the first viewport', () => {
  const world = createWorld(5, { ...viewport, platformCount: 30 });
  const platforms = world.filter((entity) => entity.type === 'platform');
  const fragile = platforms.filter((platform) => platform.kind === 'cracked-leaf');

  assert.equal(platforms.length, 30);
  assert.ok(platforms.at(-1).y < -1000);
  assert.ok(world.some((entity) => entity.type === 'thorn'));
  assert.ok(fragile.length > 0);
  assert.equal(fragile.every((platform) => platforms.indexOf(platform) >= 6), true);
  assert.deepEqual(
    createWorld(5, { ...viewport, platformCount: 30 }),
    createWorld(5, { ...viewport, platformCount: 30 }),
  );
});
