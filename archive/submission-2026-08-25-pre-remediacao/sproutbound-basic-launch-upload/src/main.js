import { createRun } from './game/model.js';
import { createGameLoop } from './game/game-loop.js';
import { bindInput, createInputState } from './input.js';
import { stepRun } from './game/simulation.js';
import { createCanvasRenderer } from './render/canvas-renderer.js';
import { applyProgression } from './game/progression.js';
import { createSafeStorage } from './storage.js';
import { createHud } from './ui/hud.js';
import { createScreens } from './ui/screens.js';
import { createPlatformAdapter } from './platform-adapter.js';
import { createTranslator } from './i18n.js';

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
  const translator = createTranslator(documentRef.defaultView?.navigator?.language);
  documentRef.documentElement.lang = translator.locale === 'pt' ? 'pt-BR' : 'en';
  documentRef.title = translator.t('title');
  gameRoot.setAttribute('aria-label', translator.t('game'));
  canvas.setAttribute('aria-label', translator.t('canvas'));
  const input = createInputState();
  const unbindInput = bindInput(canvas, input);
  const renderer = createCanvasRenderer(canvas);
  const simulation = { run: createRun(), stepRun };
  const safeStorage = createSafeStorage(getBrowserStorage(documentRef));
  let progress = safeStorage.load();
  const platformAdapter = createPlatformAdapter();
  const hud = createHud(gameRoot, translator);
  let loop;
  const screens = createScreens(gameRoot, {
    translator,
    onRestart: async () => {
      await platformAdapter.requestCommercialBreak();
      input.left = false;
      input.right = false;
      input.pointerX = null;
      input.active = false;
      input.pressed = false;
      simulation.run = createRun();
      hud.update(simulation.run);
      hud.showNextObjective(simulation.run.nextUnlock);
      screens.showReady();
      renderer.render(simulation.run);
      loop.resume();
    },
  });
  const ui = {
    update(run, events) {
      hud.update(run);
      if (run.nextUnlock) hud.showNextObjective(run.nextUnlock);
      if (events.includes('gameplayStarted')) {
        void platformAdapter.startGameplay();
      }
      if (events.includes('milestoneReached')) {
        const result = applyProgression(progress, { type: 'height', height: run.score });
        progress = result.progress;
        safeStorage.save(progress);
      }
      if (events.includes('summitReached')) {
        void platformAdapter.stopGameplay();
        screens.showSummit(run);
        hud.showObjective(translator.t('objective.summit'));
      } else if (events.includes('playerDied')) {
        void platformAdapter.stopGameplay();
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
  hud.showNextObjective(simulation.run.nextUnlock);
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
    platformAdapter,
  };
}

if (typeof window !== 'undefined' && window.document) {
  createApp(window.document);
}
