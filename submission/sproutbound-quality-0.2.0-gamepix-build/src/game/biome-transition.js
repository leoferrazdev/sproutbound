import { getBiome } from './campaign.js';

// Transição entre biomas ao trocar de rota.
//
// Interpolar a PALETA, e não sobrepor um fade genérico: folhas, céu, silhuetas,
// espinhos e os pulsos de feedback mudam juntos, como se o mundo virasse o novo
// bioma. Um véu por cima faria a cena escurecer e voltar, o que não é a mesma
// coisa e mascararia o jogo durante a troca.
//
// Função pura de (estado, dt). Nada de aleatoriedade, nada de temporizador
// próprio: o laço de quadro já entrega o dt.

export const TRANSITION_SECONDS = 0.85;

// Só cores são interpoláveis. O tipo de silhueta é uma forma, então troca no
// meio do caminho, quando a paleta já está mais perto do destino.
const COLOUR_KEYS = [
  'leaf', 'leafEdge', 'cracked', 'crackedEdge', 'moving', 'movingEdge',
  'thorn', 'thornEdge', 'thornSpike', 'crackLine',
  'sun', 'sunEdge', 'pipEdge', 'dust', 'spark', 'mote', 'shade',
];

function parseHex(value) {
  const raw = String(value).replace('#', '');
  return [0, 2, 4].map((index) => Number.parseInt(raw.slice(index, index + 2), 16));
}

function toHex([r, g, b]) {
  return `#${[r, g, b].map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`;
}

function parseRgba(value) {
  const match = String(value).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])];
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function mixHex(from, to, t) {
  const a = parseHex(from);
  const b = parseHex(to);
  return toHex([mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]);
}

function mixRgba(from, to, t) {
  const a = parseRgba(from);
  const b = parseRgba(to);
  if (!a || !b) return t < 0.5 ? from : to;
  const [r, g, bl, al] = [0, 1, 2, 3].map((i) => mix(a[i], b[i], t));
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(bl)}, ${Number(al.toFixed(3))})`;
}

// Suavização: entra e sai devagar, para a troca não parecer um corte linear.
function ease(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

export function blendBiomes(fromId, toId, progress) {
  const from = getBiome(fromId);
  const to = getBiome(toId);
  if (fromId === toId) return to;

  const t = ease(progress);
  const blended = { ...to };
  for (const key of COLOUR_KEYS) blended[key] = mixHex(from[key], to[key], t);
  blended.sky = [mixHex(from.sky[0], to.sky[0], t), mixHex(from.sky[1], to.sky[1], t)];
  blended.silhouette = mixRgba(from.silhouette, to.silhouette, t);
  blended.silhouetteKind = t < 0.5 ? from.silhouetteKind : to.silhouetteKind;
  blended.id = to.id;
  return blended;
}

export function createBiomeTransition(biome = null) {
  return { from: biome, to: biome, remaining: 0 };
}

// Começa uma transição. Trocar para o mesmo bioma não faz nada, e uma troca no
// meio de outra parte do estado atual em vez de saltar para o bioma anterior.
export function startBiomeTransition(state, toBiome, { instant = false } = {}) {
  const current = state ?? createBiomeTransition(toBiome);
  if (!current.to) return { from: toBiome, to: toBiome, remaining: 0 };
  if (current.to === toBiome) return { ...current };
  if (instant) return { from: toBiome, to: toBiome, remaining: 0 };
  return { from: current.to, to: toBiome, remaining: TRANSITION_SECONDS };
}

export function stepBiomeTransition(state, dt = 0) {
  const current = state ?? createBiomeTransition(null);
  if (current.remaining <= 0) return current.remaining === 0 ? current : { ...current, remaining: 0 };
  const safeDt = Math.max(0, Number.isFinite(dt) ? dt : 0);
  const remaining = Math.max(0, current.remaining - safeDt);
  return { ...current, remaining };
}

export function isTransitioning(state) {
  return Boolean(state && state.remaining > 0 && state.from !== state.to);
}

export function transitionProgress(state) {
  if (!isTransitioning(state)) return 1;
  return 1 - state.remaining / TRANSITION_SECONDS;
}

// Paleta que o renderer deve usar neste quadro.
export function resolveBiomePalette(state, fallbackBiome) {
  if (!isTransitioning(state)) return getBiome(state?.to ?? fallbackBiome);
  return blendBiomes(state.from, state.to, transitionProgress(state));
}
