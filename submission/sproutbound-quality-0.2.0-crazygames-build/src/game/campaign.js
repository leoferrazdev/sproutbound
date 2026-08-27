// Campanha de rotas desenhadas.
//
// Uma rota é uma receita autoral: bioma, semente própria, altura, escala de folga,
// mistura de perigos e objetivo. O gerador determinístico produz o traçado a partir
// disso. Autoria sem colocar milhares de folhas à mão, e testável.
//
// A semente é da ROTA, não da partida: uma fase precisa ser igual toda vez que o
// jogador a repete, senão não há como desenhá-la nem cobrar um objetivo justo.

export const BIOMES = Object.freeze({
  canopy: Object.freeze({
    id: 'canopy',
    label: 'Sunlit canopy',
    sky: ['#1d4d38', '#0d2a20'],
    leaf: '#79df8c',
    leafEdge: '#d5ff9c',
    cracked: '#4f8f68',
    moving: '#65c9a6',
    thorn: '#536b57',
    sun: '#ffd166',
    silhouette: 'rgba(120, 210, 150, 0.16)',
    crackLine: '#1f5146',
    thornSpike: '#ffcf5a',
    crackedEdge: '#a6d47e',
    movingEdge: '#b6f5d0',
    thornEdge: '#d2e58b',
    sunEdge: '#fff3b0',
    pipEdge: '#e7ffb3',
    dust: '#d5ff9c',
    spark: '#ffd166',
    mote: '#b9f46b',
    shade: '#09162b',
    silhouetteKind: 'canopy',
  }),
  dusk: Object.freeze({
    id: 'dusk',
    label: 'Dusk hollow',
    sky: ['#4a2340', '#1c0f26'],
    leaf: '#f2a65a',
    leafEdge: '#ffd9a0',
    cracked: '#b8663f',
    moving: '#e0736f',
    thorn: '#6b4250',
    sun: '#ffe08a',
    silhouette: 'rgba(226, 140, 120, 0.15)',
    crackLine: '#5d2b30',
    thornSpike: '#ffd98a',
    crackedEdge: '#ffc48a',
    movingEdge: '#ffb2a8',
    thornEdge: '#e8a9b8',
    sunEdge: '#fff1c4',
    pipEdge: '#ffe6c2',
    dust: '#ffc48a',
    spark: '#ffe08a',
    mote: '#ffb27a',
    shade: '#1c0f26',
    silhouetteKind: 'hills',
  }),
  crystal: Object.freeze({
    id: 'crystal',
    label: 'Crystal shelf',
    sky: ['#10334f', '#07182b'],
    leaf: '#7fe3ff',
    leafEdge: '#d8f7ff',
    cracked: '#4a91b5',
    moving: '#9ad4ff',
    thorn: '#3d5b74',
    sun: '#bff2ff',
    silhouette: 'rgba(130, 210, 240, 0.16)',
    crackLine: '#173a52',
    thornSpike: '#c8f4ff',
    crackedEdge: '#9fd8f0',
    movingEdge: '#d2efff',
    thornEdge: '#a8c8dd',
    sunEdge: '#e8fbff',
    pipEdge: '#dff7ff',
    dust: '#c6ecff',
    spark: '#bff2ff',
    mote: '#8fd8ff',
    shade: '#07182b',
    silhouetteKind: 'spikes',
  }),
  storm: Object.freeze({
    id: 'storm',
    label: 'Storm reach',
    sky: ['#2c3244', '#12151f'],
    leaf: '#9fb4c9',
    leafEdge: '#e6f0ff',
    cracked: '#6c7f95',
    moving: '#c6d8ff',
    thorn: '#4a4f5e',
    sun: '#ffe98a',
    silhouette: 'rgba(180, 200, 230, 0.13)',
    crackLine: '#2b303c',
    thornSpike: '#ffe98a',
    crackedEdge: '#c2d2e6',
    movingEdge: '#e8f2ff',
    thornEdge: '#9aa4b6',
    sunEdge: '#fff5c2',
    pipEdge: '#eef4ff',
    dust: '#cddcf0',
    spark: '#ffe98a',
    mote: '#bcd2f0',
    shade: '#12151f',
    silhouetteKind: 'clouds',
  }),
  summit: Object.freeze({
    id: 'summit',
    label: 'Golden summit',
    sky: ['#553a1a', '#1c1206'],
    leaf: '#ffce6b',
    leafEdge: '#fff2c4',
    cracked: '#c98f3c',
    moving: '#ffe39b',
    thorn: '#6d4f26',
    sun: '#fff6d4',
    silhouette: 'rgba(255, 210, 130, 0.15)',
    crackLine: '#5a3d14',
    thornSpike: '#fff2c4',
    crackedEdge: '#ffd98f',
    movingEdge: '#fff0bd',
    thornEdge: '#c9a86a',
    sunEdge: '#fffbe8',
    pipEdge: '#fff4d0',
    dust: '#ffe3a0',
    spark: '#fff6d4',
    mote: '#ffd98f',
    shade: '#1c1206',
    silhouetteKind: 'peaks',
  }),
});

