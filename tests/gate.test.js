import test from 'node:test';
import assert from 'node:assert/strict';

import { runGate, THRESHOLDS, playToExhaustion, worldSignature } from '../tools/check-gate.mjs';
import { getLateralReach, getCarriedReach, getSegmentMaxGap, getRouteSegment, constrainRouteX } from '../src/game/world.js';
import { createFeedbackState, stepFeedback, pulseProgress, PULSE_SECONDS } from '../src/game/feedback.js';

test('o gate reprova enquanto houver item em aberto', () => {
  const results = runGate();
  assert.ok(results.length >= 10, 'o gate precisa cobrir todos os itens do release gate');
  const open = results.filter((r) => !r.ok);
  // Este teste não exige que o gate passe; exige que ele saiba dizer quando não passa.
  for (const result of results) {
    assert.equal(typeof result.ok, 'boolean');
    assert.ok(result.detail && result.detail.length > 0, `${result.id} sem evidência`);
  }
  if (open.length === 0) return;
  assert.ok(open.every((r) => r.detail.length > 0), 'todo item reprovado precisa dizer o porquê');
});

test('o gate exige evidência manual e nunca a presume', () => {
  const manual = runGate().find((r) => r.id === 'MANUAL');
  assert.ok(manual, 'o item de evidência manual precisa existir');
  assert.deepEqual(
    THRESHOLDS.manualItems,
    ['preview-tool', 'console-clean-10min', 'fps-stable-10min', 'desktop-occupancy', 'playtest-five-strangers'],
  );
});

test('o alcance lateral vem da física e não de um número arbitrado', () => {
  const standstill = getLateralReach();
  const carried = getCarriedReach();
  assert.ok(standstill > 0 && Number.isFinite(standstill));
  assert.ok(carried > standstill, 'chegar com velocidade precisa alcançar mais que partir parado');
  assert.ok(carried < 120, 'alcance implausível para as constantes atuais');
});

test('nenhum segmento pede uma correção acima do alcance real', () => {
  for (const altitude of [0, 30, 90, 180, 300]) {
    const segment = getRouteSegment(altitude);
    assert.ok(
      getSegmentMaxGap(segment) <= Math.ceil(getCarriedReach()),
      `segmento ${segment.id} pede ${getSegmentMaxGap(segment)}px, acima do alcance`,
    );
  }
});

test('a rota é puxada para dentro do alcance mesmo com folha móvel', () => {
  const segment = getRouteSegment(200);
  const budget = getSegmentMaxGap(segment);
  const width = 80;
  const placed = constrainRouteX({
    previousCentre: 180,
    candidateX: 340,
    width,
    stageWidth: 360,
    motionRange: 30,
    segment,
  });
  const distance = Math.abs(placed + width / 2 - 180);
  assert.ok(distance <= budget, `distância ${distance} acima do orçamento ${budget}`);
});

test('sementes variadas continuam completáveis', () => {
  const sample = 40;
  const unbeatable = [];
  for (let seed = 1; seed <= sample; seed += 1) {
    if (playToExhaustion({ seed, maxSeconds: 180 }).endState !== 'summit') unbeatable.push(seed);
  }
  assert.ok(
    unbeatable.length / sample <= 1 - THRESHOLDS.minCompletionRate,
    `sementes invencíveis: ${unbeatable.join(', ')}`,
  );
});

test('sementes diferentes produzem mundos diferentes', () => {
  const signatures = new Set([1, 2, 3, 7, 11, 19].map(worldSignature));
  assert.equal(signatures.size, 6);
  assert.equal(worldSignature(7), worldSignature(7), 'a mesma semente continua determinística');
});

test('todo pulso de feedback guarda a origem do evento', () => {
  const player = { x: 100, y: 200, width: 26, height: 34 };
  const state = stepFeedback(
    createFeedbackState(),
    ['collectedSun', 'landed', 'milestoneReached', 'playerDied', 'solarShieldReady'],
    0,
    { player },
  );
  for (const key of Object.keys(PULSE_SECONDS)) {
    assert.ok(state[key] > 0, `pulso ${key} não disparou`);
    assert.ok(state.origins[key], `pulso ${key} sem origem`);
    assert.ok(Number.isFinite(state.origins[key].x) && Number.isFinite(state.origins[key].y));
  }
});

test('a origem some quando o pulso termina', () => {
  const player = { x: 100, y: 200, width: 26, height: 34 };
  const active = stepFeedback(createFeedbackState(), ['collectedSun'], 0, { player });
  assert.ok(active.origins.collect);
  const settled = stepFeedback(active, [], 5, { player });
  assert.equal(settled.collect, 0);
  assert.equal(settled.origins.collect, undefined);
});

test('o progresso do pulso vai de zero a um e é nulo quando inativo', () => {
  const state = stepFeedback(createFeedbackState(), ['collectedSun'], 0, { player: { x: 0, y: 0, width: 26, height: 34 } });
  assert.equal(pulseProgress(state, 'collect'), 0);
  assert.equal(pulseProgress(state, 'death'), null);
  const half = stepFeedback(state, [], PULSE_SECONDS.collect / 2);
  const progress = pulseProgress(half, 'collect');
  assert.ok(progress > 0.4 && progress < 0.6, `progresso inesperado: ${progress}`);
});
