import { readInput } from '../input.js';

export function advanceCamera(run, viewportHeight) {
  const current = run.cameraY ?? 0;
  const target = run.player.y - viewportHeight * 0.36;
  return Math.min(current, target);
}

export function createGameLoop({ canvas, simulation, renderer, ui, input }) {
  const view = canvas.ownerDocument?.defaultView ?? globalThis;
  const request = view.requestAnimationFrame?.bind(view);
  const cancel = view.cancelAnimationFrame?.bind(view);
  let animationFrame = null;
  let running = false;
  let lastTime = 0;

  const frame = (time) => {
    if (!running) return;
    const elapsed = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 1 / 15);
    lastTime = time;
    const axis = readInput(input, canvas.width || 360).axis;
    const result = simulation.stepRun(simulation.run, {
      left: axis < 0,
      right: axis > 0,
      primary: input.active,
    }, elapsed);
    simulation.run = {
      ...result.run,
      cameraY: advanceCamera(result.run, canvas.height || 640),
    };
    renderer?.render(simulation.run);
    ui?.update(simulation.run, result.events);
    animationFrame = request?.(frame) ?? null;
  };

  const start = () => {
    if (running) return;
    running = true;
    lastTime = 0;
    animationFrame = request?.(frame) ?? null;
  };
  const stop = () => {
    running = false;
    if (animationFrame !== null) cancel?.(animationFrame);
    animationFrame = null;
  };
  const pause = () => stop();
  const resume = () => start();

  return { start, stop, pause, resume };
}
