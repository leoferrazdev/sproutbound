import { createRun } from './game/model.js';
import { createGameLoop } from './game/game-loop.js';
import { bindInput, createInputState } from './input.js';
import { stepRun } from './game/simulation.js';
import { createCanvasRenderer } from './render/canvas-renderer.js';

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
  const input = createInputState();
  const unbindInput = bindInput(canvas, input);
  const renderer = createCanvasRenderer(canvas);
  const simulation = { run: createRun(), stepRun };
  const resize = () => renderer.resize({
    width: canvas.clientWidth || 360,
    height: canvas.clientHeight || 640,
    dpr: documentRef.defaultView?.devicePixelRatio || 1,
  });
  resize();
  renderer.render(simulation.run);
  const loop = createGameLoop({ canvas, simulation, renderer, input });
  documentRef.defaultView?.addEventListener('resize', resize);
  loop.start();
  return {
    gameRoot,
    canvas,
    run: simulation.run,
    input,
    unbindInput,
    renderer,
    simulation,
    loop,
  };
}

if (typeof window !== 'undefined' && window.document) {
  createApp(window.document);
}
