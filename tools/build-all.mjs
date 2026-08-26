import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCrazyGames } from './build-crazygames.mjs';
import { buildGameDistribution } from './build-gamedistribution.mjs';
import { buildGamePix } from './build-gamepix.mjs';
import { createGameDistributionProfile } from '../platforms/gamedistribution/config.mjs';
import { readProjectVersion } from './build-platform.mjs';

export async function buildAll({
  projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  submissionRoot = join(projectRoot, 'submission'),
} = {}) {
  const root = resolve(projectRoot);
  const target = resolve(submissionRoot);
  const version = await readProjectVersion(root);
  const gameDistributionProfile = createGameDistributionProfile(version);
  return [
    await buildCrazyGames({ projectRoot: root, submissionRoot: target }),
    await buildGamePix({ projectRoot: root, submissionRoot: target }),
    await buildGameDistribution({
      projectRoot: root,
      submissionRoot: target,
      outputRoot: join(target, gameDistributionProfile.outputDirectory),
      zipPath: join(target, gameDistributionProfile.zipFile),
    }),
  ];
}

const isMainModule = process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const results = await buildAll();
  for (const result of results) {
    process.stdout.write(`${result.manifest.platform} build created: ${result.zipPath}\n`);
  }
}
