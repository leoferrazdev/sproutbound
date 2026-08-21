export function createScreens(root, actions = {}) {
  const ready = root.querySelector('#ready-screen');
  const gameOver = root.querySelector('#game-over-screen');
  const finalHeight = root.querySelector('#final-height');
  const nextUnlock = root.querySelector('#next-unlock');
  const restart = root.querySelector('#restart-button');

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
    finalHeight.textContent = `Altura: ${run.score ?? 0} m · Recorde: ${run.bestScore ?? 0} m`;
    nextUnlock.textContent = run.nextUnlock
      ? `Próximo: ${run.nextUnlock.label}`
      : 'Todos os visuais iniciais desbloqueados';
  };

  return { showReady, showPlaying, showGameOver };
}
