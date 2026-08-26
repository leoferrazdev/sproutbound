import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRouteResult,
  createDefaultProgress,
  countRoutesCleared,
  getCurrentRoute,
  getMilestone,
  getRouteState,
  getUnlockedRoutes,
  getVisualTier,
  isRouteUnlocked,
  migrateProgress,
  selectRoute,
} from '../src/game/progression.js';
import { getRoute, getRoutes } from '../src/game/campaign.js';
import { createSafeStorage } from '../src/storage.js';

const clear = (progress, order, extra = {}) => applyRouteResult(progress, {
  routeId: getRoute(order).id,
  cleared: true,
  objectiveMet: false,
  seconds: 20,
  drops: 5,
  height: getRoute(order).height,
  ...extra,
}).progress;

test('os marcos cosméticos passam a acompanhar rotas concluídas, não metros', () => {
  const first = getMilestone(0);
  assert.equal(first.id, 'bud');
  assert.equal(first.routesCleared, 1);
  assert.equal(getMilestone(1).id, 'bloom');
  assert.equal(getMilestone(12).id, 'summit-crown');
  assert.equal(getMilestone(25), null, 'depois da última rota não há próximo marco');
});

test('nenhum marco dispara antes de concluir uma rota', () => {
  const progress = createDefaultProgress();
  assert.deepEqual(progress.unlocked, []);
  assert.equal(getVisualTier(progress).id, 'seed');
  const afterFirst = applyRouteResult(progress, { routeId: 'canopy-1', cleared: true, seconds: 12, drops: 4 });
  assert.deepEqual(afterFirst.unlocked, ['bud']);
});

test('concluir uma rota libera a seguinte e apenas ela', () => {
  const progress = clear(createDefaultProgress(), 1);
  const unlocked = getUnlockedRoutes(progress).map((route) => route.id);
  assert.deepEqual(unlocked, ['canopy-1', 'canopy-2']);
  assert.equal(isRouteUnlocked(progress, getRoute(3)), false);
});

test('alcançar o topo conclui a rota mesmo sem cumprir o objetivo', () => {
  const progress = applyRouteResult(createDefaultProgress(), {
    routeId: 'canopy-2', cleared: true, objectiveMet: false, seconds: 30, drops: 1,
  }).progress;
  const state = getRouteState(progress, 'canopy-2');
  assert.equal(state.cleared, true, 'o objetivo não pode travar a progressão');
  assert.equal(state.objectiveMet, false);
});

test('o melhor tempo e o maior número de gotas são preservados', () => {
  let progress = clear(createDefaultProgress(), 1, { seconds: 30, drops: 4 });
  progress = clear(progress, 1, { seconds: 18, drops: 2 });
  progress = clear(progress, 1, { seconds: 44, drops: 9 });
  const state = getRouteState(progress, 'canopy-1');
  assert.equal(state.bestSeconds, 18);
  assert.equal(state.bestDrops, 9);
});

test('o objetivo cumprido uma vez nunca é perdido', () => {
  let progress = clear(createDefaultProgress(), 1, { objectiveMet: true });
  progress = clear(progress, 1, { objectiveMet: false });
  assert.equal(getRouteState(progress, 'canopy-1').objectiveMet, true);
});

test('a rota atual avança sozinha ao concluir', () => {
  const progress = clear(createDefaultProgress(), 1);
  assert.equal(getCurrentRoute(progress).id, 'canopy-2');
});

test('selecionar rota respeita o desbloqueio', () => {
  const progress = clear(createDefaultProgress(), 1);
  assert.equal(selectRoute(progress, 'canopy-2').currentRoute, 'canopy-2');
  assert.equal(selectRoute(progress, 'summit-5').currentRoute, 'canopy-2', 'rota bloqueada não pode ser escolhida');
});

test('concluir a campanha inteira libera o último marco', () => {
  let progress = createDefaultProgress();
  for (const route of getRoutes()) progress = clear(progress, route.order);
  assert.equal(countRoutesCleared(progress), 25);
  assert.ok(progress.unlocked.includes('summit-crown'));
  assert.equal(getVisualTier(progress).id, 'summit-crown');
});

test('o progresso da versão anterior é migrado sem perda', () => {
  const legacy = { version: 1, bestHeight: 180, unlocked: ['bud', 'bloom'] };
  const migrated = migrateProgress(legacy);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.bestHeight, 180);
  assert.equal(countRoutesCleared(migrated), 1, 'quem já jogava não recomeça numa tela vazia');
});

test('a persistência lê o formato antigo salvo em disco', () => {
  const memory = new Map([['sproutbound.progress.v1', JSON.stringify({ version: 1, bestHeight: 200, unlocked: ['bud'] })]]);
  const storage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  };
  const loaded = createSafeStorage(storage).load();
  assert.equal(loaded.version, 2);
  assert.equal(loaded.bestHeight, 200);
});

test('a persistência descarta rota inexistente e valor corrompido', () => {
  const payload = {
    version: 2,
    bestHeight: -5,
    unlocked: ['bud', 'inexistente'],
    routes: { 'canopy-1': { cleared: true, bestSeconds: -3, bestDrops: 2.7 }, 'rota-fantasma': { cleared: true } },
    currentRoute: 'rota-fantasma',
  };
  const memory = new Map([['sproutbound.progress.v2', JSON.stringify(payload)]]);
  const storage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: () => {}, removeItem: () => {},
  };
  const loaded = createSafeStorage(storage).load();
  assert.deepEqual(loaded.unlocked, ['bud']);
  assert.equal(loaded.bestHeight, 0);
  assert.equal(loaded.routes['rota-fantasma'], undefined);
  assert.equal(loaded.routes['canopy-1'].bestSeconds, null);
  assert.equal(loaded.routes['canopy-1'].bestDrops, 2);
  assert.equal(loaded.currentRoute, 'canopy-1');
});

test('malformed persisted data falls back to a valid default', () => {
  const storage = { getItem: () => '{broken', setItem: () => {}, removeItem: () => {} };
  assert.deepEqual(createSafeStorage(storage).load(), createDefaultProgress());
});

test('storage failures never escape the safe adapter', () => {
  const storage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); },
  };
  const safe = createSafeStorage(storage);

  assert.doesNotThrow(() => safe.load());
  assert.equal(safe.save(createDefaultProgress()), false);
  assert.equal(safe.clear(), false);
});
