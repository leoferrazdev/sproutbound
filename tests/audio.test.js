import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';

function createFakeAudioWindow() {
  const calls = [];
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.state = 'running';
    }

    createOscillator() {
      return {
        frequency: { setValueAtTime: (value) => calls.push(['frequency', value]) },
        connect: () => {},
        start: () => calls.push(['start']),
        stop: () => calls.push(['stop']),
      };
    }

    createGain() {
      return {
        gain: { setValueAtTime: (value) => calls.push(['gain', value]) },
        connect: () => {},
      };
    }
  }

  return { AudioContext: FakeAudioContext, destination: {}, calls };
}

test('audio is lazy, local and mute-safe', () => {
  const windowRef = createFakeAudioWindow();
  const audio = createAudio({ windowRef });

  assert.equal(audio.getState(), 'idle');
  audio.setMuted(true);
  audio.playEvents(['collectedSun']);
  assert.equal(windowRef.calls.length, 0);

  audio.setMuted(false);
  audio.playEvents(['collectedSun']);
  assert.equal(audio.getState(), 'ready');
  assert.ok(windowRef.calls.some(([name]) => name === 'start'));
});