export const OBJECTIVE_TYPES = Object.freeze(['reach', 'collect', 'flawless', 'swift', 'frugal']);

// 5 biomas x 5 rotas. A altura sobe de 120 m a 400 m; a folga sobe de 0,42 a 0,96 do
// alcance lateral real, nunca acima dele. Os objetivos rodam entre os cinco tipos para
// que nenhum bioma repita a mesma cobrança duas vezes seguidas.
const ROUTE_TABLE = [
  ['canopy', 120, 0.42, { cracked: false, moving: false, thorn: false }, { type: 'reach' }],
  ['canopy', 136, 0.48, { cracked: true, moving: false, thorn: false }, { type: 'collect', value: 4 }],
  ['canopy', 152, 0.54, { cracked: true, moving: false, thorn: false }, { type: 'reach' }],
  ['canopy', 168, 0.58, { cracked: true, moving: true, thorn: false }, { type: 'swift', value: 26 }],
  ['canopy', 184, 0.62, { cracked: true, moving: true, thorn: false }, { type: 'collect', value: 7 }],

  ['dusk', 196, 0.62, { cracked: true, moving: true, thorn: false }, { type: 'reach' }],
  ['dusk', 212, 0.66, { cracked: true, moving: true, thorn: true }, { type: 'flawless' }],
  ['dusk', 228, 0.70, { cracked: true, moving: true, thorn: true }, { type: 'collect', value: 8 }],
  ['dusk', 240, 0.72, { cracked: false, moving: true, thorn: true }, { type: 'swift', value: 34 }],
  ['dusk', 256, 0.74, { cracked: true, moving: true, thorn: true }, { type: 'frugal' }],

  ['crystal', 264, 0.74, { cracked: true, moving: true, thorn: true }, { type: 'reach' }],
  ['crystal', 276, 0.78, { cracked: true, moving: true, thorn: true }, { type: 'flawless' }],
  ['crystal', 288, 0.80, { cracked: false, moving: true, thorn: true }, { type: 'collect', value: 10 }],
  ['crystal', 300, 0.82, { cracked: true, moving: true, thorn: true }, { type: 'swift', value: 42 }],
  ['crystal', 312, 0.84, { cracked: true, moving: true, thorn: true }, { type: 'frugal' }],

  ['storm', 320, 0.84, { cracked: true, moving: true, thorn: true }, { type: 'reach' }],
  ['storm', 332, 0.86, { cracked: true, moving: true, thorn: true }, { type: 'flawless' }],
  ['storm', 344, 0.88, { cracked: true, moving: true, thorn: true }, { type: 'collect', value: 12 }],
  ['storm', 356, 0.90, { cracked: true, moving: true, thorn: true }, { type: 'swift', value: 50 }],
  ['storm', 364, 0.92, { cracked: true, moving: true, thorn: true }, { type: 'frugal' }],

  ['summit', 372, 0.92, { cracked: true, moving: true, thorn: true }, { type: 'reach' }],
  ['summit', 380, 0.94, { cracked: true, moving: true, thorn: true }, { type: 'flawless' }],
  ['summit', 388, 0.94, { cracked: true, moving: true, thorn: true }, { type: 'collect', value: 14 }],
  ['summit', 394, 0.96, { cracked: true, moving: true, thorn: true }, { type: 'swift', value: 58 }],
  ['summit', 400, 0.96, { cracked: true, moving: true, thorn: true }, { type: 'frugal' }],
];

