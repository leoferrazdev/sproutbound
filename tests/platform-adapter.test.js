import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatformAdapter } from '../src/platform-adapter.js';

test('lifecycle accepts one start and one stop per state transition', async () => {
  const adapter = createPlatformAdapter({});

  assert.equal(await adapter.startGameplay(), true);
  assert.equal(await adapter.startGameplay(), false);
  assert.equal(adapter.getState(), 'playing');
  assert.equal(await adapter.stopGameplay(), true);
  assert.equal(await adapter.stopGameplay(), false);
  assert.equal(adapter.getState(), 'stopped');
  assert.deepEqual(adapter.getEvents(), ['start', 'stop']);
});

test('pause blocks input until resume and commercial break stays offline', async () => {
  let pauses = 0;
  let resumes = 0;
  const adapter = createPlatformAdapter({
    onPause: () => { pauses += 1; },
    onResume: () => { resumes += 1; },
  });

  adapter.pauseInput();
  adapter.pauseInput();
  assert.equal(adapter.isInputPaused(), true);
  adapter.resumeInput();
  adapter.resumeInput();
  assert.equal(adapter.isInputPaused(), false);
  assert.equal(pauses, 1);
  assert.equal(resumes, 1);
  assert.equal(await adapter.requestCommercialBreak(), false);
  assert.deepEqual(adapter.getEvents(), ['pause', 'resume']);
});
