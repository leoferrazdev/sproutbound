import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createTranslator, objectiveText, biomeLabel, routeLabel } from '../src/i18n.js';
import { getRoutes, OBJECTIVE_TYPES, BIOMES } from '../src/game/campaign.js';

const indexPath = new URL('../index.html', import.meta.url);
const cssPath = new URL('../styles.css', import.meta.url);

test('a marcação expõe seleção de rota, objetivo e conclusão', async () => {
  const html = await readFile(indexPath, 'utf8');
  for (const id of [
    'campaign-screen', 'route-list', 'campaign-progress', 'campaign-close', 'routes-button',
    'route-label', 'goal-banner',
    'complete-screen', 'complete-route', 'complete-goal', 'complete-stats', 'complete-next',
    'complete-advance', 'complete-retry',
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `elemento ausente: ${id}`);
  }
});

test('o painel de rotas cabe no palco e cede a altura à lista', async () => {
  const css = await readFile(cssPath, 'utf8');
  // Sem a linha limitada no grid pai, a área cresce para caber as 25 rotas e o
  // max-height em porcentagem do filho passa a resolver contra ela.
  assert.match(css, /\.screens\s*\{[^}]*grid-template-rows:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /\.campaign-card\s*\{[^}]*max-height/s);
  assert.match(css, /\.campaign-card\s*\{[^}]*minmax\(0, 1fr\)/s);
  assert.match(css, /\.route-list\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.route-list\s*\{[^}]*min-height:\s*0/s);
});

test('os cards de rota têm altura uniforme e alvo de toque adequado', async () => {
  const css = await readFile(cssPath, 'utf8');
  const minHeight = css.match(/\.route-card\s*\{[^}]*min-height:\s*(\d+)px/s);
  assert.ok(minHeight, 'o card precisa declarar altura mínima');
  assert.ok(Number(minHeight[1]) >= 44, 'alvo de toque abaixo do mínimo');
  // objetivo curto e longo precisam produzir o mesmo card
  assert.match(css, /\.route-goal\s*\{[^}]*line-clamp:\s*2/s);
  assert.match(css, /\.route-goal\s*\{[^}]*min-height/s);
  assert.match(css, /\.route-best\s*\{[^}]*min-height/s);
  assert.match(css, /\.route-card:focus-visible/);
});

test('todo tipo de objetivo tem texto nos dois idiomas', () => {
  for (const locale of ['en', 'pt']) {
    const translator = createTranslator(locale);
    for (const type of OBJECTIVE_TYPES) {
      const text = objectiveText(translator, { type, value: 7 });
      assert.ok(text && !text.startsWith('goal.'), `${locale}/${type} sem tradução`);
      assert.ok(!text.includes('{'), `${locale}/${type} deixou marcador sem substituir: ${text}`);
    }
  }
});

test('todo bioma tem nome nos dois idiomas e nenhum repete', () => {
  for (const locale of ['en', 'pt']) {
    const translator = createTranslator(locale);
    const names = Object.keys(BIOMES).map((id) => biomeLabel(translator, id));
    for (const name of names) assert.ok(name && !name.startsWith('biome.'), `${locale} sem nome de bioma`);
    assert.equal(new Set(names).size, names.length, `${locale} repete nome de bioma`);
  }
});

test('o rótulo da rota combina ordem e bioma sem marcador solto', () => {
  for (const locale of ['en', 'pt']) {
    const translator = createTranslator(locale);
    for (const route of getRoutes()) {
      const label = routeLabel(translator, route);
      assert.ok(label.includes(String(route.order)), `${locale}/${route.id} sem a ordem`);
      assert.ok(!label.includes('{'), `${locale}/${route.id} com marcador solto: ${label}`);
    }
  }
  assert.equal(routeLabel(createTranslator('en'), null), '');
});

test('as telas da campanha estão traduzidas nos dois idiomas', () => {
  const chaves = [
    'campaign.title', 'campaign.progress', 'campaign.locked', 'campaign.close', 'campaign.best',
    'complete.eyebrow', 'complete.title', 'complete.time', 'complete.drops',
    'complete.nextRoute', 'complete.lastRoute', 'complete.advance', 'complete.retry',
    'goal.met', 'goal.missed', 'goal.banner', 'goal.progress',
  ];
  for (const locale of ['en', 'pt']) {
    const translator = createTranslator(locale);
    for (const chave of chaves) {
      const texto = translator.t(chave, { cleared: 1, total: 25, stars: 0, seconds: 12, value: 3, current: 1, target: 4, text: 'x', label: 'y' });
      assert.notEqual(texto, chave, `${locale} sem tradução para ${chave}`);
      assert.ok(!texto.includes('{'), `${locale}/${chave} deixou marcador solto: ${texto}`);
    }
  }
});

test('o texto de conclusão não depende de concordância de gênero', () => {
  // "{biome} conquistado" não concorda com bioma feminino em português; o nome do
  // bioma passou a ser elemento próprio em vez de complemento da frase.
  for (const locale of ['en', 'pt']) {
    const title = createTranslator(locale).t('complete.title');
    assert.ok(!title.includes('{biome}'), `${locale} ainda interpola o bioma no título`);
  }
});
