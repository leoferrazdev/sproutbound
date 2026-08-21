import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvasRenderer } from '../src/render/canvas-renderer.js';

test('canvas renderer exposes resize and render without requiring a 2D context', () => {
  const canvas = {
    width: 360,
    height: 640,
    getContext: () => null,
  };
  const renderer = createCanvasRenderer(canvas);

  assert.equal(typeof renderer.resize, 'function');
  assert.equal(typeof renderer.render, 'function');
  assert.doesNotThrow(() => renderer.resize({ width: 720, height: 1280, dpr: 1 }));
  assert.doesNotThrow(() => renderer.render({ platforms: [], thorns: [], sunDrops: [] }));
});

test('leaf visual top uses the same plane as Pip feet on landing', () => {
  const context = {
    quadratics: [],
    createLinearGradient: () => ({ addColorStop: () => {} }),
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: (controlX, controlY, endX, endY) => {
      context.quadratics.push({ controlX, controlY, endX, endY });
    },
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    clearRect: () => {},
    setTransform: () => {},
    arc: () => {},
    ellipse: () => {},
    save: () => {},
    translate: () => {},
    scale: () => {},
    restore: () => {},
  };
  const canvas = { width: 360, height: 640, getContext: () => context };
  const renderer = createCanvasRenderer(canvas);
  const platform = { x: 100, y: 200, width: 80, height: 18, kind: 'leaf' };

  renderer.render({
    cameraY: 0,
    platforms: [platform],
    thorns: [],
    sunDrops: [],
    player: { x: 127, y: 166, width: 26, height: 34, dead: false, grounded: false },
  });

  assert.ok(context.quadratics.some(({ endY }) => endY === platform.y));
});
