const EVENT_TONES = new Map([
  ['landed', 180],
  ['collectedSun', 720],
  ['solarShieldReady', 980],
  ['solarShieldUsed', 520],
  ['milestoneReached', 840],
  ['summitReached', 1040],
  ['playerDied', 120],
]);

export function createAudio({ windowRef = globalThis } = {}) {
  let context = null;
  let state = 'idle';
  let muted = false;

  const getContext = () => {
    if (context || state === 'unavailable') return context;
    const AudioContextConstructor = windowRef?.AudioContext ?? windowRef?.webkitAudioContext;
    if (typeof AudioContextConstructor !== 'function') {
      state = 'unavailable';
      return null;
    }
    try {
      context = new AudioContextConstructor();
      state = 'ready';
      return context;
    } catch {
      state = 'unavailable';
      return null;
    }
  };

  const playTone = (frequency) => {
    if (muted) return;
    const audioContext = getContext();
    if (!audioContext) return;
    try {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(0.045, now + 0.01);
      gain.gain.setValueAtTime(0.0001, now + 0.12);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.13);
    } catch {
      state = 'unavailable';
    }
  };

  const playEvents = (events = []) => {
    for (const event of events) {
      const frequency = EVENT_TONES.get(event);
      if (frequency) playTone(frequency);
    }
  };

  return {
    playEvents,
    setMuted: (value) => { muted = Boolean(value); },
    mute: () => { muted = true; },
    unmute: () => { muted = false; },
    getState: () => state,
    isMuted: () => muted,
  };
}
