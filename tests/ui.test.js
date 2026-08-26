import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexPath = new URL('../index.html', import.meta.url);
const cssPath = new URL('../styles.css', import.meta.url);

test('shell exposes accessible HUD, objective, pause state and explicit restart', async () => {
  const html = await readFile(indexPath, 'utf8');

  for (const id of [
    'hud',
    'height-value',
    'record-value',
    'objective',
    'pause-state',
    'screens',
    'ending-eyebrow',
    'ending-title',
    'ending-message',
    'restart-button',
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /aria-label=["'][^"']*(height|best|game|start|end)/i);
  assert.match(html, /Play again/);
  assert.match(html, /RUN OVER/);
  assert.match(html, /Next: Two-leaf sprout/);
  // a barra de texto lateral saiu: o objetivo vive no HUD e os controles na tela
  // inicial, e o fundo em tela cheia ocupa o espaço que ela desperdiçava
  assert.doesNotMatch(html, /id=["']desktop-guide["']/);
  assert.match(html, /id=["']backdrop-canvas["']/);
  assert.match(html, /id=["']goal-banner["']/);
  assert.match(html, /tabindex=["']0["']/);
  assert.match(html, /id=["']solar-counter["']/);
});

test('responsive shell keeps portrait aspect ratio and safe-area behavior', async () => {
  const css = await readFile(cssPath, 'utf8');

  // o palco passou de 9:16 para 3:4 para ocupar mais largura no desktop
  assert.match(css, /aspect-ratio\s*:\s*3\s*\/\s*4/);
  assert.match(css, /safe-area-inset/);
  assert.match(css, /touch-action/);
  assert.match(css, /user-select/);
});
