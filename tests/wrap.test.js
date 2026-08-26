import test from 'node:test';
import assert from 'node:assert/strict';

import { wrapX, wrappedDistance, playerGhosts, stepPlayer, createPlayer, rectsOverlap, PLAYER_MAX_SPEED } from '../src/game/player.js';
import { stepRun } from '../src/game/simulation.js';

const STAGE = 360;
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
  assert.equal(wrappedDistance(20, 340, STAGE), 40);
  assert.equal(wrappedDistance(160, 200, STAGE), 40, 'no meio o caminho direto vence');
  assert.equal(wrappedDistance(0, 180, STAGE), 180, 'lados opostos empatam');
});

test('atravessando a borda Pip existe dos dois lados', () => {
  assert.deepEqual(playerGhosts({ x: 180, width: WIDTH }, STAGE).map((g) => g.x), [180]);
  assert.deepEqual(playerGhosts({ x: -13, width: WIDTH }, STAGE).map((g) => g.x), [-13, 347]);
  assert.deepEqual(playerGhosts({ x: 350, width: WIDTH }, STAGE).map((g) => g.x), [350, -10]);
});

test('a cópia da borda colide, não é só desenho', () => {
  // Envoltória que aparece mas não colide é injustiça pior que a parede.
  const player = { x: -13, y: 100, width: WIDTH, height: 34 };
  const folhaNaOutraBorda = { x: 340, y: 100, width: 20, height: 18 };
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
    platforms: [{ x: 336, y: 120, width: 24, height: 18, kind: 'leaf' }],
    thorns: [],
    sunDrops: [],
  };
  const result = stepRun(run, {}, 0.2);
  assert.ok(result.events.includes('landed'), 'a folha na borda oposta precisa segurar Pip');
});
