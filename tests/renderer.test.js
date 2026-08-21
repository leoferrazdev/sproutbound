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
    lines: [],
    fillStyles: [],
    createLinearGradient: () => ({ addColorStop: () => {} }),
    beginPath: () => {},
    moveTo: () => {},
    lineTo: (x, y) => {
      context.lines.push({ x, y });
    },
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
    set fillStyle(value) {
      this.fillStyles.push(value);
    },
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

test('fixed leaf dips visually while Pip lands on it', () => {
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

  renderer.render({
    cameraY: 0,
    platforms: [{ x: 100, y: 200, width: 80, height: 18, kind: 'leaf', impactTime: 0.09 }],
    thorns: [],
    sunDrops: [],
  });

  assert.ok(context.quadratics.some(({ endY }) => endY > 200 && endY < 210));
});

test('cracked leaf renders darker, cracked and displaced while collapsing', () => {
  const context = {
    quadratics: [],
    lines: [],
    fillStyles: [],
    createLinearGradient: () => ({ addColorStop: () => {} }),
    beginPath: () => {},
    moveTo: () => {},
    lineTo: (x, y) => {
      context.lines.push({ x, y });
    },
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
    set fillStyle(value) {
      this.fillStyles.push(value);
    },
  };
  const canvas = { width: 360, height: 640, getContext: () => context };
  const renderer = createCanvasRenderer(canvas);
  const platform = {
    x: 100, y: 200, width: 80, height: 18, kind: 'cracked-leaf',
    collapsing: true, collapseTime: 0.2,
  };

  renderer.render({ cameraY: 0, platforms: [platform], thorns: [], sunDrops: [] });

  assert.ok(context.fillStyles.includes('#4f8f68'));
  assert.ok(context.lines.length >= 2);
  assert.ok(context.quadratics.some(({ endY }) => endY > platform.y));
});

test('collapsed leaf is no longer rendered', () => {
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

  renderer.render({
    cameraY: 0,
    platforms: [{ x: 100, y: 200, width: 80, height: 18, kind: 'cracked-leaf', collapsed: true }],
    thorns: [],
    sunDrops: [],
  });

  assert.equal(context.quadratics.length, 0);
});

test('moving leaf uses a distinct visual cue while preserving the top plane', () => {
  const context = {
    quadratics: [],
    fillStyles: [],
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
    set fillStyle(value) {
      this.fillStyles.push(value);
    },
  };
  const canvas = { width: 360, height: 640, getContext: () => context };
  const renderer = createCanvasRenderer(canvas);

  renderer.render({
    cameraY: 0,
    platforms: [{ x: 100, y: 200, width: 80, height: 18, kind: 'moving-leaf' }],
    thorns: [],
    sunDrops: [],
  });

  assert.ok(context.fillStyles.includes('#65c9a6'));
  assert.ok(context.quadratics.some(({ endY }) => endY === 200));
});
