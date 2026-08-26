import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlatform, readProjectVersion } from './build-platform.mjs';
import { createCrazyGamesProfile } from '../platforms/crazygames/config.mjs';

export async function buildCrazyGames({
  projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  submissionRoot = join(projectRoot, 'submission'),
  outputRoot,
  zipPath,
} = {}) {
  const root = resolve(projectRoot);
  const version = await readProjectVersion(root);
  const profile = createCrazyGamesProfile(version);
  return buildPlatform({
    projectRoot: root,
    profile,
    outputRoot: outputRoot ?? join(submissionRoot, profile.outputDirectory),
    zipPath: zipPath ?? join(submissionRoot, profile.zipFile),
  });
}

const isMainModule = process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const result = await buildCrazyGames();
  process.stdout.write(`CrazyGames build created: ${result.outputRoot}\n`);
  process.stdout.write(`CrazyGames archive created: ${result.zipPath}\n`);
}
