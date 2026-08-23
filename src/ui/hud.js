import { createTranslator, milestoneLabel } from '../i18n.js';

export function createHud(root, translator = createTranslator()) {
  const heightValue = root.querySelector('#height-value');
  const recordValue = root.querySelector('#record-value');
  const objective = root.querySelector('#objective');
  const sunCounter = root.querySelector('#sun-counter');
  const pauseState = root.querySelector('#pause-state');
  const statLabels = root.querySelectorAll('.hud-stat span');

  if (statLabels[0]) statLabels[0].textContent = translator.t('hud.height');
  if (statLabels[1]) statLabels[1].textContent = translator.t('hud.record');
  root.querySelector('.hud-stat')?.setAttribute('aria-label', translator.t('hud.height'));
  root.querySelectorAll('.hud-stat')[1]?.setAttribute('aria-label', translator.t('hud.record'));
  sunCounter?.setAttribute('aria-label', translator.t('hud.solar'));

  const update = (run) => {
    const height = Math.max(0, run.score ?? 0);
    heightValue.textContent = translator.t('hud.heightValue', { value: height });
    recordValue.textContent = translator.t('hud.heightValue', { value: Math.max(height, run.bestScore ?? 0) });
    if (sunCounter) sunCounter.textContent = translator.t('hud.solarValue', { value: Math.max(0, run.sunCount ?? 0) });
    if (run.state === 'playing') pauseState.textContent = translator.t('hud.playing');
    if (run.state === 'ready') pauseState.textContent = translator.t('hud.ready');
    if (run.state === 'summit') pauseState.textContent = translator.t('hud.summit');
  };
  const showObjective = (text) => {
    objective.textContent = text;
  };
  const showRecord = (record) => {
    recordValue.textContent = translator.t('hud.heightValue', { value: Math.max(0, record) });
  };

  const showNextObjective = (milestone) => {
    showObjective(translator.t('objective.next', { label: milestoneLabel(translator, milestone) }));
  };

  return { update, showObjective, showNextObjective, showRecord };
}
