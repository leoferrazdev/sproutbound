import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  createBiomeTransition, startBiomeTransition, stepBiomeTransition,
  isTransitioning, transitionProgress, resolveBiomePalette, blendBiomes, TRANSITION_SECONDS,
} from '../src/game/biome-transition.js';
import { BIOMES, getBiome } from '../src/game/campaign.js';

const hex = (v) => [0, 2, 4].map((i) => parseInt(String(v).replace('#', '').slice(i, i + 2), 16));

test('trocar para o mesmo bioma não inicia transição', () => {
  const estado = startBiomeTransition(createBiomeTransition('dusk'), 'dusk');
  assert.equal(isTransitioning(estado), false);
  assert.equal(estado.remaining, 0);
});

test('a primeira rota não transiciona a partir do nada', () => {
  const estado = startBiomeTransition(createBiomeTransition(null), 'canopy');
  assert.equal(isTransitioning(estado), false, 'abrir o jogo não pode começar com um fade');
  assert.equal(estado.to, 'canopy');
});

test('a transição avança pelo dt e termina exatamente no fim', () => {
  let estado = startBiomeTransition(createBiomeTransition('canopy'), 'crystal');
  assert.equal(transitionProgress(estado), 0);
  estado = stepBiomeTransition(estado, TRANSITION_SECONDS / 2);
  assert.ok(Math.abs(transitionProgress(estado) - 0.5) < 1e-9);
  estado = stepBiomeTransition(estado, TRANSITION_SECONDS);
  assert.equal(isTransitioning(estado), false);
  assert.equal(estado.remaining, 0, 'não pode ficar negativo');
});

test('a paleta caminha de um bioma ao outro sem saltar', () => {
  const de = getBiome('canopy');
  const para = getBiome('crystal');
  let anterior = hex(de.leaf);
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const atual = hex(blendBiomes('canopy', 'crystal', Math.min(1, t)).leaf);
    for (let canal = 0; canal < 3; canal += 1) {
      assert.ok(Math.abs(atual[canal] - anterior[canal]) <= 24, `salto de cor no passo ${t.toFixed(2)}`);
    }
    anterior = atual;
  }
  assert.deepEqual(hex(blendBiomes('canopy', 'crystal', 0).leaf), hex(de.leaf));
  assert.deepEqual(hex(blendBiomes('canopy', 'crystal', 1).leaf), hex(para.leaf));
});

test('todo token de cor do bioma participa da transição', () => {
  const meio = blendBiomes('canopy', 'summit', 0.5);
  const de = getBiome('canopy');
  const para = getBiome('summit');
  const parados = [];
  for (const [chave, valor] of Object.entries(de)) {
    if (typeof valor !== 'string' || !valor.startsWith('#')) continue;
    if (de[chave] === para[chave]) continue;
    if (meio[chave] === de[chave] || meio[chave] === para[chave]) parados.push(chave);
  }
  assert.deepEqual(parados, [], `tokens que não interpolam: ${parados.join(', ')}`);
  // o céu é um par, e também precisa caminhar
  assert.notEqual(meio.sky[0], de.sky[0]);
  assert.notEqual(meio.sky[1], para.sky[1]);
});

test('a silhueta é forma, não cor: troca no meio do caminho', () => {
  assert.equal(blendBiomes('canopy', 'crystal', 0.2).silhouetteKind, getBiome('canopy').silhouetteKind);
  assert.equal(blendBiomes('canopy', 'crystal', 0.8).silhouetteKind, getBiome('crystal').silhouetteKind);
});

test('trocar de rota no meio de uma transição parte do estado atual', () => {
  let estado = startBiomeTransition(createBiomeTransition('canopy'), 'crystal');
  estado = stepBiomeTransition(estado, TRANSITION_SECONDS * 0.4);
  const trocado = startBiomeTransition(estado, 'storm');
  assert.equal(trocado.from, 'crystal', 'não pode saltar de volta para o bioma anterior');
  assert.equal(trocado.to, 'storm');
});

test('a troca instantânea existe para quem pede menos animação', () => {
  const estado = startBiomeTransition(createBiomeTransition('canopy'), 'storm', { instant: true });
  assert.equal(isTransitioning(estado), false);
  assert.equal(estado.to, 'storm');
  const fonte = new URL('../src/app.js', import.meta.url);
  return readFile(fonte, 'utf8').then((s) => {
    assert.match(s, /prefers-reduced-motion: reduce/);
    assert.match(s, /instant: semAnimacao\(\)/);
  });
});

test('sem estado de transição o renderer continua usando o bioma da rota', () => {
  for (const id of Object.keys(BIOMES)) {
    assert.equal(resolveBiomePalette(null, id).id, id);
    assert.equal(resolveBiomePalette({ from: id, to: id, remaining: 0 }, id).id, id);
  }
});

test('bioma desconhecido na transição não quebra', () => {
  assert.doesNotThrow(() => blendBiomes('inexistente', 'crystal', 0.5));
  assert.doesNotThrow(() => resolveBiomePalette({ from: 'x', to: 'y', remaining: 0.4 }, 'canopy'));
  assert.doesNotThrow(() => stepBiomeTransition(undefined, 0.1));
});
