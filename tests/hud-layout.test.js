import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { BIOMES } from '../src/game/campaign.js';

const cssPath = new URL('../styles.css', import.meta.url);
const htmlPath = new URL('../index.html', import.meta.url);

const hex = (h) => { const v = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)); };
const canal = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const luminancia = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
const contraste = (a, b) => {
  const [alto, baixo] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (alto + 0.05) / (baixo + 0.05);
};
const compor = (frente, alpha, fundo) => frente.map((c, i) => c * alpha + fundo[i] * (1 - alpha));

test('os controles ficam no fluxo, nunca posicionados sobre os indicadores', async () => {
  const css = await readFile(cssPath, 'utf8');
  const bloco = css.match(/\.hud-actions\s*\{([^}]*)\}/s)[1];
  // A causa da sobreposição era position:absolute sobre a célula que o grid já
  // dava ao bloco RECORDE. Fora do fluxo, o layout não sabia que existiam.
  assert.ok(!/position:\s*(absolute|fixed)/.test(bloco), 'os controles voltaram a sair do fluxo');
  assert.match(bloco, /display:\s*flex/);
  assert.match(bloco, /flex-wrap:\s*wrap/, 'sem quebra controlada os controles espremem os indicadores');
});

test('o HUD organiza linhas em fluxo com espaçamento consistente', async () => {
  const css = await readFile(cssPath, 'utf8');
  const hud = css.match(/^\.hud\s*\{([^}]*)\}/ms)[1];
  assert.match(hud, /display:\s*flex/);
  assert.match(hud, /flex-direction:\s*column/);
  assert.match(hud, /gap:\s*var\(--hud-gap\)/);
  assert.match(css, /\.hud-row\s*\{[^}]*flex-wrap:\s*wrap/s);
});

test('a marcação separa estatísticas de controles em containers próprios', async () => {
  const html = await readFile(htmlPath, 'utf8');
  assert.match(html, /class="hud-row hud-row-top"/);
  assert.match(html, /class="hud-stats"/);
  // por posição: ambos precisam ficar entre a abertura da linha de topo e a
  // abertura da linha seguinte
  const iTopo = html.indexOf('hud-row-top');
  const iProxima = html.indexOf('hud-row-context');
  const iStats = html.indexOf('hud-stats');
  const iAcoes = html.indexOf('hud-actions');
  assert.ok(iTopo >= 0 && iProxima > iTopo, 'linhas do HUD fora de ordem');
  assert.ok(iStats > iTopo && iStats < iProxima, 'estatísticas fora da linha de topo');
  assert.ok(iAcoes > iTopo && iAcoes < iProxima, 'controles fora da linha de topo');
});

test('os breakpoints do HUD reagem ao palco, não à janela', async () => {
  const css = await readFile(cssPath, 'utf8');
  // O palco é min(100vw, 75svh): numa janela larga e baixa ele fica estreito, e
  // uma media query de viewport concluiria o oposto.
  assert.match(css, /container-type:\s*inline-size/);
  assert.match(css, /container-name:\s*stage/);
  const consultas = [...css.matchAll(/@container stage \(([^)]+)\)/g)].map((m) => m[1]);
  assert.ok(consultas.length >= 3, `apenas ${consultas.length} breakpoints de container`);
  assert.ok(consultas.some((c) => /max-height/.test(c)), 'falta breakpoint para palco baixo');
});

test('os controles mantêm o alvo de toque em qualquer largura', async () => {
  const css = await readFile(cssPath, 'utf8');
  assert.match(css, /--hud-control-min:\s*44px/);
  assert.match(css, /\.hud-actions \.hud-button\s*\{[^}]*min-height:\s*var\(--hud-control-min\)/s);
  // nenhum breakpoint pode reduzir a altura mínima
  for (const bloco of css.match(/@container stage[^{]*\{[\s\S]*?\n\}/g) ?? []) {
    assert.ok(!/--hud-control-min:\s*(?:[0-3]?\d)px/.test(bloco), 'um breakpoint reduziu o alvo abaixo de 44px');
  }
});

test('todo indicador do HUD tem a mesma superfície própria', async () => {
  const html = await readFile(htmlPath, 'utf8');
  const css = await readFile(cssPath, 'utf8');
  // O contador solar era o único sem fundo: por isso sumia sobre biomas claros.
  for (const id of ['record-value', 'height-value', 'goal-banner', 'objective', 'solar-counter']) {
    const marca = html.match(new RegExp(`[^>]*id="${id}"[^>]*`))?.[0]
      ?? html.match(new RegExp(`<div[^>]*>\s*<span[^>]*>[^<]*</span>\s*<strong id="${id}"`))?.[0];
    assert.ok(marca, `elemento ${id} não encontrado`);
  }
  assert.match(css, /\.hud-chip\s*\{[^}]*background:\s*var\(--hud-surface\)/s);
  const chips = (html.match(/hud-chip/g) ?? []).length;
  assert.ok(chips >= 5, `apenas ${chips} indicadores usam a superfície padrão`);
});

test('o contador solar é legível sobre a cor mais clara de todo bioma', async () => {
  const css = await readFile(cssPath, 'utf8');
  const superficie = css.match(/--hud-surface:\s*rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)%\)/);
  assert.ok(superficie, 'a superfície do HUD precisa ser um token');
  const surf = [Number(superficie[1]), Number(superficie[2]), Number(superficie[3])];
  const alpha = Number(superficie[4]) / 100;
  const texto = hex('#ffd166');

  for (const bioma of Object.values(BIOMES)) {
    const claras = [bioma.leaf, bioma.leafEdge, bioma.moving, bioma.movingEdge, bioma.sun, bioma.sunEdge].map(hex);
    const pior = claras.reduce((a, c) => (luminancia(c) > luminancia(a) ? c : a));
    const chip = compor(surf, alpha, pior);
    const razao = contraste(texto, chip);
    assert.ok(razao >= 4.5, `${bioma.id}: contraste ${razao.toFixed(2)}:1 sobre a cor mais clara`);
  }
});

test('a sombra do texto define a borda em vez de repetir a cor do texto', async () => {
  const css = await readFile(cssPath, 'utf8');
  const bloco = css.match(/\.sun-counter\s*\{([^}]*)\}/s)[1];
  // Era `text-shadow: 0 1px 12px rgb(255 209 102 / 45%)`: âmbar sobre âmbar,
  // mesma matiz do texto, então adicionava brilho e nenhum contraste.
  assert.ok(!/text-shadow:[^;]*255 209 102/.test(bloco), 'a sombra voltou a usar a cor do próprio texto');
  assert.match(bloco, /text-shadow:[^;]*rgb\(3 10 18/, 'a sombra precisa ser escura');
  assert.match(bloco, /font-size:\s*var\(--hud-label\)/);
});

test('nenhum texto do HUD fica abaixo de 12px', async () => {
  const css = await readFile(cssPath, 'utf8');
  assert.match(css, /--hud-label:\s*12px/);
  for (const bloco of css.match(/@container stage[^{]*\{[\s\S]*?\n\}/g) ?? []) {
    const menores = [...bloco.matchAll(/--hud-label:\s*(\d+)px/g)].map((m) => Number(m[1])).filter((v) => v < 12);
    assert.deepEqual(menores, [], `um breakpoint reduziu o rótulo para ${menores.join(', ')}px`);
  }
});
