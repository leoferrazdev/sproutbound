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
