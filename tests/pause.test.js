import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldPause, shouldResume, nextPauseState, nextPauseStateFromFocusLoss, PAUSE_TRIGGERS } from '../src/game/pause.js';

test('só pausa uma partida em andamento', () => {
  for (const runState of ['ready', 'gameOver', 'summit', undefined]) {
    assert.equal(shouldPause({ runState }), false, `pausou em ${runState}`);
  }
  assert.equal(shouldPause({ runState: 'playing' }), true);
});

test('nunca pausa duas vezes nem por cima da seleção de rota', () => {
  assert.equal(shouldPause({ runState: 'playing', paused: true }), false);
  assert.equal(shouldPause({ runState: 'playing', campaignOpen: true }), false);
});

test('todo gatilho declarado pausa, e nenhum outro', () => {
  for (const trigger of PAUSE_TRIGGERS) {
    assert.equal(shouldPause({ runState: 'playing', trigger }), true, `gatilho ${trigger} não pausa`);
  }
  assert.equal(shouldPause({ runState: 'playing', trigger: 'escape' }), false, 'Escape é reservado pela plataforma');
  assert.equal(shouldPause({ runState: 'playing', trigger: 'qualquer' }), false);
});

test('retomar exige estar pausado e sem seleção de rota aberta', () => {
  assert.equal(shouldResume({ paused: true }), true);
  assert.equal(shouldResume({ paused: false }), false);
  assert.equal(shouldResume({ paused: true, campaignOpen: true }), false);
});

test('o botão alterna entre pausar e retomar', () => {
  const jogando = { runState: 'playing', paused: false, campaignOpen: false };
  const pausado = nextPauseState(jogando);
  assert.deepEqual(pausado, { paused: true, action: 'pause' });
  const retomado = nextPauseState({ ...jogando, paused: true });
  assert.deepEqual(retomado, { paused: false, action: 'resume' });
});

test('alternar fora de jogo não faz nada', () => {
  assert.deepEqual(nextPauseState({ runState: 'ready', paused: false }), { paused: false, action: 'none' });
  assert.deepEqual(nextPauseState({ runState: 'gameOver', paused: false }), { paused: false, action: 'none' });
});

test('perder o foco pausa mas nunca retoma sozinho', () => {
  assert.deepEqual(
    nextPauseStateFromFocusLoss({ runState: 'playing', paused: false }),
    { paused: true, action: 'pause' },
  );
  // já pausado, perder o foco de novo não pode retomar
  assert.deepEqual(
    nextPauseStateFromFocusLoss({ runState: 'playing', paused: true }),
    { paused: true, action: 'none' },
  );
});

test('trocar de aba durante a subida não custa a rodada', () => {
  // Era este o defeito: visibilitychange limpava o input e a partida seguia.
  const durante = { runState: 'playing', paused: false, campaignOpen: false };
  assert.equal(nextPauseStateFromFocusLoss(durante).action, 'pause');
  assert.equal(shouldResume({ paused: true, campaignOpen: false }), true, 'e é possível voltar');
});