// Semente estável derivada da posição: muda entre rotas, nunca entre partidas.
function routeSeed(order) {
  return (order * 7919 + 104729) % 2147483647;
}

const ROUTES = Object.freeze(ROUTE_TABLE.map(([biome, height, reachScale, hazards, objective], index) => Object.freeze({
  id: `${biome}-${(index % 5) + 1}`,
  order: index + 1,
  biome,
  seed: routeSeed(index + 1),
  height,
  reachScale,
  hazards: Object.freeze({ ...hazards }),
  objective: Object.freeze({ ...objective }),
})));

export function getRoutes() {
  return ROUTES;
}

export function getRoute(idOrOrder) {
  if (Number.isInteger(idOrOrder)) return ROUTES.find((route) => route.order === idOrOrder) ?? null;
  return ROUTES.find((route) => route.id === idOrOrder) ?? null;
}

export function getFirstRoute() {
  return ROUTES[0];
}

export function getNextRoute(route) {
  return getRoute((route?.order ?? 0) + 1);
}

export function getBiome(id) {
  return BIOMES[id] ?? BIOMES.canopy;
}

// Quantas linhas de plataforma a rota precisa para atingir a altura declarada.
// 12 px por metro e 87,5 px por linha, com folga para o topo.
export function getRouteRows(route) {
  const metres = route?.height ?? 120;
  return Math.max(8, Math.ceil((metres * 12) / 87.5) + 4);
}

// ------------------------------------------------------------------ objetivos

export function describeObjective(route) {
  const objective = route?.objective ?? { type: 'reach' };
  return { type: objective.type, value: objective.value ?? null };
}

export function createObjectiveTracker(route) {
  return {
    routeId: route?.id ?? null,
    type: route?.objective?.type ?? 'reach',
    target: route?.objective?.value ?? null,
    drops: 0,
    seconds: 0,
    thornHits: 0,
    shieldUsed: false,
    reachedTop: false,
  };
}

export function trackObjective(tracker, events = [], dt = 0) {
  const next = { ...tracker };
  next.seconds += Math.max(0, Number.isFinite(dt) ? dt : 0);
  for (const event of events) {
    if (event === 'collectedSun') next.drops += 1;
    if (event === 'hazardHit') next.thornHits += 1;
    if (event === 'solarShieldUsed') next.shieldUsed = true;
    if (event === 'summitReached') next.reachedTop = true;
  }
  return next;
}

// Alcançar o topo sempre conclui a rota e libera a seguinte. O objetivo é uma
// segunda camada, opcional, que rende a estrela — para nunca travar o jogador
// numa cobrança difícil.
export function evaluateObjective(tracker) {
  if (!tracker?.reachedTop) return { cleared: false, objectiveMet: false };
  switch (tracker.type) {
    case 'collect':
      return { cleared: true, objectiveMet: tracker.drops >= (tracker.target ?? 0) };
    case 'flawless':
      return { cleared: true, objectiveMet: tracker.thornHits === 0 };
    case 'swift':
      return { cleared: true, objectiveMet: tracker.seconds <= (tracker.target ?? Infinity) };
    case 'frugal':
      return { cleared: true, objectiveMet: !tracker.shieldUsed };
    case 'reach':
    default:
      return { cleared: true, objectiveMet: true };
  }
}
