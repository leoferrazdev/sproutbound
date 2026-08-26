const KEY_DIRECTIONS = new Map([
  ['ArrowLeft', 'left'],
  ['KeyA', 'left'],
  ['KeyQ', 'left'],
  ['KeyZ', 'left'],
  ['ArrowRight', 'right'],
  ['KeyD', 'right'],
]);
import { STAGE_WIDTH as LOGICAL_WIDTH } from './game/stage.js';

export function createInputState() {
  return {
    left: false,
    right: false,
    pointerX: null,
    active: false,
    pressed: false,
  };
}

function clearInput(state) {
  state.left = false;
  state.right = false;
  state.pointerX = null;
  state.active = false;
  state.pressed = false;
}

function pointerPosition(target, event) {
  const rect = typeof target.getBoundingClientRect === 'function'
    ? target.getBoundingClientRect()
    : { left: 0 };
  const cssWidth = rect.width || LOGICAL_WIDTH;
  return ((event.clientX - rect.left) / cssWidth) * LOGICAL_WIDTH;
}

export function bindInput(target, state) {
  const onKeyDown = (event) => {
    const direction = KEY_DIRECTIONS.get(event.code);
    if (!direction) return;
    state[direction] = true;
    state.active = true;
    state.pressed = true;
    target.focus?.({ preventScroll: true });
    if (event.cancelable) event.preventDefault();
  };
  const onKeyUp = (event) => {
    const direction = KEY_DIRECTIONS.get(event.code);
    if (!direction) return;
    state[direction] = false;
    state.active = state.left || state.right;
  };
  const onPointerDown = (event) => {
    target.focus?.({ preventScroll: true });
    state.pointerX = pointerPosition(target, event);
    state.active = true;
    state.pressed = true;
    if (event.cancelable) event.preventDefault();
  };
  const onPointerMove = (event) => {
    if (!state.active) return;
    state.pointerX = pointerPosition(target, event);
    if (event.cancelable) event.preventDefault();
  };
  const onPointerUp = () => {
    state.pointerX = null;
    state.active = state.left || state.right;
  };
  const onClear = () => clearInput(state);

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointermove', onPointerMove);
  target.addEventListener('pointerup', onPointerUp);
  target.addEventListener('pointercancel', onPointerUp);
  target.addEventListener('pointerleave', onPointerUp);
  target.addEventListener('blur', onClear);
  const ownerDocument = target.ownerDocument;
  ownerDocument?.addEventListener('visibilitychange', onClear);

  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
    target.removeEventListener('pointerdown', onPointerDown);
    target.removeEventListener('pointermove', onPointerMove);
    target.removeEventListener('pointerup', onPointerUp);
    target.removeEventListener('pointercancel', onPointerUp);
    target.removeEventListener('pointerleave', onPointerUp);
    target.removeEventListener('blur', onClear);
    ownerDocument?.removeEventListener('visibilitychange', onClear);
    clearInput(state);
  };
}

export function readInput(state, viewportWidth) {
  const primary = state.active || state.pressed;
  state.pressed = false;
  if (state.left && !state.right) return { axis: -1, primary };
  if (state.right && !state.left) return { axis: 1, primary };
  if (state.active && state.pointerX !== null) {
    return {
      axis: state.pointerX < viewportWidth / 2 ? -1 : 1,
      primary,
    };
  }
  return { axis: 0, primary };
}
