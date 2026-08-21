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
  assert.match(html, /aria-label=["'][^"']*(altura|record|pausa|reiniciar|jogar novamente)/i);
  assert.match(html, /Jogar novamente/);
  assert.match(html, /Cume alcançado/);
  assert.match(html, /Coroa do cume/);
});

test('responsive shell keeps portrait aspect ratio and safe-area behavior', async () => {
  const css = await readFile(cssPath, 'utf8');

  assert.match(css, /aspect-ratio\s*:\s*9\s*\/\s*16/);
  assert.match(css, /safe-area-inset/);
  assert.match(css, /touch-action/);
  assert.match(css, /user-select/);
});
