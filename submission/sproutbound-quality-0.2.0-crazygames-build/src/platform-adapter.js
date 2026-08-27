export function createPlatformAdapter({ onPause, onResume } = {}) {
  let lifecycle = 'stopped';
  let inputPaused = false;
  const events = [];

  const startGameplay = async () => {
    if (lifecycle === 'playing') return false;
    lifecycle = 'playing';
    events.push('start');
    return true;
  };

  const stopGameplay = async () => {
    if (lifecycle === 'stopped') return false;
    lifecycle = 'stopped';
    events.push('stop');
    return true;
  };

  const requestCommercialBreak = async () => false;

  const pauseInput = () => {
    if (inputPaused) return;
    inputPaused = true;
    events.push('pause');
    onPause?.();
  };

  const resumeInput = () => {
    if (!inputPaused) return;
    inputPaused = false;
    events.push('resume');
    onResume?.();
  };

  return {
    startGameplay,
    stopGameplay,
    requestCommercialBreak,
    pauseInput,
    resumeInput,
    getState: () => lifecycle,
    getEvents: () => [...events],
    isInputPaused: () => inputPaused,
  };
}
