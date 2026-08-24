import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');

test('offline shell exposes one local game canvas', async () => {
  const html = await readFile(resolve(projectRoot, 'index.html'), 'utf8');

  assert.match(html, /id=["']game["']/);
  assert.match(html, /<canvas\b/i);
  assert.match(html, /<script[^>]+type=["']module["'][^>]+src=["']\.\/src\/main\.js["']/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test('GameDistribution bootstrap stays local until the platform build injects its SDK', async () => {
  const entrypoint = await readFile(resolve(projectRoot, 'src/main-gamedistribution.js'), 'utf8');

  assert.match(entrypoint, /\.\/platform-adapters\/gamedistribution\.js/);
  assert.doesNotMatch(entrypoint, /https?:\/\//i);
});
