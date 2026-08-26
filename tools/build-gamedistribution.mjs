import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { buildPlatform, readProjectVersion } from './build-platform.mjs';
import {
  createGameDistributionProfile,
  gameDistributionSdkUrl,
} from '../platforms/gamedistribution/config.mjs';
const gameId = '8ccb967dc0be492c9be5fc5a95f32fd5';
function platformIndex(baseHtml) {
  const platformScripts = `
    <script>
      window.GD_OPTIONS = {
        gameId: "${gameId}",
        advertisementSettings: { autoplay: false },
        onEvent(event) {
          window.__sproutboundGameDistributionEvent?.(event);
        },
      };
    </script>
    <script src="${gameDistributionSdkUrl}"></script>
    <script type="module" src="./src/main-gamedistribution.js"></script>`;
  const entrypointPattern = /    <script type="module" src="\.\/src\/main\.js"><\/script>/;
  if (!entrypointPattern.test(baseHtml)) {
    throw new Error('Base entrypoint script not found in index.html');
  }
  return baseHtml.replace(entrypointPattern, platformScripts);
}

export async function buildGameDistribution({
  projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  submissionRoot = join(projectRoot, 'submission'),
  outputRoot,
  zipPath,
} = {}) {
  const root = resolve(projectRoot);
  const version = await readProjectVersion(root);
  const profile = createGameDistributionProfile(version);
  const legacySubmissionRoot = resolve(root, 'submission');
  const useLegacyNames = outputRoot === undefined
    && zipPath === undefined
    && resolve(submissionRoot) === legacySubmissionRoot;
  return buildPlatform({
    projectRoot: root,
    profile,
    outputRoot: outputRoot ?? join(
      submissionRoot,
      useLegacyNames ? 'sproutbound-gamedistribution-build' : profile.outputDirectory,
    ),
    zipPath: zipPath ?? join(
      submissionRoot,
      useLegacyNames ? 'sproutbound-gamedistribution.zip' : profile.zipFile,
    ),
    transformIndex: platformIndex,
  }).then((result) => ({ ...result, gameId, sdkUrl: gameDistributionSdkUrl }));
}

const isMainModule = process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const result = await buildGameDistribution();
  process.stdout.write(`GameDistribution build created: ${result.zipPath}\n`);
}
