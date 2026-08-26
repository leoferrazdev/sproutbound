import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { STAGE_WIDTH, STAGE_HEIGHT, STAGE_RATIO } from '../src/game/stage.js';
import { createRun } from '../src/game/model.js';
import { createWorld } from '../src/game/world.js';
import { wrapX, playerGhosts } from '../src/game/player.js';

const srcPath = (name) => new URL(`../src/${name}`, import.meta.url);

test('as dimensões do palco vêm de um único lugar', async () => {
  // Estavam repetidas em doze arquivos; alargar o jogo exigia acertar todos, e
  // qualquer esquecimento faria física e desenho discordarem em silêncio.
  const arquivos = ['app.js', 'input.js', 'game/simulation.js', 'game/world.js', 'game/model.js', 'game/game-loop.js', 'render/canvas-renderer.js', 'game/player.js'];
  for (const nome of arquivos) {
    const fonte = await readFile(srcPath(nome), 'utf8');
    assert.ok(/from '.*stage\.js'/.test(fonte), `${nome} não importa as dimensões do palco`);
    assert.ok(!/\b360\b/.test(fonte), `${nome} ainda fixa a largura antiga`);
  }
});

test('o palco é mais largo que alto pela metade, para caber no desktop', () => {
  assert.equal(STAGE_WIDTH, 480);
  assert.equal(STAGE_HEIGHT, 640);
  assert.equal(STAGE_RATIO, 0.75);
  assert.ok(STAGE_RATIO > 9 / 16, 'precisa ser mais largo que a proporção anterior');
});

test('o mundo e o jogador acompanham a largura declarada', () => {
  const entidades = createWorld(1, { platformCount: 30 });
  const plataformas = entidades.filter((e) => e.type === 'platform');
  assert.ok(plataformas.every((p) => p.x >= 0 && p.x + p.width <= STAGE_WIDTH), 'plataforma fora do palco');
  assert.equal(wrapX(STAGE_WIDTH, 26, STAGE_WIDTH), 0, 'a envoltória fecha na largura do palco');
  assert.equal(playerGhosts({ x: -5, width: 26 }, STAGE_WIDTH)[1].x, STAGE_WIDTH - 5);
});

test('o jogador nasce dentro do palco em todas as rotas', async () => {
  const { getRoutes } = await import('../src/game/campaign.js');
  for (const rota of getRoutes()) {
    const run = createRun(rota);
    assert.ok(run.player.x >= 0, `${rota.id} nasce à esquerda do palco`);
    assert.ok(run.player.x + run.player.width <= STAGE_WIDTH, `${rota.id} nasce à direita do palco`);
  }
});

test('o canvas do jogo é procurado dentro do palco, não em qualquer lugar', async () => {
  const fonte = await readFile(srcPath('app.js'), 'utf8');
  // O canvas de fundo virou o primeiro filho de #game; um querySelector('canvas')
  // genérico devolvia ele e o jogo desenhava no lugar errado, em silêncio.
  assert.ok(!/gameRoot\.querySelector\('canvas'\)/.test(fonte), 'seleção genérica de canvas volta a pegar o fundo');
  assert.match(fonte, /gameRoot\.querySelector\('#game-canvas'\)/);
});

test('a marcação mantém os dois canvas separados e em camadas próprias', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(html, /id="backdrop-canvas"/);
  assert.match(html, /id="game-canvas"/);
  // o de fundo fica fora do palco, o do jogo dentro
  const posFundo = html.indexOf('backdrop-canvas');
  const posPalco = html.indexOf('stage-shell');
  assert.ok(posFundo < posPalco, 'o canvas de fundo precisa vir antes do palco');
  assert.match(css, /\.backdrop\s*\{[^}]*position:\s*fixed/s);
});
