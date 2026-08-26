import { readInput } from '../input.js';
import { createFeedbackState, stepFeedback } from './feedback.js';

import { STAGE_WIDTH as LOGICAL_WIDTH, STAGE_HEIGHT as LOGICAL_HEIGHT } from './stage.js';

export function advanceCamera(run, viewportHeight) {
  const current = run.cameraY ?? 0;
  const target = run.player.y - viewportHeight * 0.36;
  return Math.min(current, target);
}

export function createGameLoop({ canvas, simulation, renderer, backdrop = null, ui, input }) {
  const view = canvas.ownerDocument?.defaultView ?? globalThis;
  const request = view.requestAnimationFrame?.bind(view);
  const cancel = view.cancelAnimationFrame?.bind(view);
  let animationFrame = null;
  let running = false;
  let lastTime = 0;
  let feedback = createFeedbackState();

  const frame = (time) => {
    if (!running) return;
    const elapsed = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 1 / 15);
    lastTime = time;
    const normalizedInput = readInput(input, LOGICAL_WIDTH);
    const axis = normalizedInput.axis;
    const result = simulation.stepRun(simulation.run, {
      left: axis < 0,
      right: axis > 0,
      primary: normalizedInput.primary,
    }, elapsed);
    feedback = stepFeedback(feedback, result.events, elapsed, { player: result.run.player });
    simulation.run = {
      ...result.run,
      feedback,
      cameraY: advanceCamera(result.run, LOGICAL_HEIGHT),
    };
    backdrop?.render(simulation.run);
    renderer?.render(simulation.run);
    ui?.update(simulation.run, result.events, elapsed);
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
