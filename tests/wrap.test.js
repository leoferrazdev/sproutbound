import test from 'node:test';
import assert from 'node:assert/strict';

import { wrapX, wrappedDistance, playerGhosts, stepPlayer, createPlayer, rectsOverlap, PLAYER_MAX_SPEED } from '../src/game/player.js';
import { stepRun } from '../src/game/simulation.js';
import { STAGE_WIDTH } from '../src/game/stage.js';

const STAGE = STAGE_WIDTH;
const WIDTH = 26;

test('sair por uma borda reentra pela outra sem descontinuidade', () => {
  // a referência é o centro: o canônico vai de -width/2 a stageWidth - width/2
  assert.equal(wrapX(-WIDTH / 2 - 1, WIDTH, STAGE), STAGE - WIDTH / 2 - 1);
  assert.equal(wrapX(STAGE - WIDTH / 2, WIDTH, STAGE), -WIDTH / 2);
  for (const x of [0, 100, 180, 333]) assert.equal(wrapX(x, WIDTH, STAGE), x, 'no meio nada muda');
});

test('a envoltória é contínua: nenhum salto entre passos vizinhos', () => {
  let previous = wrapX(-WIDTH, WIDTH, STAGE);
  for (let x = -WIDTH; x < STAGE + WIDTH; x += 1) {
    const current = wrapX(x, WIDTH, STAGE);
    const jump = Math.abs(current - previous);
    assert.ok(jump <= 1 || Math.abs(jump - STAGE) <= 1, `salto de ${jump} em x=${x}`);
    previous = current;
  }
});

test('dar a volta pode ser o caminho curto', () => {
  // expresso em função da largura: o teste continua valendo se o palco mudar
  const perto = 20;
  assert.equal(wrappedDistance(perto, STAGE - perto, STAGE), perto * 2, 'pelas bordas é mais curto');
  assert.equal(wrappedDistance(STAGE / 2 - 20, STAGE / 2 + 20, STAGE), 40, 'no meio o caminho direto vence');
  assert.equal(wrappedDistance(0, STAGE / 2, STAGE), STAGE / 2, 'lados opostos empatam');
});

test('atravessando a borda Pip existe dos dois lados', () => {
  const meio = STAGE / 2;
  assert.deepEqual(playerGhosts({ x: meio, width: WIDTH }, STAGE).map((g) => g.x), [meio], 'no meio há só um');
  const esquerda = -WIDTH / 2;
  assert.deepEqual(
    playerGhosts({ x: esquerda, width: WIDTH }, STAGE).map((g) => g.x),
    [esquerda, esquerda + STAGE],
    'saindo pela esquerda aparece à direita',
  );
  const direita = STAGE - WIDTH / 2;
  assert.deepEqual(
    playerGhosts({ x: direita, width: WIDTH }, STAGE).map((g) => g.x),
    [direita, direita - STAGE],
    'saindo pela direita aparece à esquerda',
  );
});

test('a cópia da borda colide, não é só desenho', () => {
  // Envoltória que aparece mas não colide é injustiça pior que a parede.
  const player = { x: -13, y: 100, width: WIDTH, height: 34 };
  const folhaNaOutraBorda = { x: STAGE - 20, y: 100, width: 20, height: 18 };
  assert.equal(rectsOverlap(player, folhaNaOutraBorda), false, 'a posição crua não alcança');
  assert.ok(
    playerGhosts(player, STAGE).some((ghost) => rectsOverlap(ghost, folhaNaOutraBorda)),
    'a cópia precisa alcançar',
  );
});

test('mover-se para a esquerda a partir da borda leva ao outro lado', () => {
  let player = { ...createPlayer({ x: 4, y: 300 }), vx: -PLAYER_MAX_SPEED };
  for (let frame = 0; frame < 20; frame += 1) {
    player = stepPlayer(player, { left: true }, 1 / 60, { width: STAGE, height: 640 });
  }
  assert.ok(player.x > STAGE / 2, `Pip deveria ter reentrado pela direita, está em ${player.x}`);
});

test('não existe mais parede invisível nas bordas', () => {
  let player = { ...createPlayer({ x: 300, y: 300 }), vx: 0 };
  const posicoes = new Set();
  for (let frame = 0; frame < 240; frame += 1) {
    player = stepPlayer(player, { right: true }, 1 / 60, { width: STAGE, height: 640 });
    posicoes.add(Math.round(player.x));
  }
  // segurando a direita por 4 segundos Pip precisa ter dado a volta
  assert.ok(Math.min(...posicoes) < 40, 'Pip nunca reentrou pela esquerda');
  assert.ok(Math.max(...posicoes) > STAGE - 60, 'Pip nunca chegou perto da borda direita');
});

test('aterrissar continua funcionando com a envoltória ativa', () => {
  const run = {
    state: 'playing',
    score: 0,
    bestScore: 0,
    startY: 400,
    cameraY: 0,
    nextUnlock: null,
    player: { ...createPlayer({ x: -10, y: 80 }), grounded: false, vy: 220 },
    platforms: [{ x: STAGE - 24, y: 120, width: 24, height: 18, kind: 'leaf' }],
    thorns: [],
    sunDrops: [],
  };
  const result = stepRun(run, {}, 0.2);
  assert.ok(result.events.includes('landed'), 'a folha na borda oposta precisa segurar Pip');
});
