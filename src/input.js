const KEY_DIRECTIONS = new Map([
  ['ArrowLeft', 'left'],
  ['KeyA', 'left'],
  ['ArrowRight', 'right'],
  ['KeyD', 'right'],
]);
const LOGICAL_WIDTH = 360;

export function createInputState() {
  return {
    left: false,
    right: false,
    pointerX: null,
    active: false,
  };
}

function clearInput(state) {
  state.left = false;
  state.right = false;
  state.pointerX = null;
  state.active = false;
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
    if (event.cancelable) event.preventDefault();
  };
  const onKeyUp = (event) => {
    const direction = KEY_DIRECTIONS.get(event.code);
    if (!direction) return;
    state[direction] = false;
    state.active = state.left || state.right;
  };
  const onPointerDown = (event) => {
    state.pointerX = pointerPosition(target, event);
    state.active = true;
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
  target.addEventListener('visibilitychange', onClear);

  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
    target.removeEventListener('pointerdown', onPointerDown);
    target.removeEventListener('pointermove', onPointerMove);
    target.removeEventListener('pointerup', onPointerUp);
    target.removeEventListener('pointercancel', onPointerUp);
    target.removeEventListener('pointerleave', onPointerUp);
    target.removeEventListener('blur', onClear);
    target.removeEventListener('visibilitychange', onClear);
    clearInput(state);
  };
}

export function readInput(state, viewportWidth) {
  if (state.left && !state.right) return { axis: -1, primary: state.active };
  if (state.right && !state.left) return { axis: 1, primary: state.active };
  if (state.active && state.pointerX !== null) {
    return {
      axis: state.pointerX < viewportWidth / 2 ? -1 : 1,
      primary: true,
    };
  }
  return { axis: 0, primary: false };
}
