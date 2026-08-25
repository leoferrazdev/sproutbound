import { createPlatformAdapter } from '../platform-adapter.js';

export function createGameDistributionAdapter({
  windowRef = globalThis,
  sdk,
  onPause,
  onResume,
  onMute = () => {},
  onUnmute = () => {},
  commercialBreakTimeoutMs = 5000,
} = {}) {
  const base = createPlatformAdapter({ onPause, onResume });
  let pendingBreak = null;
  let sdkPaused = false;

  const getSdk = () => sdk ?? windowRef?.gdsdk;
  const finishBreak = (result) => {
    if (!pendingBreak) return;
    const pending = pendingBreak;
    pendingBreak = null;
    windowRef?.clearTimeout?.(pending.timer);
    pending.resolve(result);
  };

  const handleEvent = (event = {}) => {
    if (event.name === 'SDK_GAME_PAUSE') {
      if (sdkPaused) return;
      sdkPaused = true;
      base.pauseInput();
      onMute();
      return;
    }

    if (event.name === 'SDK_GAME_START') {
      if (sdkPaused) {
        sdkPaused = false;
        base.resumeInput();
        onUnmute();
      }
      finishBreak(true);
    }
  };

  if (windowRef) {
    windowRef.__sproutboundGameDistributionEvent = handleEvent;
  }

  const requestCommercialBreak = async () => {
    const currentSdk = getSdk();
    if (typeof currentSdk?.showAd !== 'function') return false;
    if (pendingBreak) return pendingBreak.promise;

    let resolveBreak;
    const promise = new Promise((resolve) => {
      resolveBreak = resolve;
    });
    const timer = windowRef?.setTimeout?.(
      () => finishBreak(false),
      commercialBreakTimeoutMs,
    );
    pendingBreak = { promise, resolve: resolveBreak, timer };
    try {
      currentSdk.showAd();
    } catch {
      finishBreak(false);
    }

    return promise;
  };

  return {
    ...base,
    handleEvent,
    requestCommercialBreak,
    getSdkStatus: () => (
      typeof getSdk()?.showAd === 'function' ? 'available' : 'unavailable'
    ),
  };
}
