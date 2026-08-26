import { createTranslator, milestoneLabel, objectiveText, routeLabel } from '../i18n.js';

export function createScreens(root, actions = {}) {
  const translator = actions.translator ?? createTranslator();
  const ready = root.querySelector('#ready-screen');
  const gameOver = root.querySelector('#game-over-screen');
  const endingEyebrow = root.querySelector('#ending-eyebrow');
  const endingTitle = root.querySelector('#ending-title');
  const endingMessage = root.querySelector('#ending-message');
  const finalHeight = root.querySelector('#final-height');
  const nextUnlock = root.querySelector('#next-unlock');
  const restart = root.querySelector('#restart-button');
  const complete = root.querySelector('#complete-screen');
  const completeRoute = root.querySelector('#complete-route');
  const completeGoal = root.querySelector('#complete-goal');
  const completeStats = root.querySelector('#complete-stats');
  const completeNext = root.querySelector('#complete-next');
  const completeAdvance = root.querySelector('#complete-advance');
  const completeRetry = root.querySelector('#complete-retry');
  const completeEyebrow = root.querySelector('#complete-eyebrow');
  const completeTitle = root.querySelector('#complete-title');

  if (complete) complete.setAttribute('aria-label', translator.t('complete.eyebrow'));
  if (completeEyebrow) completeEyebrow.textContent = translator.t('complete.eyebrow');
  if (completeTitle) completeTitle.textContent = translator.t('complete.title');
  if (completeAdvance) completeAdvance.textContent = translator.t('complete.advance');
  if (completeRetry) completeRetry.textContent = translator.t('complete.retry');
  completeAdvance?.addEventListener('click', () => actions.onAdvance?.());
  completeRetry?.addEventListener('click', () => actions.onRestart?.());

  const readyEyebrow = ready?.querySelector('.eyebrow');
  const readyTitle = ready?.querySelector('h1');
  const readyInstructions = ready?.querySelector('p:not(.eyebrow)');
  if (ready) ready.setAttribute('aria-label', translator.t('ready.label'));
  if (readyEyebrow) readyEyebrow.textContent = translator.t('ready.eyebrow');
  if (readyTitle) readyTitle.textContent = translator.t('ready.title');
  if (readyInstructions) readyInstructions.textContent = translator.t('ready.instructions');
  if (gameOver) gameOver.setAttribute('aria-label', translator.t('gameOver.label'));
  if (restart) restart.textContent = translator.t('restart');

  restart?.addEventListener('click', () => actions.onRestart?.());

  const hideAll = () => {
    ready.hidden = true;
    gameOver.hidden = true;
    if (complete) complete.hidden = true;
  };
  const showReady = () => {
    hideAll();
    ready.hidden = false;
  };
  const showPlaying = () => {
    hideAll();
  };
  const showGameOver = (run) => {
    hideAll();
    gameOver.hidden = false;
    endingEyebrow.textContent = translator.t('gameOver.eyebrow');
    endingTitle.textContent = translator.t('gameOver.title');
    endingMessage.textContent = translator.t('gameOver.message');
    finalHeight.textContent = translator.t('gameOver.heightRecord', { height: run.score ?? 0, record: run.bestScore ?? 0 });
    nextUnlock.textContent = run.nextUnlock
      ? translator.t('gameOver.next', { label: milestoneLabel(translator, run.nextUnlock) })
      : translator.t('gameOver.allUnlocked');
  };
  // Conclusão de rota: tempo, gotas, objetivo e o que foi liberado. A rota é
  // concluída ao alcançar o topo mesmo sem cumprir o objetivo.
  const showSummit = (run) => {
    hideAll();
    if (!complete) {
      gameOver.hidden = false;
      return;
    }
    complete.hidden = false;
    if (completeRoute) completeRoute.textContent = run.route ? routeLabel(translator, run.route) : '';
    if (completeGoal) {
      const met = Boolean(run.objectiveMet);
      completeGoal.textContent = `${objectiveText(translator, run.route?.objective)} — ${translator.t(met ? 'goal.met' : 'goal.missed')}`;
      completeGoal.dataset.met = String(met);
    }
    if (completeStats) {
      const seconds = Number(run.objective?.seconds ?? 0).toFixed(1);
      completeStats.textContent = `${translator.t('complete.time', { seconds })} · ${translator.t('complete.drops', { value: run.objective?.drops ?? 0 })}`;
    }
    if (completeNext) {
      completeNext.textContent = run.nextRouteLabel
        ? translator.t('complete.nextRoute', { label: run.nextRouteLabel })
        : (run.isLastRoute ? translator.t('complete.lastRoute') : '');
    }
    if (completeAdvance) completeAdvance.hidden = Boolean(run.isLastRoute);
    if (completeRetry) completeRetry.hidden = Boolean(run.objectiveMet);
  };

  return { showReady, showPlaying, showGameOver, showSummit, hideAll };
}
