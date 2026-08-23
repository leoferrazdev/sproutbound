import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { auditBuild } from '../tools/check-build.mjs';

async function withFixture(files, callback) {
  const root = await mkdtemp(join(tmpdir(), 'sproutbound-audit-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const path = join(root, name);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
    }
    return await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('release audit catches external URLs and debug logging', async () => {
  const result = await withFixture({
    'index.html': '<script src="https://example.com/sdk.js"></script>',
    'game.js': 'console.log("debug");',
  }, (root) => auditBuild(root));

  assert.equal(result.ok, false);
  assert.equal(result.violations.length, 2);
});

test('release audit catches a bundle over 8 MB', async () => {
  const result = await withFixture({
    'large.js': 'x'.repeat(8 * 1024 * 1024 + 1),
  }, (root) => auditBuild(root));

  assert.equal(result.ok, false);
  assert.match(result.violations[0], /8 MB|limit/i);
});

test('release audit ignores submission media sources', async () => {
  const result = await withFixture({
    'media/covers/source.svg': '<svg xmlns="http://www.w3.org/2000/svg" />',
  }, (root) => auditBuild(root));

  assert.equal(result.ok, true);
});
