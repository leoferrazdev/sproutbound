import { createRun } from './game/model.js';
import { createGameLoop } from './game/game-loop.js';
import { bindInput, createInputState } from './input.js';
import { stepRun } from './game/simulation.js';
import { createCanvasRenderer } from './render/canvas-renderer.js';
import { getVisualTier, getCurrentRoute, applyRouteResult, migrateProgress, selectRoute } from './game/progression.js';
import { createObjectiveTracker, trackObjective, evaluateObjective, getRoute, getNextRoute } from './game/campaign.js';
import { createSafeStorage } from './storage.js';
import { createHud } from './ui/hud.js';
import { createScreens } from './ui/screens.js';
import { createCampaignScreen } from './ui/campaign-screen.js';
import { createPlatformAdapter } from './platform-adapter.js';
import { createTranslator, getPreferredLanguage, routeLabel } from './i18n.js';
import { createAudio } from './audio.js';

function getBrowserStorage(documentRef) {
  try {
    return documentRef.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createApp(
  documentRef,
  { platformAdapterFactory = createPlatformAdapter } = {},
) {
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
  const translator = createTranslator(getPreferredLanguage(documentRef.defaultView));
  documentRef.documentElement.lang = translator.locale === 'pt' ? 'pt-BR' : 'en';
  documentRef.title = translator.t('title');
  gameRoot.setAttribute('aria-label', translator.t('game'));
  canvas.setAttribute('aria-label', translator.t('canvas'));
  const guide = gameRoot.querySelector('#desktop-guide');
  if (guide) {
    guide.querySelector('.eyebrow').textContent = translator.t('guide.eyebrow');
    guide.querySelector('h2').textContent = translator.t('guide.title');
    guide.querySelector('p:not(.eyebrow)').textContent = translator.t('guide.intro');
    const guideItems = guide.querySelectorAll('li');
    [translator.t('guide.safe'), translator.t('guide.shield'), translator.t('guide.summit')]
      .forEach((text, index) => { if (guideItems[index]) guideItems[index].textContent = text; });
    guide.querySelector('.guide-note').textContent = translator.t('guide.note');
  }
  const input = createInputState();
  const unbindInput = bindInput(canvas, input);
  const renderer = createCanvasRenderer(canvas);
  const safeStorage = createSafeStorage(getBrowserStorage(documentRef));
  let progress = migrateProgress(safeStorage.load());
  let route = getCurrentRoute(progress);
  let objective = createObjectiveTracker(route);
  const simulation = { run: createRun(route, progress), stepRun };
  const audio = createAudio({ windowRef: documentRef.defaultView });
  let loop;
  const platformAdapter = platformAdapterFactory({
    onPause: () => loop?.pause(),
    onResume: () => loop?.resume(),
    onMute: () => audio.mute(),
    onUnmute: () => audio.unmute(),
  });
  const hud = createHud(gameRoot, translator);
  let campaign;
  const startRoute = (nextRoute) => {
    route = nextRoute;
    objective = createObjectiveTracker(route);
    input.left = false;
    input.right = false;
    input.pointerX = null;
    input.active = false;
    input.pressed = false;
    simulation.run = createRun(route, progress);
    hud.update(simulation.run);
    screens.showReady();
    campaign?.hide();
    renderer.render(simulation.run);
    loop.resume();
  };

  const screens = createScreens(gameRoot, {
    translator,
    onAdvance: async () => {
      await platformAdapter.requestCommercialBreak();
      startRoute(getNextRoute(route) ?? route);
    },
    onRestart: async () => {
      await platformAdapter.requestCommercialBreak();
      startRoute(route);
    },
  });

  campaign = createCampaignScreen(gameRoot, {
    translator,
    onSelect: (routeId) => {
      progress = selectRoute(progress, routeId);
      safeStorage.save(progress);
      startRoute(getRoute(routeId) ?? route);
    },
    onClose: () => {
      campaign.hide();
      screens.showReady();
      loop.resume();
    },
  });

  const openCampaign = () => {
    loop.pause();
    screens.hideAll();
    campaign.show(progress, route.id);
  };
  gameRoot.querySelector('#routes-button')?.addEventListener('click', openCampaign);
  const ui = {
    update(run, events, dt = 0) {
      audio.playEvents(events);
      hud.update(run);
      objective = trackObjective(objective, events, dt);
      if (run.nextUnlock) hud.showNextObjective(run.nextUnlock);
      if (events.includes('gameplayStarted')) {
        void platformAdapter.startGameplay();
      }
      if (events.includes('summitReached')) {
        void platformAdapter.stopGameplay();
        const verdict = evaluateObjective(objective);
        const result = applyRouteResult(progress, {
          routeId: route.id,
          cleared: verdict.cleared,
          objectiveMet: verdict.objectiveMet,
          seconds: objective.seconds,
          drops: objective.drops,
          height: run.score,
        });
        progress = result.progress;
        safeStorage.save(progress);
        simulation.run = { ...simulation.run, visualTier: getVisualTier(progress) };
        const following = getNextRoute(route);
        screens.showSummit({
          ...run,
          objective,
          objectiveMet: verdict.objectiveMet,
          nextRouteLabel: result.routeUnlocked ? routeLabel(translator, getRoute(result.routeUnlocked)) : null,
          isLastRoute: !following,
        });
        campaign.render(progress, route.id);
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
    audio,
  };
}
