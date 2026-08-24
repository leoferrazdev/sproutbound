import { execFile as execFileCallback } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const execFile = promisify(execFileCallback);
const gameId = '8ccb967dc0be492c9be5fc5a95f32fd5';
const sdkUrl = 'https://html5.api.gamedistribution.com/main.min.js';

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
    <script src="${sdkUrl}"></script>
    <script type="module" src="./src/main-gamedistribution.js"></script>`;
  const entrypointPattern = /    <script type="module" src="\.\/src\/main\.js"><\/script>/;
  if (!entrypointPattern.test(baseHtml)) {
    throw new Error('Base entrypoint script not found in index.html');
  }
  return baseHtml.replace(entrypointPattern, platformScripts);
}

export async function buildGameDistribution({
  projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  outputRoot = join(projectRoot, 'submission', 'sproutbound-gamedistribution-build'),
  zipPath = join(projectRoot, 'submission', 'sproutbound-gamedistribution.zip'),
} = {}) {
  const root = resolve(projectRoot);
  const output = resolve(outputRoot);
  const archive = resolve(zipPath);
  const sourceIndex = await readFile(join(root, 'index.html'), 'utf8');

  await rm(output, { recursive: true, force: true });
  await rm(archive, { force: true });
  await mkdir(output, { recursive: true });
  await cp(join(root, 'styles.css'), join(output, 'styles.css'));
  await cp(join(root, 'src'), join(output, 'src'), { recursive: true });
  await writeFile(join(output, 'index.html'), platformIndex(sourceIndex), 'utf8');
  await mkdir(dirname(archive), { recursive: true });
  await execFile('tar', ['-a', '-c', '-f', archive, '-C', output, '.']);

  return { outputRoot: output, zipPath: archive, gameId, sdkUrl };
}

const isMainModule = process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const result = await buildGameDistribution();
  process.stdout.write(`GameDistribution build created: ${result.zipPath}\n`);
}
