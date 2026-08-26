import { createRun } from './game/model.js';
import { createGameLoop } from './game/game-loop.js';
import { bindInput, createInputState } from './input.js';
import { stepRun } from './game/simulation.js';
import { createCanvasRenderer } from './render/canvas-renderer.js';
import { getVisualTier, getCurrentRoute, applyRouteResult, migrateProgress, selectRoute } from './game/progression.js';
import { createObjectiveTracker, trackObjective, evaluateObjective, getRoute, getNextRoute } from './game/campaign.js';
import { shouldPause, shouldResume } from './game/pause.js';
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
  let paused = false;
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
    paused = false;
    audio.stopMusic();
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
    onResume: () => resumeGame(),
    onRoutes: () => openCampaign(),
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

  const soundButtons = [gameRoot.querySelector('#sound-button'), gameRoot.querySelector('#pause-sound')].filter(Boolean);
  const syncSoundButtons = () => {
    const label = translator.t(audio.isMuted() ? 'sound.off' : 'sound.on');
    for (const button of soundButtons) {
      button.textContent = label;
      button.setAttribute('aria-pressed', String(audio.isMuted()));
      button.setAttribute('aria-label', translator.t('sound.label'));
    }
  };
  const toggleSound = () => {
    const nowMuted = audio.toggleMuted();
    if (!nowMuted && simulation.run.state === 'playing' && !paused) audio.startMusic(route.biome);
    syncSoundButtons();
  };
  for (const button of soundButtons) button.addEventListener('click', toggleSound);
  syncSoundButtons();

  function openCampaign() {
    paused = true;
    loop.pause();
    audio.stopMusic();
    screens.hideAll();
    campaign.show(progress, route.id);
  }

  // Pausa de verdade: antes o evento de visibilidade só limpava o input e a
  // partida seguia rodando, então trocar de aba custava a rodada.
  function pauseGame(trigger = 'button') {
    if (!shouldPause({ runState: simulation.run.state, paused, campaignOpen: campaign.isOpen(), trigger })) return;
    paused = true;
    loop.pause();
    audio.stopMusic();
    input.left = false;
    input.right = false;
    input.pressed = false;
    input.active = false;
    platformAdapter.pauseInput();
    screens.showPause(simulation.run);
  }

  function resumeGame() {
    if (!shouldResume({ paused, campaignOpen: campaign.isOpen() })) return;
    paused = false;
    campaign.hide();
    screens.showPlaying();
    platformAdapter.resumeInput();
    if (!audio.isMuted()) audio.startMusic(route.biome);
    loop.resume();
  }

  gameRoot.querySelector('#routes-button')?.addEventListener('click', openCampaign);
  gameRoot.querySelector('#pause-button')?.addEventListener('click', () => (paused ? resumeGame() : pauseGame()));
  documentRef.addEventListener('visibilitychange', () => { if (documentRef.hidden) pauseGame('hidden'); });
  documentRef.defaultView?.addEventListener('blur', () => pauseGame('blur'));
  documentRef.defaultView?.addEventListener('keydown', (event) => {
    // Escape não é usado: a plataforma reserva a tecla para sair do fullscreen.
    if (event.code !== 'KeyP') return;
    event.preventDefault();
    if (paused) resumeGame(); else pauseGame('key');
  });
  const ui = {
    update(run, events, dt = 0) {
      audio.playEvents(events);
      hud.update(run);
      objective = trackObjective(objective, events, dt);
      if (run.nextUnlock) hud.showNextObjective(run.nextUnlock);
      if (events.includes('gameplayStarted')) {
        void platformAdapter.startGameplay();
        audio.setBiome(route.biome);
        if (!audio.isMuted()) audio.startMusic(route.biome);
      }
      if (events.includes('summitReached')) {
        void platformAdapter.stopGameplay();
        audio.stopMusic();
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
        audio.stopMusic();
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
