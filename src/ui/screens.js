import { createTranslator, milestoneLabel } from '../i18n.js';

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

  const showReady = () => {
    ready.hidden = false;
    gameOver.hidden = true;
  };
  const showPlaying = () => {
    ready.hidden = true;
    gameOver.hidden = true;
  };
  const showGameOver = (run) => {
    ready.hidden = true;
    gameOver.hidden = false;
    endingEyebrow.textContent = translator.t('gameOver.eyebrow');
    endingTitle.textContent = translator.t('gameOver.title');
    endingMessage.textContent = translator.t('gameOver.message');
    finalHeight.textContent = translator.t('gameOver.heightRecord', { height: run.score ?? 0, record: run.bestScore ?? 0 });
    nextUnlock.textContent = run.nextUnlock
      ? translator.t('gameOver.next', { label: milestoneLabel(translator, run.nextUnlock) })
      : translator.t('gameOver.allUnlocked');
  };
  const showSummit = (run) => {
    ready.hidden = true;
    gameOver.hidden = false;
    endingEyebrow.textContent = translator.t('summit.eyebrow');
    endingTitle.textContent = translator.t('summit.title');
    endingMessage.textContent = translator.t('summit.message');
    finalHeight.textContent = translator.t('gameOver.heightRecord', { height: run.score ?? 0, record: run.bestScore ?? 0 });
    nextUnlock.textContent = translator.t('summit.reward');
  };

  return { showReady, showPlaying, showGameOver, showSummit };
}
