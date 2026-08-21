export function createScreens(root, actions = {}) {
  const ready = root.querySelector('#ready-screen');
  const gameOver = root.querySelector('#game-over-screen');
  const endingEyebrow = root.querySelector('#ending-eyebrow');
  const endingTitle = root.querySelector('#ending-title');
  const endingMessage = root.querySelector('#ending-message');
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
    endingEyebrow.textContent = 'FIM DA SUBIDA';
    endingTitle.textContent = 'Pip precisa de mais uma tentativa.';
    endingMessage.textContent = 'Todos os visuais iniciais desbloqueados';
    finalHeight.textContent = `Altura: ${run.score ?? 0} m · Recorde: ${run.bestScore ?? 0} m`;
    nextUnlock.textContent = run.nextUnlock
      ? `Próximo: ${run.nextUnlock.label}`
      : 'Todos os visuais iniciais desbloqueados';
  };
  const showSummit = (run) => {
    ready.hidden = true;
    gameOver.hidden = false;
    endingEyebrow.textContent = 'CUME ALCANÇADO';
    endingTitle.textContent = 'Cume alcançado!';
    endingMessage.textContent = 'Coroa do cume desbloqueada.';
    finalHeight.textContent = `Altura: ${run.score ?? 0} m · Recorde: ${run.bestScore ?? 0} m`;
    nextUnlock.textContent = 'Recompensa: Coroa do cume';
  };

  return { showReady, showPlaying, showGameOver, showSummit };
}
