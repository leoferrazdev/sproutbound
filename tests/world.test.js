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
