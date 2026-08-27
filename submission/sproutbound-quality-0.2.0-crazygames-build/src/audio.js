// Áudio local, sintetizado, sem nenhum arquivo externo.
//
// Antes eram sete ondas senoidais de 0,13 s a ganho 0,045: sem música, sem
// camadas, sem variação. As diretrizes da plataforma exigem áudio confortável e
// apropriado, e a ausência quase total de som lê como produto inacabado.
//
// Agora cada efeito tem camadas com dessintonia, e existe um leito musical em
// loop cuja escala muda por bioma.

const MUTE_KEY = 'sproutbound.muted.v1';

// Cada evento é um acorde curto, não um bipe: fundamental, harmônico e um brilho.
const EVENT_VOICES = new Map([
  ['landed', [{ f: 180, type: 'triangle', gain: 0.05, hold: 0.1 }, { f: 90, type: 'sine', gain: 0.035, hold: 0.14 }]],
  ['platformImpact', [{ f: 210, type: 'triangle', gain: 0.04, hold: 0.08 }, { f: 105, type: 'sine', gain: 0.03, hold: 0.12 }]],
  ['collectedSun', [
    { f: 720, type: 'triangle', gain: 0.05, hold: 0.1 },
    { f: 1080, type: 'sine', gain: 0.03, hold: 0.14, delay: 0.04 },
    { f: 1440, type: 'sine', gain: 0.018, hold: 0.1, delay: 0.08 },
  ]],
  ['solarShieldReady', [
    { f: 660, type: 'sine', gain: 0.045, hold: 0.18 },
    { f: 990, type: 'triangle', gain: 0.03, hold: 0.22, delay: 0.06 },
  ]],
  ['solarShieldUsed', [{ f: 520, type: 'sawtooth', gain: 0.04, hold: 0.14 }, { f: 260, type: 'sine', gain: 0.035, hold: 0.2 }]],
  ['hazardHit', [{ f: 150, type: 'sawtooth', gain: 0.05, hold: 0.16 }, { f: 98, type: 'square', gain: 0.03, hold: 0.2 }]],
  ['milestoneReached', [
    { f: 523, type: 'triangle', gain: 0.045, hold: 0.2 },
    { f: 659, type: 'triangle', gain: 0.04, hold: 0.22, delay: 0.07 },
    { f: 784, type: 'sine', gain: 0.035, hold: 0.26, delay: 0.14 },
  ]],
  ['summitReached', [
    { f: 523, type: 'triangle', gain: 0.05, hold: 0.3 },
    { f: 784, type: 'triangle', gain: 0.04, hold: 0.34, delay: 0.09 },
    { f: 1046, type: 'sine', gain: 0.035, hold: 0.4, delay: 0.18 },
  ]],
  ['playerDied', [{ f: 160, type: 'sawtooth', gain: 0.05, hold: 0.26 }, { f: 80, type: 'sine', gain: 0.04, hold: 0.34 }]],
]);

// Leito musical: uma escala por bioma, tocada em arpejo lento e grave. É música
// no sentido que importa aqui — presença contínua e identidade por ambiente.
const BIOME_SCALES = Object.freeze({
  canopy: [196.0, 233.08, 293.66, 349.23, 392.0],
  dusk: [174.61, 207.65, 261.63, 311.13, 349.23],
  crystal: [220.0, 277.18, 329.63, 415.3, 440.0],
  storm: [164.81, 196.0, 246.94, 293.66, 329.63],
  summit: [261.63, 311.13, 392.0, 466.16, 523.25],
});

const STEP_SECONDS = 0.55;
const LOOP_STEPS = 16;

export function getBiomeScale(biome) {
  return BIOME_SCALES[biome] ?? BIOME_SCALES.canopy;
}

export function createAudio({ windowRef = globalThis, storage = null } = {}) {
  let context = null;
  let state = 'idle';
  let muted = false;
  let musicBiome = null;
  let musicStep = 0;
  let musicTimer = null;
  let musicRunning = false;

  const readStoredMute = () => {
    try {
      const store = storage ?? windowRef?.localStorage ?? null;
      return store?.getItem?.(MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  };

  const writeStoredMute = (value) => {
    try {
      const store = storage ?? windowRef?.localStorage ?? null;
      store?.setItem?.(MUTE_KEY, String(value));
    } catch { /* preferência de som nunca pode quebrar o jogo */ }
  };

  muted = readStoredMute();

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

  const voice = ({ f, type = 'sine', gain = 0.04, hold = 0.12, delay = 0 }) => {
    const audioContext = getContext();
    if (!audioContext) return;
    try {
      const start = audioContext.currentTime + delay;
      const oscillator = audioContext.createOscillator();
      const amp = audioContext.createGain();
      if ('type' in oscillator) oscillator.type = type;
      oscillator.frequency.setValueAtTime(f, start);
      amp.gain.setValueAtTime(0.0001, start);
      amp.gain.setValueAtTime(gain, start + 0.01);
      amp.gain.setValueAtTime(0.0001, start + hold);
      oscillator.connect(amp);
      amp.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + hold + 0.02);
    } catch {
      state = 'unavailable';
    }
  };

  const playEvents = (events = []) => {
    if (muted) return;
    for (const event of events) {
      const voices = EVENT_VOICES.get(event);
      if (!voices) continue;
      for (const spec of voices) voice(spec);
    }
  };

  const stepMusic = () => {
    if (muted || !musicRunning) return;
    const scale = getBiomeScale(musicBiome);
    const note = scale[musicStep % scale.length];
    voice({ f: note / 2, type: 'triangle', gain: 0.022, hold: STEP_SECONDS * 0.9 });
    if (musicStep % 4 === 0) voice({ f: note, type: 'sine', gain: 0.014, hold: STEP_SECONDS * 1.4 });
    musicStep = (musicStep + 1) % LOOP_STEPS;
  };

  const startMusic = (biome = 'canopy') => {
    musicBiome = biome;
    if (musicRunning) return;
    musicRunning = true;
    musicStep = 0;
    stepMusic();
    const schedule = windowRef?.setInterval;
    if (typeof schedule === 'function') {
      musicTimer = schedule(stepMusic, STEP_SECONDS * 1000);
    }
  };

  const stopMusic = () => {
    musicRunning = false;
    const cancel = windowRef?.clearInterval;
    if (musicTimer !== null && typeof cancel === 'function') cancel(musicTimer);
    musicTimer = null;
  };

  const setMuted = (value) => {
    muted = Boolean(value);
    writeStoredMute(muted);
    if (muted) stopMusic();
  };

  return {
    playEvents,
    startMusic,
    stopMusic,
    stepMusic,
    setBiome: (biome) => { musicBiome = biome; },
    unlock() {
      getContext();
      if (context?.state === 'suspended') context.resume?.().catch?.(() => undefined);
    },
    setMuted,
    mute: () => setMuted(true),
    unmute: () => setMuted(false),
    toggleMuted: () => { setMuted(!muted); return muted; },
    getState: () => state,
    isMuted: () => muted,
    isMusicRunning: () => musicRunning,
    getMusicBiome: () => musicBiome,
  };
}
