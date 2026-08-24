import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameDistributionAdapter } from '../src/platform-adapters/gamedistribution.js';

const fakeWindow = () => ({ setTimeout, clearTimeout });

test('pauses and resumes once for SDK lifecycle events', () => {
  const calls = [];
  const adapter = createGameDistributionAdapter({
    windowRef: fakeWindow(),
    onPause: () => calls.push('pause-loop'),
    onResume: () => calls.push('resume-loop'),
    onMute: () => calls.push('mute'),
    onUnmute: () => calls.push('unmute'),
  });

  adapter.handleEvent({ name: 'SDK_GAME_PAUSE' });
  adapter.handleEvent({ name: 'SDK_GAME_PAUSE' });
  adapter.handleEvent({ name: 'SDK_GAME_START' });
  adapter.handleEvent({ name: 'SDK_GAME_START' });

  assert.deepEqual(calls, ['pause-loop', 'mute', 'resume-loop', 'unmute']);
  assert.equal(adapter.isInputPaused(), false);
});

test('calls showAd and resolves after SDK_GAME_START', async () => {
  let calls = 0;
  const adapter = createGameDistributionAdapter({
    windowRef: fakeWindow(),
    sdk: { showAd: () => { calls += 1; } },
  });

  const resultPromise = adapter.requestCommercialBreak();
  assert.equal(calls, 1);
  adapter.handleEvent({ name: 'SDK_GAME_START' });
  assert.equal(await resultPromise, true);
});

test('fails open when SDK or showAd is unavailable', async () => {
  const adapter = createGameDistributionAdapter({ windowRef: fakeWindow() });

  assert.equal(await adapter.requestCommercialBreak(), false);
  assert.equal(adapter.getSdkStatus(), 'unavailable');
});

test('preserves duplicate lifecycle locks', async () => {
  const adapter = createGameDistributionAdapter({ windowRef: fakeWindow() });

  assert.equal(await adapter.startGameplay(), true);
  assert.equal(await adapter.startGameplay(), false);
  assert.equal(await adapter.stopGameplay(), true);
  assert.equal(await adapter.stopGameplay(), false);
  assert.deepEqual(adapter.getEvents(), ['start', 'stop']);
});
