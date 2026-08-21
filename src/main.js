export function createApp(documentRef) {
  const gameRoot = documentRef.querySelector('#game');
  if (!gameRoot) {
    throw new Error('Game root not found');
  }

  let canvas = gameRoot.querySelector('canvas');
  if (!canvas) {
    canvas = documentRef.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.setAttribute('aria-label', 'Jogo Salto ao Sol');
    gameRoot.querySelector('.stage-shell')?.append(canvas);
  }

  canvas.width = 360;
  canvas.height = 640;
  return { gameRoot, canvas };
}

if (typeof window !== 'undefined' && window.document) {
  createApp(window.document);
}
