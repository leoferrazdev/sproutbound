import test from 'node:test';
import assert from 'node:assert/strict';
import { applyProgression, createDefaultProgress, getMilestone } from '../src/game/progression.js';
import { createSafeStorage } from '../src/storage.js';

test('first visual milestone is reachable and exposes the next objective', () => {
  const first = getMilestone(0);
  const afterFirst = getMilestone(first.height);

  assert.equal(first.id, 'bud');
  assert.ok(first.height <= 25);
  assert.equal(afterFirst.id, 'bloom');
});

test('summit reward becomes the next objective after the initial visual milestones', () => {
  const summit = getMilestone(60);

  assert.equal(summit.id, 'summit-crown');
  assert.equal(summit.label, 'Coroa do cume');
});

test('reaching the summit unlocks the persistent summit reward', () => {
  const result = applyProgression(createDefaultProgress(), { type: 'height', height: 240 });

  assert.ok(result.unlocked.includes('summit-crown'));
  assert.ok(result.progress.unlocked.includes('summit-crown'));
});

test('progression unlocks a milestone once and ignores duplicates', () => {
  const initial = createDefaultProgress();
  const first = applyProgression(initial, { type: 'height', height: 10 });
  const repeated = applyProgression(first.progress, { type: 'height', height: 10 });

  assert.deepEqual(first.unlocked, ['bud']);
  assert.deepEqual(repeated.unlocked, []);
  assert.deepEqual(repeated.progress.unlocked, ['bud']);
});

test('malformed persisted data falls back to a valid default', () => {
  const storage = { getItem: () => '{broken', setItem: () => {}, removeItem: () => {} };
  const safe = createSafeStorage(storage);

  assert.deepEqual(safe.load(), createDefaultProgress());
});

test('storage failures never escape the safe adapter', () => {
  const storage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); },
  };
  const safe = createSafeStorage(storage);

  assert.doesNotThrow(() => safe.load());
  assert.equal(safe.save(createDefaultProgress()), false);
  assert.equal(safe.clear(), false);
});
