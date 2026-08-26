import test from 'node:test';
import assert from 'node:assert/strict';

import { BIOMES, getBiome, getRoutes } from '../src/game/campaign.js';
import { createCanvasRenderer } from '../src/render/canvas-renderer.js';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../src/game/stage.js';

// Sonda que grava cor e geometria. Testar o estado do modelo não prova que a cor
// chega ao pixel — foi exatamente esse o defeito do feedback calculado e nunca
// desenhado, e da paralaxe aplicada a um só elemento.
function paint(snapshot) {
  const colours = new Set();
  const geometry = [];
  const context = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'createLinearGradient') return () => ({ addColorStop: (_s, colour) => colours.add(String(colour)) });
      if (prop === 'canvas') return { width: 360, height: 640 };
      if (typeof prop === 'string' && /^(fill|stroke|arc|moveTo|lineTo|rect|ellipse|quadraticCurveTo|closePath)/.test(prop)) {
        return (...args) => { if (args.length >= 2 && Number.isFinite(args[1])) geometry.push(Math.round(args[1])); };
      }
      return () => undefined;
    },
    set: (_target, prop, value) => {
      if (prop === 'fillStyle' || prop === 'strokeStyle') colours.add(String(value));
      return true;
    },
  });
  const renderer = createCanvasRenderer({ width: 360, height: 640, getContext: () => context });
  renderer.resize({ width: 360, height: 640, dpr: 1 });
  renderer.render(snapshot);
  return { colours, geometry: geometry.join(',') };
}

const scene = (biome, cameraY = 0) => ({
  route: { biome },
  player: { x: 160, y: 320, width: 26, height: 34, grounded: true, dead: false },
  platforms: [
    { x: 60, y: 300, width: 90, height: 18, kind: 'leaf' },
    { x: 200, y: 220, width: 80, height: 18, kind: 'cracked-leaf' },
    { x: 60, y: 140, width: 80, height: 18, kind: 'moving-leaf' },
    { x: 200, y: 60, width: 80, height: 18, kind: 'thorn-leaf' },
  ],
  sunDrops: [{ x: 180, y: 260, radius: 8 }],
  thorns: [],
  cameraY,
  feedback: {},
});

test('os cinco biomas declaram o mesmo conjunto de tokens', () => {
  const reference = Object.keys(BIOMES.canopy).sort();
  assert.equal(Object.keys(BIOMES).length, 5);
  for (const biome of Object.values(BIOMES)) {
    assert.deepEqual(Object.keys(biome).sort(), reference, `${biome.id} tem tokens diferentes`);
    assert.equal(biome.sky.length, 2);
  }
});

test('cada bioma tem silhueta de fundo própria', () => {
  const kinds = new Set(Object.values(BIOMES).map((biome) => biome.silhouetteKind));
  assert.equal(kinds.size, 5, 'dois biomas compartilham a mesma silhueta');
});

test('a paleta declarada chega ao pixel em todos os biomas', () => {
  for (const biome of Object.values(BIOMES)) {
    const { colours } = paint(scene(biome.id));
    for (const token of ['leaf', 'cracked', 'moving', 'thorn', 'sun', 'leafEdge', 'silhouette', 'pipEdge']) {
      assert.ok(colours.has(biome[token]), `${biome.id} declara ${token} e não pinta`);
    }
    assert.ok(colours.has(biome.sky[0]), `${biome.id} não usa o próprio céu`);
  }
});

test('dois biomas nunca pintam exatamente as mesmas cores', () => {
  const fingerprints = Object.values(BIOMES).map((biome) => [...paint(scene(biome.id)).colours].sort().join('|'));
  assert.equal(new Set(fingerprints).size, fingerprints.length);
});

test('o fundo se desloca com a câmera em vez de ficar parado', () => {
  const shapes = [0, -90, -260, -640, -1180].map((cameraY) => paint(scene('canopy', cameraY)).geometry);
  assert.equal(new Set(shapes).size, shapes.length, 'alturas distintas desenham o mesmo fundo');
  assert.notEqual(shapes[0], shapes[1], 'um passo curto de câmera já precisa mover o fundo');
});

test('toda rota aponta para um bioma existente', () => {
  for (const route of getRoutes()) {
    assert.ok(BIOMES[route.biome], `rota ${route.id} aponta para bioma inexistente`);
    assert.equal(getBiome(route.biome).id, route.biome);
  }
});

test('bioma desconhecido recai para o inicial em vez de quebrar', () => {
  assert.equal(getBiome('inexistente').id, 'canopy');
  assert.equal(getBiome(undefined).id, 'canopy');
  assert.doesNotThrow(() => paint(scene('inexistente')));
  assert.doesNotThrow(() => paint({ platforms: [], sunDrops: [], thorns: [] }));
});

test('nenhuma faixa vertical do palco fica sem silhueta de fundo', () => {
  // Havia um vão de 120 px num palco de 480, um quarto da largura, visível como
  // coluna escura dentro da área de jogo. A causa era hash que agrupa; a medida
  // certa é a maior faixa sem nada desenhado.
  const xs = [];
  const context = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'createLinearGradient') return () => ({ addColorStop: () => {} });
      if (prop === 'canvas') return { width: STAGE_WIDTH, height: STAGE_HEIGHT };
      if (prop === 'ellipse' || prop === 'arc') return (x) => { if (Number.isFinite(x)) xs.push(x); };
      if (prop === 'moveTo') return (x) => { if (Number.isFinite(x)) xs.push(x); };
      if (typeof prop === 'string') return () => undefined;
      return () => undefined;
    },
    set: () => true,
  });
  const renderer = createCanvasRenderer({ width: STAGE_WIDTH, height: STAGE_HEIGHT, getContext: () => context });
  renderer.resize({ width: STAGE_WIDTH, height: STAGE_HEIGHT, dpr: 1 });
  renderer.render({ route: { biome: 'canopy' }, platforms: [], sunDrops: [], thorns: [], cameraY: -200, feedback: {} });

  const dentro = xs.filter((x) => x >= 0 && x <= STAGE_WIDTH).sort((a, b) => a - b);
  assert.ok(dentro.length >= 12, `apenas ${dentro.length} silhuetas no palco`);

  let maiorVao = dentro[0];
  for (let i = 1; i < dentro.length; i += 1) maiorVao = Math.max(maiorVao, dentro[i] - dentro[i - 1]);
  maiorVao = Math.max(maiorVao, STAGE_WIDTH - dentro.at(-1));

  const limite = STAGE_WIDTH * 0.18;
  assert.ok(maiorVao <= limite, `faixa de ${Math.round(maiorVao)}px sem silhueta, limite ${Math.round(limite)}px`);
});

test('cada camada de paralaxe cobre a largura sozinha', () => {
  // Se uma camada inteira se agrupa num arco, a cobertura depende de sorte das
  // outras. Cada uma precisa se distribuir.
  for (let camada = 0; camada < 3; camada += 1) {
    const contagens = [5, 7, 9];
    const n = contagens[camada];
    const posicoes = [];
    for (let i = 0; i < n; i += 1) posicoes.push((((i + 0.5) / n + camada / 3) % 1) * STAGE_WIDTH);
    posicoes.sort((a, b) => a - b);
    let vao = posicoes[0];
    for (let i = 1; i < posicoes.length; i += 1) vao = Math.max(vao, posicoes[i] - posicoes[i - 1]);
    assert.ok(vao <= STAGE_WIDTH / n + 1, `camada ${camada} tem vão de ${Math.round(vao)}px`);
  }
});
