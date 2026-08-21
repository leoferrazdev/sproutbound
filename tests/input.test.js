import test from 'node:test';
import assert from 'node:assert/strict';
import { bindInput, createInputState, readInput } from '../src/input.js';

function dispatch(target, type, init = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, init);
  target.dispatchEvent(event);
}

test('keyboard input maps A and ArrowRight to the expected axis', () => {
  const target = new EventTarget();
  const state = createInputState();
  const unbind = bindInput(target, state);

  dispatch(target, 'keydown', { code: 'KeyA' });
  assert.equal(readInput(state, 360).axis, -1);
  dispatch(target, 'keyup', { code: 'KeyA' });
  dispatch(target, 'keydown', { code: 'ArrowRight' });
  assert.equal(readInput(state, 360).axis, 1);

  unbind();
});

test('pointer input maps to the logical stage halves', () => {
  const target = new EventTarget();
  const state = createInputState();
  const unbind = bindInput(target, state);

  dispatch(target, 'pointerdown', { clientX: 40 });
  assert.equal(readInput(state, 360).axis, -1);
  dispatch(target, 'pointermove', { clientX: 320 });
  assert.equal(readInput(state, 360).axis, 1);

  unbind();
});

test('blur clears active input and unbind removes listeners', () => {
  const target = new EventTarget();
  const state = createInputState();
  const unbind = bindInput(target, state);

  dispatch(target, 'keydown', { code: 'KeyD' });
  assert.equal(state.active, true);
  dispatch(target, 'blur');
  assert.equal(readInput(state, 360).axis, 0);

  unbind();
  dispatch(target, 'keydown', { code: 'KeyD' });
  assert.equal(readInput(state, 360).axis, 0);
});
