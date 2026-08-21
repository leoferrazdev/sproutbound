import { createRun } from './game/model.js';
import { createGameLoop } from './game/game-loop.js';
import { bindInput, createInputState } from './input.js';
import { stepRun } from './game/simulation.js';
import { createCanvasRenderer } from './render/canvas-renderer.js';
import { applyProgression } from './game/progression.js';
import { createSafeStorage } from './storage.js';
import { createHud } from './ui/hud.js';
import { createScreens } from './ui/screens.js';

function getBrowserStorage(documentRef) {
  try {
    return documentRef.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}

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
  const safeStorage = createSafeStorage(getBrowserStorage(documentRef));
  let progress = safeStorage.load();
  const hud = createHud(gameRoot);
  let loop;
  const screens = createScreens(gameRoot, {
    onRestart: () => {
      input.left = false;
      input.right = false;
      input.pointerX = null;
      input.active = false;
      simulation.run = createRun();
      hud.update(simulation.run);
      hud.showObjective(`Próximo: ${simulation.run.nextUnlock.label}`);
      screens.showReady();
      renderer.render(simulation.run);
      loop.resume();
    },
  });
  const ui = {
    update(run, events) {
      hud.update(run);
      if (run.nextUnlock) hud.showObjective(`Próximo: ${run.nextUnlock.label}`);
      if (events.includes('milestoneReached')) {
        const result = applyProgression(progress, { type: 'height', height: run.score });
        progress = result.progress;
        safeStorage.save(progress);
      }
      if (events.includes('playerDied')) {
        screens.showGameOver(run);
      } else if (run.state === 'playing') {
        screens.showPlaying();
      } else if (run.state === 'ready') {
        screens.showReady();
      }
    },
  };
  const resize = () => renderer.resize({
    width: canvas.clientWidth || 360,
    height: canvas.clientHeight || 640,
    dpr: documentRef.defaultView?.devicePixelRatio || 1,
  });
  resize();
  renderer.render(simulation.run);
  hud.update(simulation.run);
  hud.showObjective(`Próximo: ${simulation.run.nextUnlock.label}`);
  screens.showReady();
  loop = createGameLoop({ canvas, simulation, renderer, ui, input });
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
