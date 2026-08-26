import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildCrazyGames } from '../tools/build-crazygames.mjs';
import { buildAll } from '../tools/build-all.mjs';
import { buildGamePix } from '../tools/build-gamepix.mjs';

const projectRoot = join(import.meta.dirname, '..');

test('CrazyGames build keeps the neutral entrypoint and excludes portal adapters', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'sproutbound-crazygames-'));
  try {
    const result = await buildCrazyGames({
      projectRoot,
      outputRoot: join(tempRoot, 'build'),
      zipPath: join(tempRoot, 'build.zip'),
    });
    const index = await readFile(join(result.outputRoot, 'index.html'), 'utf8');

    assert.match(index, /src\/main\.js/);
    assert.doesNotMatch(index, /GD_OPTIONS|main-gamedistribution|gamedistribution/i);
    await assert.rejects(stat(join(result.outputRoot, 'src', 'main-gamedistribution.js')));
    await assert.rejects(stat(join(result.outputRoot, 'src', 'platform-adapters')));
    await stat(result.zipPath);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test('GamePix build is neutral and writes a traceable manifest', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'sproutbound-gamepix-'));
  try {
    const result = await buildGamePix({
      projectRoot,
      outputRoot: join(tempRoot, 'build'),
      zipPath: join(tempRoot, 'build.zip'),
    });
    const index = await readFile(join(result.outputRoot, 'index.html'), 'utf8');
    const manifest = JSON.parse(await readFile(join(result.outputRoot, 'build-manifest.json'), 'utf8'));

    assert.match(index, /src\/main\.js/);
    assert.doesNotMatch(index, /GD_OPTIONS|main-gamedistribution|gamedistribution/i);
    assert.equal(manifest.platform, 'gamepix');
    assert.equal(manifest.entrypoint, 'src/main.js');
    assert.ok(manifest.files.includes('index.html'));
    assert.ok(manifest.files.includes('build-manifest.json'));
    await stat(result.zipPath);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test('buildAll creates one isolated manifest per platform', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'sproutbound-all-'));
  try {
    const results = await buildAll({ projectRoot, submissionRoot: tempRoot });
    assert.deepEqual(results.map(({ manifest }) => manifest.platform), [
      'crazygames',
      'gamepix',
      'gamedistribution',
    ]);
    for (const { outputRoot, zipPath, manifest } of results) {
      assert.equal(manifest.files.includes('index.html'), true);
      await stat(join(outputRoot, 'index.html'));
      await stat(zipPath);
    }
    const gamepixIndex = await readFile(
      join(results[1].outputRoot, 'index.html'),
      'utf8',
    );
    assert.doesNotMatch(gamepixIndex, /GD_OPTIONS|main-gamedistribution|gamedistribution/i);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
