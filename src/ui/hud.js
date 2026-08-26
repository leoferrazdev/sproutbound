import { createTranslator, milestoneLabel, objectiveText, routeLabel } from '../i18n.js';

export function createHud(root, translator = createTranslator()) {
  const heightValue = root.querySelector('#height-value');
  const recordValue = root.querySelector('#record-value');
  const objective = root.querySelector('#objective');
  const sunCounter = root.querySelector('#solar-counter');
  const pauseState = root.querySelector('#pause-state');
  const routeLabelEl = root.querySelector('#route-label');
  const goalBanner = root.querySelector('#goal-banner');
  const statLabels = root.querySelectorAll('.hud-stat span');

  if (statLabels[0]) statLabels[0].textContent = translator.t('hud.height');
  if (statLabels[1]) statLabels[1].textContent = translator.t('hud.record');
  root.querySelector('.hud-stat')?.setAttribute('aria-label', translator.t('hud.height'));
  root.querySelectorAll('.hud-stat')[1]?.setAttribute('aria-label', translator.t('hud.record'));
  sunCounter?.setAttribute('aria-label', translator.t('hud.solar'));

  const update = (run) => {
    const height = Math.max(0, run.score ?? 0);
    const solar = run.solar ?? {
      collected: Math.max(0, run.sunCount ?? 0),
      charge: Math.max(0, (run.sunCount ?? 0) % 5),
      shieldAvailable: false,
    };
    heightValue.textContent = translator.t('hud.heightValue', { value: height });
    recordValue.textContent = translator.t('hud.heightValue', { value: Math.max(height, run.bestScore ?? 0) });
    if (sunCounter) {
      sunCounter.textContent = solar.shieldAvailable
        ? translator.t('hud.shieldReady')
        : `${translator.t('hud.solarValue', { value: Math.max(0, solar.collected ?? 0) })} · ${translator.t('hud.solarCharge', { value: solar.charge ?? 0, max: 5 })}`;
    }
    // O objetivo da rota fica visível durante a partida, com progresso quando ele
    // é contável. Objetivo invisível é o mesmo defeito que a auditoria apontou.
    if (routeLabelEl) routeLabelEl.textContent = run.route ? routeLabel(translator, run.route) : '';
    if (goalBanner && run.route) {
      const objective = run.route.objective ?? { type: 'reach' };
      const tracker = run.objective ?? {};
      let text = objectiveText(translator, objective);
      if (objective.type === 'collect' && Number.isFinite(objective.value)) {
        text += ` · ${translator.t('goal.progress', { current: tracker.drops ?? 0, target: objective.value })}`;
      }
      if (objective.type === 'swift' && Number.isFinite(objective.value)) {
        text += ` · ${Math.max(0, objective.value - (tracker.seconds ?? 0)).toFixed(0)}s`;
      }
      goalBanner.textContent = translator.t('goal.banner', { text });
      goalBanner.dataset.failed = String(
        (objective.type === 'flawless' && (tracker.thornHits ?? 0) > 0)
        || (objective.type === 'frugal' && Boolean(tracker.shieldUsed))
        || (objective.type === 'swift' && Number.isFinite(objective.value) && (tracker.seconds ?? 0) > objective.value),
      );
    }
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
