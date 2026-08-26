export const PULSE_SECONDS = {
  impact: 0.18,
  collect: 0.32,
  shield: 0.72,
  milestone: 0.95,
  death: 0.8,
};

const PULSE_KEYS = Object.keys(PULSE_SECONDS);

export function createFeedbackState() {
  return {
    impact: 0,
    collect: 0,
    shield: 0,
    milestone: 0,
    death: 0,
    origins: {},
  };
}

// Um pulso é um cronômetro; para desenhá-lo o renderer precisa saber de onde ele
// partiu. A origem é capturada no instante em que o evento acontece, para que a
// partícula fique onde a ação ocorreu mesmo depois de Pip seguir em frente.
function originOf(player) {
  if (!player) return null;
  return {
    x: player.x + (player.width ?? 0) / 2,
    y: player.y + (player.height ?? 0) / 2,
  };
}

export function stepFeedback(state = createFeedbackState(), events = [], dt = 0, { player = null } = {}) {
  const safeDt = Math.max(0, Number.isFinite(dt) ? dt : 0);
  const previous = { ...createFeedbackState(), ...state };
  const next = { origins: { ...(previous.origins ?? {}) } };
  for (const key of PULSE_KEYS) next[key] = Math.max(0, (previous[key] ?? 0) - safeDt);

  const trigger = (key, origin) => {
    next[key] = PULSE_SECONDS[key];
    if (origin) next.origins[key] = origin;
  };
  const origin = originOf(player);

  for (const event of events) {
    if (event === 'platformImpact' || event === 'landed') trigger('impact', origin && { x: origin.x, y: origin.y + (player?.height ?? 0) / 2 });
    if (event === 'collectedSun') trigger('collect', origin);
    if (event === 'solarShieldReady' || event === 'solarShieldUsed') trigger('shield', origin);
    if (event === 'milestoneReached' || event === 'summitReached') trigger('milestone', origin);
    if (event === 'playerDied') trigger('death', origin);
  }

  for (const key of PULSE_KEYS) {
    if (next[key] === 0) delete next.origins[key];
  }

  return next;
}

// Fração decorrida do pulso, de 0 no disparo a 1 no fim. Função pura do estado:
// nada de aleatoriedade no caminho de render.
export function pulseProgress(state, key) {
  const remaining = state?.[key] ?? 0;
  const total = PULSE_SECONDS[key];
  if (!remaining || !total) return null;
  return Math.max(0, Math.min(1, 1 - remaining / total));
}
